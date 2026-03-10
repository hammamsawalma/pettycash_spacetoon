"use server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { isGlobalFinance } from "@/lib/rbac"
import { supportTicketSchema, sendMessageSchema } from "@/lib/validations/app-schemas"

export async function getMessages() {
    try {
        const session = await getSession();
        if (!session) return [];

        const isRestricted = !isGlobalFinance(session.role);

        // v5: Project chat only — no personal messages
        const messages = await prisma.message.findMany({
            where: {
                isProjectChat: true,  // v5: only project chats
                ...(isRestricted
                    ? {
                        project: {
                            OR: [
                                { managerId: session.id },
                                { members: { some: { userId: session.id } } }
                            ]
                        }
                    }
                    : {})
            },
            orderBy: { createdAt: 'desc' },
            take: 200, // A3: Prevent unbounded payload
            include: {
                sender: true,
                receiver: true,
            }
        });
        return messages;
    } catch (error) {
        console.error("Messages Fetch Error:", error);
        return [];
    }
}

export async function sendMessage(content: string, receiverId?: string, projectId?: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: "غير مصرح لك بإرسال رسائل" };
        }

        // v5: Require projectId — no personal chats
        if (!projectId) {
            return { error: "المحادثات الشخصية غير متاحة — يرجى استخدام شات المشروع" };
        }

        // v5: Verify user has access to this project
        if (!isGlobalFinance(session.role)) {
            const isMember = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [
                        { managerId: session.id },
                        { members: { some: { userId: session.id } } }
                    ]
                }
            });
            if (!isMember) {
                return { error: "غير مصرح لك بالمشاركة في هذا المشروع" };
            }
        }

        const validatedFields = sendMessageSchema.safeParse({ content, receiverId: undefined, projectId });

        if (!validatedFields.success) {
            return { error: validatedFields.error.issues[0].message };
        }

        const message = await prisma.message.create({
            data: {
                content,
                senderId: session.id,
                receiverId: null,
                projectId,
                isProjectChat: true
            },
            include: {
                sender: true,
                receiver: true
            }
        });

        return { success: true, message };

    } catch (error) {
        console.error("Send Message Error:", error);
        return { error: "حدث خطأ أثناء إرسال الرسالة" };
    }
}

export async function createSupportTicket(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: "غير مصرح لك بإرسال تذكرة" };
        }

        const validatedFields = supportTicketSchema.safeParse({
            type: formData.get("type"),
            priority: formData.get("priority"),
            title: formData.get("title"),
            description: formData.get("description"),
        });

        if (!validatedFields.success) {
            return { error: validatedFields.error.issues[0].message };
        }

        const { type, priority, title, description } = validatedFields.data;

        const notificationContent = `تذكرة جديدة من (${session.name}): [${type}] - [أولوية: ${priority}]\n\nالعنوان: ${title}\n\nالوصف: ${description}`;

        await prisma.notification.create({
            data: {
                title: "تذكرة دعم فني جديدة",
                content: notificationContent,
                targetRole: "ADMIN"
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Support Ticket Error:", error);
        return { error: "حدث خطأ أثناء إرسال التذكرة" };
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  LIVE SUPPORT CHAT — محادثة مباشرة مع الدعم الفني
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch support chat messages for the current user.
 * Admin can pass a userId to view a specific user's conversation.
 */
export async function getSupportMessages(userId?: string) {
    try {
        const session = await getSession();
        if (!session) return [];

        const isAdmin = session.role === "ADMIN";
        const targetUserId = isAdmin && userId ? userId : session.id;

        // Support messages: isProjectChat = false, no projectId
        // Thread between the user and any admin
        const messages = await prisma.message.findMany({
            where: {
                isProjectChat: false,
                projectId: null,
                OR: [
                    { senderId: targetUserId },
                    { receiverId: targetUserId },
                ]
            },
            orderBy: { createdAt: 'asc' },
            take: 100,
            include: {
                sender: { select: { id: true, name: true, role: true, image: true } },
                receiver: { select: { id: true, name: true, role: true, image: true } },
            }
        });

        return messages;
    } catch (error) {
        console.error("Support Messages Fetch Error:", error);
        return [];
    }
}

/**
 * Send a support chat message.
 * - USER sends to admins (receiverId = null, admin picks up)
 * - ADMIN sends to a specific userId
 */
export async function sendSupportMessage(content: string, targetUserId?: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: "غير مصرح لك بإرسال رسائل" };
        }

        if (!content || content.trim().length === 0) {
            return { error: "لا يمكن إرسال رسالة فارغة" };
        }

        if (content.trim().length > 2000) {
            return { error: "الرسالة طويلة جداً (الحد الأقصى 2000 حرف)" };
        }

        const isAdmin = session.role === "ADMIN";

        // Admin must specify who they're replying to
        if (isAdmin && !targetUserId) {
            return { error: "يجب تحديد المستخدم للرد عليه" };
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                senderId: session.id,
                receiverId: isAdmin ? targetUserId! : null,
                projectId: null,
                isProjectChat: false,
            },
            include: {
                sender: { select: { id: true, name: true, role: true, image: true } },
                receiver: { select: { id: true, name: true, role: true, image: true } },
            }
        });

        // Notify admin when a user sends a support message
        if (!isAdmin) {
            await prisma.notification.create({
                data: {
                    title: "رسالة دعم فني جديدة",
                    content: `${session.name}: ${content.trim().substring(0, 100)}${content.length > 100 ? '...' : ''}`,
                    targetRole: "ADMIN",
                }
            });
        }

        return { success: true, message };
    } catch (error) {
        console.error("Send Support Message Error:", error);
        return { error: "حدث خطأ أثناء إرسال الرسالة" };
    }
}

/**
 * Admin-only: Get all support chat conversations with latest message preview.
 * Returns a list of users who have initiated support chats.
 */
export async function getSupportConversations() {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return [];
        }

        // Find all unique non-admin users who have sent or received support messages
        const supportMessages = await prisma.message.findMany({
            where: {
                isProjectChat: false,
                projectId: null,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, role: true, image: true, jobTitle: true } },
                receiver: { select: { id: true, name: true, role: true, image: true, jobTitle: true } },
            }
        });

        // Group by non-admin user
        const conversationMap = new Map<string, {
            userId: string;
            userName: string;
            userRole: string;
            userImage: string | null;
            userJobTitle: string | null;
            lastMessage: string;
            lastMessageAt: Date;
            lastMessageByAdmin: boolean;
            unreadCount: number;
            totalMessages: number;
        }>();

        for (const msg of supportMessages) {
            // Determine the non-admin user in this conversation
            const isFromAdmin = msg.sender.role === "ADMIN";
            const user = isFromAdmin ? msg.receiver : msg.sender;
            if (!user || user.role === "ADMIN") continue;

            const existing = conversationMap.get(user.id);
            if (!existing) {
                conversationMap.set(user.id, {
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    userImage: user.image ?? null,
                    userJobTitle: user.jobTitle ?? null,
                    lastMessage: msg.content.substring(0, 80),
                    lastMessageAt: msg.createdAt,
                    lastMessageByAdmin: isFromAdmin,
                    unreadCount: isFromAdmin ? 0 : 1,
                    totalMessages: 1,
                });
            } else {
                existing.totalMessages++;
                if (!isFromAdmin) existing.unreadCount++;
            }
        }

        // Sort by latest message time
        return Array.from(conversationMap.values())
            .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
    } catch (error) {
        console.error("Support Conversations Error:", error);
        return [];
    }
}

