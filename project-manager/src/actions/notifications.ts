"use server"
import prisma from "@/lib/prisma"

import { getSession } from "@/lib/auth"

export async function getUnreadCount(): Promise<number> {
    try {
        const session = await getSession();
        if (!session) return 0;

        const whereClause = session.role === "ADMIN"
            ? {}
            : {
                OR: [
                    { targetRole: session.role },
                    { targetRole: "ALL" },
                    { targetUserId: session.id } // specific user-targeted notifications
                ]
            };

        // Count notifications from the last 7 days as a proxy for "unread"
        const count = await prisma.notification.count({
            where: {
                ...whereClause,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        });
        return count;
    } catch {
        return 0;
    }
}

export async function getNotifications() {
    try {
        const session = await getSession();
        if (!session) return [];

        const whereClause = session.role === "ADMIN"
            ? {}
            : {
                OR: [
                    { targetRole: session.role },
                    { targetRole: "ALL" },
                    { targetUserId: session.id } // specific user-targeted notifications
                ]
            };

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 50, // P3: Cap at 50 — prevents heavy payload on large notification sets
        });
        return notifications;
    } catch (error) {
        console.error("Notifications Fetch Error:", error);
        return [];
    }
}

export async function createNotification(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        // Allow ADMIN and GENERAL_MANAGER (matches PERMISSIONS.notifications.send)
        if (!session || !['ADMIN', 'GENERAL_MANAGER'].includes(session.role)) {
            return { error: "غير مصرح لك بإرسال إشعارات عامة" };
        }

        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const target = formData.get("target") as string; // 'ALL', 'PROJECT', 'SPECIFIC'
        const targetProjectId = formData.get("targetProjectId") as string; // if PROJECT

        if (!title || !content) {
            return { error: "الرجاء إدخال عنوان ومحتوى الإشعار" };
        }

        let targetRole = "ALL";
        if (target === "PROJECT") {
            targetRole = "PROJECT_MEMBERS";
        } else if (target === "SPECIFIC") {
            targetRole = "SPECIFIC_USERS";
        }

        await prisma.notification.create({
            data: {
                title,
                content,
                targetRole,
                targetProjectId: target === "PROJECT" ? targetProjectId : null,
            }
        });

        // revalidate caching if needed, though this might be better handled client side
        return { success: true };

    } catch (error) {
        console.error("Create Notification Error:", error);
        return { error: "حدث خطأ أثناء إرسال الإشعار" };
    }
}
