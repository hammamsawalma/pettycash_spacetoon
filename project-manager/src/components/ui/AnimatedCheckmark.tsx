"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
    /** Show the checkmark animation */
    show: boolean;
    /** Auto-hide after X ms (0 = stay forever) */
    autoHideMs?: number;
    /** Optional label below the checkmark */
    label?: string;
}

/**
 * AnimatedCheckmark — full-screen overlay success indicator.
 * Usage: after approve/reject completes, set `show=true` for 1.5s.
 */
export function AnimatedCheckmark({ show, autoHideMs = 1500, label }: Props) {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        if (show) {
            setVisible(true);
            if (autoHideMs > 0) {
                const t = setTimeout(() => setVisible(false), autoHideMs);
                return () => clearTimeout(t);
            }
        } else {
            setVisible(false);
        }
    }, [show, autoHideMs]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-2xl shadow-green-300/50">
                            <motion.div
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                            >
                                <Check className="w-10 h-10 text-white" strokeWidth={3} />
                            </motion.div>
                        </div>
                        {label && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-white font-black text-lg drop-shadow-lg"
                            >
                                {label}
                            </motion.p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
