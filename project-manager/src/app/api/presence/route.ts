export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const encoder = new TextEncoder();

    const customReadable = new ReadableStream({
        start(controller) {
            // Send initial connection event
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
            );

            // Simulate presence updates every 15 seconds (with some jitter)
            const interval = setInterval(() => {
                const isOnline = Math.random() > 0.1; // 90% chance of being online
                const jitter = Math.floor(Math.random() * 500); // 0-500ms jitter

                setTimeout(() => {
                    const payload = {
                        type: 'presence',
                        userId: 'mock_user_' + Math.floor(Math.random() * 10),
                        status: isOnline ? 'online' : 'away',
                        timestamp: Date.now()
                    };

                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
                    } catch (e) {
                        clearInterval(interval);
                    }
                }, jitter);

            }, 10000);

            // Cleanup when connection closes
            req.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        }
    });

    return new Response(customReadable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
