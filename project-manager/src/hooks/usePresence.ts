import { useState, useEffect } from "react";

/**
 * A hook that connects to the SSE Presence endpoint to track real-time 
 * online/away statuses. Includes auto-reconnect logic with exponential backoff jitter.
 */
export function usePresence(userId: string) {
    const [status, setStatus] = useState<'online' | 'away' | 'offline'>('offline');
    const [lastSeen, setLastSeen] = useState<number | null>(null);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connect = (reconnectAttempts = 0) => {
            eventSource = new EventSource('/api/presence');

            eventSource.onopen = () => {
                setStatus('online');
                setLastSeen(Date.now());
                reconnectAttempts = 0; // reset
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'presence' && data.userId === userId) {
                        setStatus(data.status);
                        setLastSeen(data.timestamp);
                    }
                } catch (e) {
                    console.error("Presence parse error", e);
                }
            };

            eventSource.onerror = () => {
                eventSource?.close();
                setStatus('offline');

                // Exponential backoff with jitter
                const baseTimeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                const jitter = Math.random() * 1000;

                reconnectTimeout = setTimeout(() => {
                    connect(reconnectAttempts + 1);
                }, baseTimeout + jitter);
            };
        };

        if (userId) {
            connect();
        }

        return () => {
            if (eventSource) eventSource.close();
            clearTimeout(reconnectTimeout);
        };
    }, [userId]);

    return { status, lastSeen };
}
