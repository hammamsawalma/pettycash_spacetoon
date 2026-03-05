"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        // Initial state
        if (typeof window !== "undefined") {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            // Hide "Back online" message after 3 seconds
            setTimeout(() => {
                setShowBackOnline(false);
            }, 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none"
                    dir="rtl"
                >
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs md:text-sm font-bold pointer-events-auto">
                        <WifiOff className="w-4 h-4" />
                        <span>أنت غير متصل بالإنترنت. يرجى التحقق من اتصالك.</span>
                    </div>
                </motion.div>
            )}

            {isOnline && showBackOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none"
                    dir="rtl"
                >
                    <div className="bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs md:text-sm font-bold pointer-events-auto">
                        <Wifi className="w-4 h-4" />
                        <span>عاد الاتصال بالإنترنت!</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
