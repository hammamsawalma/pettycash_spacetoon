"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PWAInstallBanner — shows a native-style install prompt at the bottom of the screen.
 *
 * Edge cases handled:
 * - Only appears on mobile (hidden on md+)
 * - Only appears if the user hasn't dismissed it before (localStorage)
 * - Only appears if the browser fires `beforeinstallprompt` (Chrome/Android)
 * - On iOS Safari, `beforeinstallprompt` doesn't fire — we show a generic "Add to Home Screen" hint instead
 * - Waits 5 seconds before showing to avoid disrupting initial page load
 */
export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Already dismissed or installed
        if (localStorage.getItem("pwa_install_dismissed")) return;

        // Detect iOS — no beforeinstallprompt, but can still add to home screen manually
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        // iOS standalone already = already installed
        const alreadyInstalled = (window.navigator as any).standalone === true;
        if (alreadyInstalled) return;

        if (ios) {
            setIsIOS(true);
            // Delay so it doesn't pop immediately on load
            const t = setTimeout(() => setIsVisible(true), 5000);
            return () => clearTimeout(t);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            const t = setTimeout(() => setIsVisible(true), 5000);
            return () => clearTimeout(t);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            if (outcome === "accepted") {
                localStorage.setItem("pwa_install_dismissed", "1");
            }
        }
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("pwa_install_dismissed", "1");
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="fixed bottom-[72px] inset-x-3 z-50 md:hidden"
                    dir="rtl"
                >
                    <div className="bg-[#102550] text-white rounded-3xl px-5 py-4 shadow-2xl shadow-[#102550]/40 flex items-center gap-3">
                        {/* App icon */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/spacetoon-logo.png" alt="SpacePocket" className="w-11 h-11 rounded-2xl shrink-0 object-contain bg-white/10 p-1" />

                        <div className="flex-1 min-w-0">
                            {isIOS ? (
                                <>
                                    <p className="font-black text-sm">أضف التطبيق للشاشة الرئيسية</p>
                                    <p className="text-white/70 text-xs mt-0.5">اضغط <strong>مشاركة</strong> ثم <strong>إضافة إلى الشاشة الرئيسية</strong></p>
                                </>
                            ) : (
                                <>
                                    <p className="font-black text-sm">ثبّت التطبيق</p>
                                    <p className="text-white/70 text-xs mt-0.5">وصول أسرع بدون متصفح</p>
                                </>
                            )}
                        </div>

                        {!isIOS && (
                            <button
                                onClick={handleInstall}
                                className="flex items-center gap-1.5 bg-white text-[#102550] font-black text-xs px-3.5 py-2 rounded-2xl shrink-0 active:scale-95 transition-transform"
                            >
                                <Download className="w-3.5 h-3.5" />
                                تثبيت
                            </button>
                        )}

                        <button
                            onClick={handleDismiss}
                            className="shrink-0 p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                            aria-label="إغلاق"
                        >
                            <X className="w-4 h-4 text-white/70" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
