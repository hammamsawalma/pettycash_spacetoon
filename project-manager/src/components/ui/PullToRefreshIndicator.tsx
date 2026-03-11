"use client";
import { motion } from "framer-motion";
import { RefreshCw, ArrowDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
    /** 0 → 1 — from usePullToRefresh's pullProgress */
    pullProgress: number;
    /** true when the refresh() call is in flight */
    isRefreshing: boolean;
}

/**
 * PullToRefreshIndicator
 * Shows a pull-indicator arrow that rotates as the user drags,
 * then switches to a spinner while data is loading.
 */
export function PullToRefreshIndicator({ pullProgress, isRefreshing }: Props) {
    const { locale } = useLanguage();
    if (pullProgress === 0 && !isRefreshing) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[72px] inset-x-0 flex justify-center z-40 pointer-events-none"
        >
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-gray-100">
                {isRefreshing ? (
                    <>
                        <RefreshCw className="w-4 h-4 text-[#102550] animate-spin" />
                        <span className="text-xs font-bold text-[#102550]">{locale === 'ar' ? 'جاري التحديث...' : 'Refreshing...'}</span>
                    </>
                ) : (
                    <>
                        <motion.div
                            style={{ rotate: pullProgress * 180 }}
                        >
                            <ArrowDown className="w-4 h-4 text-[#102550]" />
                        </motion.div>
                        <span className="text-xs font-bold text-gray-500">
                            {pullProgress >= 1 ? (locale === 'ar' ? "أفلت للتحديث" : "Release to refresh") : (locale === 'ar' ? "اسحب للتحديث" : "Pull to refresh")}
                        </span>
                    </>
                )}
            </div>
        </motion.div>
    );
}
