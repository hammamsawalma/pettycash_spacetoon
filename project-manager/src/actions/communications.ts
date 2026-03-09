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
