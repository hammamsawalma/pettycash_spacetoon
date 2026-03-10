/**
 * format-utils.ts — Centralized number & date formatting utilities.
 * Guarantees ONLY Western (English) numerals (0-9) are produced.
 * No Arabic-Indic numerals (٠-٩) should ever appear in the output.
 */

// Regex matching Arabic-Indic digit characters (U+0660 – U+0669)
const ARABIC_INDIC_RE = /[\u0660-\u0669]/g;

// Map from Arabic-Indic digit code-point to Western digit
function replaceArabicIndicDigits(str: string): string {
    return str.replace(ARABIC_INDIC_RE, (ch) => String(ch.charCodeAt(0) - 0x0660));
}

/**
 * Format a number with comma separators using Western digits.
 * e.g. 1234567 → "1,234,567"
 */
export function formatNumber(n: number): string {
    return n.toLocaleString("en-US");
}

/**
 * Format a date with Arabic month/day names but Western (English) digits.
 * Default format: "10 مارس 2026"
 *
 * Uses ar-EG locale for month names, then post-processes to replace
 * any Arabic-Indic digits with Western ones.
 */
export function formatDateAr(
    date: Date | string | null | undefined,
    opts?: Intl.DateTimeFormatOptions
): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = opts ?? {
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    const raw = d.toLocaleDateString("ar-EG", options);
    return replaceArabicIndicDigits(raw);
}
