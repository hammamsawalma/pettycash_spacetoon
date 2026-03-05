import { useRef, useCallback } from 'react';

/**
 * usePullToRefresh
 * سحب للتحديث — يرصد حركة اللمس للأسفل على عنصر container ويُطلق onRefresh
 */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
    const startY = useRef<number | null>(null);
    const isPulling = useRef(false);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        // فقط إذا كنا في أعلى الصفحة
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
        }
    }, []);

    const onTouchEnd = useCallback(async (e: React.TouchEvent) => {
        if (startY.current === null || isPulling.current) return;
        const endY = e.changedTouches[0].clientY;
        const diff = endY - startY.current;
        startY.current = null;

        // تشغيل التحديث إذا سحب المستخدم 80px للأسفل من الأعلى
        if (diff > 80) {
            isPulling.current = true;
            try {
                await onRefresh();
            } finally {
                isPulling.current = false;
            }
        }
    }, [onRefresh]);

    return { onTouchStart, onTouchEnd };
}
