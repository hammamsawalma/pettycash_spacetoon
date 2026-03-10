import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST — Register a new push subscription
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint, keys } = body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
        }

        // Upsert: update if endpoint exists, create if not
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                userId: session.id,
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
            create: {
                userId: session.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Push Subscribe] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE — Remove a push subscription
export async function DELETE(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
        }

        await prisma.pushSubscription.deleteMany({
            where: { endpoint, userId: session.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Push Unsubscribe] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
