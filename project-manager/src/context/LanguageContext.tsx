"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";

// ─── Types ──────────────────────────────────────────────────────────────────
export type Locale = "ar" | "en";
export type TranslationKeys = typeof ar;

const localeData: Record<Locale, TranslationKeys> = { ar, en };

// ─── Nested key accessor ────────────────────────────────────────────────────
// Supports dot notation: t("sidebar.dashboard") → "لوحة التحكم"
type NestedKeyOf<T> = T extends object
    ? { [K in keyof T]: K extends string
        ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}` | K
        : K
        : never
    }[keyof T]
    : never;

export type TKey = NestedKeyOf<TranslationKeys>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split(".");
    let result: unknown = obj;
    for (const key of keys) {
        if (result == null || typeof result !== "object") return path;
        result = (result as Record<string, unknown>)[key];
    }
    return typeof result === "string" ? result : path;
}

// ─── Context ────────────────────────────────────────────────────────────────
type LanguageContextType = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
    dir: "rtl" | "ltr";
    isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("ar");
    const [mounted, setMounted] = useState(false);

    // Read from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("app-locale") as Locale;
        if (saved && (saved === "ar" || saved === "en")) {
            setLocaleState(saved);
        }
        setMounted(true);
    }, []);

    // Persist + update document attributes
    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("app-locale", newLocale);
        document.documentElement.lang = newLocale;
        document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    }, []);

    // Set initial dir/lang on mount
    useEffect(() => {
        if (mounted) {
            document.documentElement.lang = locale;
            document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        }
    }, [locale, mounted]);

    // Translation function
    const t = useCallback(
        (key: string): string => {
            return getNestedValue(localeData[locale] as unknown as Record<string, unknown>, key);
        },
        [locale]
    );

    const dir = locale === "ar" ? "rtl" : "ltr";
    const isRTL = locale === "ar";

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, dir, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
}

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error("useLanguage must be used within <LanguageProvider>");
    }
    return ctx;
}
