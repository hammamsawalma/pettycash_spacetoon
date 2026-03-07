"use client";
import { useState, useEffect, useRef } from 'react';

/**
 * useIntersectionLazy
 *
 * Fixes issue #96: uses IntersectionObserver to detect when elements
 * enter the viewport and triggers lazy loading / rendering.
 *
 * @param threshold - 0 to 1, how much of the element must be visible
 * @param rootMargin - Margin around viewport (e.g. '200px' to preload early)
 * @returns [ref, isVisible] — attach ref to the container element
 *
 * @example
 * const [ref, isVisible] = useIntersectionLazy('100px');
 * return <div ref={ref}>{isVisible ? <HeavyComponent /> : <Skeleton />}</div>
 */
export function useIntersectionLazy(
    rootMargin = '100px',
    threshold = 0
) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || isVisible) return; // Once visible, stay visible

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // One-shot: load once, no need to re-observe
                }
            },
            { rootMargin, threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [rootMargin, threshold, isVisible]);

    return [ref, isVisible];
}
