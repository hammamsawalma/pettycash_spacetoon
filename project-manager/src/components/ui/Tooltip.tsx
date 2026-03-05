"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
    children: React.ReactNode;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export function Tooltip({ children, content, position = 'bottom', delay = 0.4 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay * 1000);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const positionClasses = {
        top: 'bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mb-2',
        bottom: 'top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mt-2',
        left: 'end-full top-1/2 -translate-y-1/2 me-2',
        right: 'start-full top-1/2 -translate-y-1/2 ms-2',
    };

    return (
        <div
            className="relative flex items-center justify-center isolate"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0, x: position === 'left' ? 5 : position === 'right' ? -5 : 0 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute z-[999] px-3 py-1.5 text-[11px] md:text-sm font-bold text-white bg-gray-900 border border-gray-700/50 shadow-2xl rounded-xl whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
                        role="tooltip"
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
