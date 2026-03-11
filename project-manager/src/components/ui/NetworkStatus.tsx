"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBackOnline, setShowBackOnline] = useState(false);
    const [hasUpdate, setHasUpdate] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const { locale } = useLanguage();

    useEffect(() => {
        // Initial state
        if (typeof window !== "undefined") {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            setTimeout(() => setShowBackOnline(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // ─── SW Update Detection (#115) ──────────────────────────────────────
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (!registration) return;

                const checkForWaiting = (reg: ServiceWorkerRegistration) => {
                    if (reg.waiting) {
                        setWaitingWorker(reg.waiting);
                        setHasUpdate(true);
                    }
                };

                checkForWaiting(registration);

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setWaitingWorker(newWorker);
                            setHasUpdate(true);
                        }
                    });
                });
            });

            // Reload page after SW takes over
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const applyUpdate = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        setHasUpdate(false);
    };

    return (
        <AnimatePresence>
            {/* Offline Banner */}
            {!isOnline && (
                <motion.div
                    key="offline"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none"
                    dir="rtl"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs md:text-sm font-bold pointer-events-auto">
                        <WifiOff className="w-4 h-4" aria-hidden="true" />
                        <span>{locale === 'ar' ? 'أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.' : 'You are offline. Please check your connection.'}</span>
                    </div>
                </motion.div>
            )}

            {/* Back Online Banner */}
            {isOnline && showBackOnline && (
                <motion.div
                    key="online"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none"
                    dir="rtl"
                    role="status"
                    aria-live="polite"
                >
                    <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs md:text-sm font-bold pointer-events-auto">
                        <Wifi className="w-4 h-4" aria-hidden="true" />
                        <span>{locale === 'ar' ? 'عاد الاتصال بالإنترنت!' : 'Back online!'}</span>
                    </div>
                </motion.div>
            )}

            {/* SW Update Available Banner (#115) */}
            {hasUpdate && (
                <motion.div
                    key="update"
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    className="fixed bottom-24 md:bottom-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
                    dir="rtl"
                    role="status"
                    aria-live="polite"
                >
                    <div className="bg-[#102550] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs md:text-sm font-bold pointer-events-auto max-w-sm w-full">
                        <div className="flex-1">
                            <p className="font-black">{locale === 'ar' ? '🎉 تحديث جديد متوفر' : '🎉 New update available'}</p>
                            <p className="font-medium text-white/70 text-[11px] mt-0.5">{locale === 'ar' ? 'اضغط لتحديث التطبيق' : 'Click to update'}</p>
                        </div>
                        <button
                            onClick={applyUpdate}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-colors shrink-0"
                            aria-label={locale === 'ar' ? "تطبيق التحديث وإعادة تحميل الصفحة" : "Apply update and reload"}
                        >
                            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                            {locale === 'ar' ? 'تحديث' : 'Update'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

