/**
 * Non-blocking Analytics Tracker
 * By pushing analytics events into `requestIdleCallback`, we ensure that tracking
 * doesn't block the main thread during heavy React renders or initial hydration.
 */
export function trackEvent(eventName: string, data?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    const track = () => {
        // In a real application, integrate with Vercel Analytics, PostHog, or Mixpanel here.
        console.log(`[Analytics] ${eventName}`, data || {});
    };

    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(track);
    } else {
        // Fallback for Safari which doesn't support requestIdleCallback yet
        setTimeout(track, 0);
    }
}
