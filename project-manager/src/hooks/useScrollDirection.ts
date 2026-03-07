"use client";
import { useState, useEffect, useRef } from 'react';

/**
 * useScrollDirection
 *
 * Tracks scroll direction on mobile to auto-hide/show the header.
 * Returns 'up' | 'down' | null.
 *
 * - Threshold of 5px prevents jitter from micro-scrolls
 * - Always returns 'up' when at top of page (scrollY === 0)
 * - Only active on viewports < 768px (mobile)
 */
export function useScrollDirection() {
    const [direction, setDirection] = useState<'up' | 'down' | null>(null);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const THRESHOLD = 5;

        const updateDirection = () => {
            const scrollY = window.scrollY;

            // Always show header at top of page
            if (scrollY <= 10) {
                setDirection('up');
                lastScrollY.current = scrollY;
                ticking.current = false;
                return;
            }

            const diff = scrollY - lastScrollY.current;

            if (Math.abs(diff) > THRESHOLD) {
                setDirection(diff > 0 ? 'down' : 'up');
                lastScrollY.current = scrollY;
            }

            ticking.current = false;
        };

        const onScroll = () => {
            // Skip on desktop
            if (window.innerWidth >= 768) {
                setDirection(null);
                return;
            }

            if (!ticking.current) {
                requestAnimationFrame(updateDirection);
                ticking.current = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return direction;
}
