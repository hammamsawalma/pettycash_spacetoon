"use client";
import { useEffect, useRef, useCallback } from 'react';

interface FormGuardOptions {
    /** A unique key to store the draft under in sessionStorage */
    key: string;
    /** Function that returns whether the form has unsaved changes */
    hasChanges: () => boolean;
    /** Optional: callback to restore draft data */
    onRestore?: (data: Record<string, unknown>) => void;
}

/**
 * useFormGuard
 *
 * Fixes issue #50: form data is lost when browser tab is accidentally closed.
 * - Saves form data to sessionStorage on every change
 * - Shows native browser unload warning when there are unsaved changes
 * - Restores draft data on mount if available
 */
export function useFormGuard({ key, hasChanges, onRestore }: FormGuardOptions) {
    const hasChangesRef = useRef(hasChanges);
    hasChangesRef.current = hasChanges;

    // Restore draft on mount
    useEffect(() => {
        if (!onRestore) return;
        const raw = sessionStorage.getItem(`form-draft:${key}`);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                onRestore(data);
            } catch {
                // Ignore parse errors — stale/corrupted draft
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    // Warn before unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChangesRef.current()) {
                e.preventDefault();
                // Chrome requires returnValue to be set
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Function to save a draft snapshot
    const saveDraft = useCallback((data: Record<string, unknown>) => {
        sessionStorage.setItem(`form-draft:${key}`, JSON.stringify(data));
    }, [key]);

    // Function to clear the draft (call after successful submit)
    const clearDraft = useCallback(() => {
        sessionStorage.removeItem(`form-draft:${key}`);
    }, [key]);

    return { saveDraft, clearDraft };
}
