import { useState, useEffect } from 'react';

export function useCachedFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    initialValue: T
) {
    const [data, setData] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        let mounted = true;

        // Reset to loading state when key changes (e.g., user switches)
        setIsLoading(true);
        setData(initialValue);

        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                try {
                    setData(JSON.parse(cached));
                    setIsLoading(false);
                } catch {
                    // Ignore parse error
                }
            }
        }
        fetchFn().then(fetchedData => {
            if (!mounted) return;
            setData(fetchedData);
            sessionStorage.setItem(key, JSON.stringify(fetchedData));
            setIsLoading(false);
        }).catch(err => {
            if (!mounted) return;
            console.error(`Error fetching data for cache key: ${key}`, err);
            setIsLoading(false);
        });

        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return { data, isLoading, setData };
}
