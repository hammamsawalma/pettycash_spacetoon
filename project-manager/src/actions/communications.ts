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

        const messages = await prisma.message.findMany({
            where: isRestricted
                ? {
                    OR: [
                        { senderId: session.id },
                        { receiverId: session.id },
                        { project: { OR: [{ managerId: session.id }, { members: { some: { userId: session.id } } }] } }
                    ]
                }
                : {},
            orderBy: { createdAt: 'desc' },
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

        const validatedFields = sendMessageSchema.safeParse({ content, receiverId, projectId });

        if (!validatedFields.success) {
            return { error: validatedFields.error.issues[0].message };
        }

        const message = await prisma.message.create({
            data: {
                content,
                senderId: session.id,
                receiverId: receiverId || null,
                projectId: projectId || null,
                isProjectChat: !!projectId
            },
            include: {
                sender: true,
                receiver: true
            }
        });

        return { success: true, message };

    } catch (error) {
        console.error("Send Message Error:", error);
        return { error: error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الرسالة" };
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
