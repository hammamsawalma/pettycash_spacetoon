"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * useScrollToField
 *
 * Fixes issue #42: keyboard obscuring focused input fields.
 * Uses the visualViewport API to detect when the keyboard appears
 * (viewport shrinks) and scrolls the focused element into view.
 */
export function useScrollToField() {
    useEffect(() => {
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (!target || !('tagName' in target)) return;
            const tag = target.tagName.toLowerCase();
            if (!['input', 'textarea', 'select'].includes(tag)) return;

            // Wait for the keyboard to appear (next animation frame)
            requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        };

        // Use visualViewport resize to detect keyboard appearance
        const handleViewportResize = () => {
            const focused = document.activeElement as HTMLElement;
            if (!focused) return;
            const tag = focused.tagName?.toLowerCase();
            if (!['input', 'textarea', 'select'].includes(tag)) return;
            requestAnimationFrame(() => {
                focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        };

        document.addEventListener('focusin', handleFocusIn);
        window.visualViewport?.addEventListener('resize', handleViewportResize);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            window.visualViewport?.removeEventListener('resize', handleViewportResize);
        };
    }, []);
}

/**
 * useScrollRestoration
 *
 * Fixes issue #199: scroll position is lost when navigating back.
 * Saves scroll position per-pathname in sessionStorage and restores it.
 */
export function useScrollRestoration() {
    const pathname = usePathname();

    useEffect(() => {
        // Restore saved scroll position for this path
        const saved = sessionStorage.getItem(`scroll:${pathname}`);
        if (saved) {
            const pos = parseInt(saved, 10);
            // Small delay to let the page render fully
            setTimeout(() => window.scrollTo({ top: pos, behavior: 'instant' }), 80);
        }

        // Save scroll position when leaving
        const saveScroll = () => {
            sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY));
        };

        window.addEventListener('beforeunload', saveScroll);
        return () => {
            // Also save on route change (component unmount)
            saveScroll();
            window.removeEventListener('beforeunload', saveScroll);
        };
    }, [pathname]);
}
