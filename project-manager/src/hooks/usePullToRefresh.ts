import { useRef, useCallback, useState } from 'react';

/**
 * usePullToRefresh
 * سحب للتحديث — مع مؤشر بصري واهتزاز
 *
 * Returns:
 *  - onTouchStart / onTouchEnd  → event handlers to attach to the scrollable div
 *  - pullProgress               → 0→1 as user pulls (for rendering the indicator)
 *  - isRefreshing               → true while onRefresh() is executing
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
    const startY = useRef<number | null>(null);
    const isPulling = useRef(false);
    const didVibrate = useRef(false);

    const [pullProgress, setPullProgress] = useState(0);  // 0 → 1
    const [isRefreshing, setIsRefreshing] = useState(false);

    const THRESHOLD = 60;   // px needed to trigger — was 80, reduced for quicker feel

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (window.scrollY === 0 && !isPulling.current) {
            startY.current = e.touches[0].clientY;
            didVibrate.current = false;
        }
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (startY.current === null || isPulling.current) return;
        const diff = e.touches[0].clientY - startY.current;
        if (diff <= 0) return;

        const progress = Math.min(diff / THRESHOLD, 1);
        setPullProgress(progress);

        // Haptic at threshold — Android only, safe on iOS via optional chaining
        if (progress >= 1 && !didVibrate.current) {
            navigator.vibrate?.(10);
            didVibrate.current = true;
        }
    }, []);

    const onTouchEnd = useCallback(async (e: React.TouchEvent) => {
        if (startY.current === null || isPulling.current) {
            setPullProgress(0);
            return;
        }
        const diff = e.changedTouches[0].clientY - startY.current;
        startY.current = null;
        setPullProgress(0);

        if (diff > THRESHOLD) {
            isPulling.current = true;
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                isPulling.current = false;
                setIsRefreshing(false);
            }
        }
    }, [onRefresh]);

    return { onTouchStart, onTouchMove, onTouchEnd, pullProgress, isRefreshing };
}
