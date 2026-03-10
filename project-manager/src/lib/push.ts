import webpush from 'web-push';
import prisma from '@/lib/prisma';

// ─── VAPID Configuration ────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BMG1CPnkUkQtz83GbO5SYibGOGi49DC8MVBMBM1W_dBoTc0yhyCwceFWC4BJRNaQjnjzSND5OYZAgn4iXaIe2x8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '7ZHyJlyNJfcCshGFCpGVsFgTXF6FbDto27bDgXSzR-s';

webpush.setVapidDetails(
    'mailto:admin@spacetoonpocket.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// ─── Types ──────────────────────────────────────────────────────────────────
interface PushPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
}

// ─── Send Push to a specific user (all their devices) ───────────────────────
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    });

    if (subscriptions.length === 0) return 0;

    let sent = 0;
    const staleIds: string[] = [];

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                JSON.stringify({
                    title: payload.title,
                    body: payload.body,
                    url: payload.url || '/',
                    icon: payload.icon || '/icon-192.png',
                })
            );
            sent++;
        } catch (error: unknown) {
            const statusCode = (error as { statusCode?: number })?.statusCode;
            // 404 or 410 = subscription expired/invalid → remove it
            if (statusCode === 404 || statusCode === 410) {
                staleIds.push(sub.id);
            } else {
                console.error(`[Push] Failed to send to ${sub.endpoint.slice(0, 50)}...`, statusCode);
            }
        }
    }

    // Clean up stale subscriptions
    if (staleIds.length > 0) {
        await prisma.pushSubscription.deleteMany({
            where: { id: { in: staleIds } },
        });
        console.log(`[Push] Cleaned ${staleIds.length} stale subscriptions`);
    }

    return sent;
}

// ─── Send Push to all users with a specific role ────────────────────────────
export async function sendPushToRole(role: string, payload: PushPayload): Promise<number> {
    // If role is 'ALL', send to everyone
    const whereClause = role === 'ALL'
        ? {}
        : { role };

    const users = await prisma.user.findMany({
        where: { ...whereClause, isDeleted: false },
        select: { id: true },
    });

    let totalSent = 0;
    for (const user of users) {
        totalSent += await sendPushToUser(user.id, payload);
    }

    return totalSent;
}

// ─── Send Push to a specific user by targetUserId ───────────────────────────
export async function sendPushNotification(
    opts: {
        targetUserId?: string | null;
        targetRole?: string | null;
        title: string;
        body: string;
        url?: string;
    }
): Promise<number> {
    // 1. Specific user
    if (opts.targetUserId) {
        return sendPushToUser(opts.targetUserId, {
            title: opts.title,
            body: opts.body,
            url: opts.url,
        });
    }

    // 2. Role-based (including ALL)
    if (opts.targetRole) {
        return sendPushToRole(opts.targetRole, {
            title: opts.title,
            body: opts.body,
            url: opts.url,
        });
    }

    return 0;
}

// ─── Export public key for client-side subscription ─────────────────────────
export function getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
}
