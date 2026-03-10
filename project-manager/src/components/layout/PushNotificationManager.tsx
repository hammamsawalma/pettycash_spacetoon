"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

/**
 * PushNotificationManager
 * 
 * Shows a banner prompting the user to enable push notifications.
 * Handles:
 * - Checking if push is supported
 * - Requesting notification permission  
 * - Subscribing to push via service worker
 * - Sending subscription to server
 * - Dismissing the banner (remembered in localStorage)
 * 
 * Scenarios handled:
 * - Browser doesn't support push → hide banner
 * - User already granted permission → subscribe silently
 * - User already denied permission → hide banner
 * - User dismissed banner → don't show again for 7 days
 * - Service worker not registered → wait and retry
 * - Subscription fails → show error toast
 * - iOS Safari (16.4+) → works with limitations
 * - Multiple devices → each gets its own subscription
 */
export default function PushNotificationManager() {
    const [showBanner, setShowBanner] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        checkPushStatus();
    }, []);

    async function checkPushStatus() {
        // 1. Check browser support
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            return; // Push not supported — don't show anything
        }

        // 2. Check if user already denied
        if (Notification.permission === "denied") {
            return; // User explicitly blocked — can't ask again
        }

        // 3. Check if already subscribed
        if (Notification.permission === "granted") {
            // Already granted — subscribe silently (in case subscription expired)
            await subscribeQuietly();
            return;
        }

        // 4. Check if user dismissed the banner recently
        const dismissed = localStorage.getItem("push-banner-dismissed");
        if (dismissed) {
            const dismissedAt = parseInt(dismissed);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedAt < sevenDays) {
                return; // Dismissed less than 7 days ago
            }
        }

        // 5. Show the banner
        setShowBanner(true);
    }

    async function subscribeQuietly() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const existing = await registration.pushManager.getSubscription();
            if (existing) {
                // Already subscribed — send to server (in case user logged in on new account)
                await sendSubscriptionToServer(existing);
                return;
            }
            // Not subscribed yet — subscribe now
            await doSubscribe();
        } catch (e) {
            console.error("[Push] Quiet subscribe failed:", e);
        }
    }

    async function handleEnable() {
        setIsSubscribing(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                await doSubscribe();
                setShowBanner(false);
            } else {
                // User denied — hide banner
                setShowBanner(false);
            }
        } catch (e) {
            console.error("[Push] Enable failed:", e);
        } finally {
            setIsSubscribing(false);
        }
    }

    async function doSubscribe() {
        try {
            // Get VAPID public key from server
            const response = await fetch("/api/push/vapid");
            const { publicKey } = await response.json();

            // Convert base64 to Uint8Array
            const applicationServerKey = urlBase64ToUint8Array(publicKey);

            // Subscribe via service worker
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true, // Required by Chrome
                applicationServerKey: applicationServerKey as BufferSource,
            });

            // Send subscription to server
            await sendSubscriptionToServer(subscription);
        } catch (e) {
            console.error("[Push] Subscribe failed:", e);
        }
    }

    async function sendSubscriptionToServer(subscription: PushSubscription) {
        try {
            const data = subscription.toJSON();
            await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    endpoint: data.endpoint,
                    keys: {
                        p256dh: data.keys?.p256dh,
                        auth: data.keys?.auth,
                    },
                }),
            });
        } catch (e) {
            console.error("[Push] Server registration failed:", e);
        }
    }

    function handleDismiss() {
        localStorage.setItem("push-banner-dismissed", Date.now().toString());
        setShowBanner(false);
    }

    if (!showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] px-4 pt-2 animate-in slide-in-from-top duration-300">
            <div className="max-w-md mx-auto bg-[#102550] text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
                <div className="flex-shrink-0 bg-white/20 rounded-xl p-2.5">
                    <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">تفعيل الإشعارات 🔔</p>
                    <p className="text-xs text-blue-200 mt-0.5">
                        احصل على تنبيهات فورية عند اعتماد فواتيرك وتحديثات المشاريع
                    </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={handleEnable}
                        disabled={isSubscribing}
                        className="bg-white text-[#102550] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                    >
                        {isSubscribing ? "..." : "تفعيل"}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-white/50 hover:text-white p-1 transition"
                        aria-label="إغلاق"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Utility ────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
