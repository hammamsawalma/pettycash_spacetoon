export function normalizeArabicSearch(text: string): string {
    if (!text) return '';
    return text
        // 1. Remove Tashkeel (Arabic diacritics)
        .replace(/[\u064B-\u065F]/g, '')
        // 2. Normalize Alef forms (أ, إ, آ) to bare Alef (ا)
        .replace(/[أإآ]/g, 'ا')
        // 3. Normalize Teh Marbuta (ة) to Heh (ه)
        .replace(/ة/g, 'ه')
        // 4. Normalize Alef Maksura (ى) to Yaa (ي)
        .replace(/ى/g, 'ي')
        .toLowerCase();
}

/**
 * Normalizes an array of searchable strings and returns true if any match the normalized query.
 */
export function matchArabicText(searchQuery: string, targets: (string | undefined | null)[]): boolean {
    if (!searchQuery.trim()) return true;

    const normalizedQuery = normalizeArabicSearch(searchQuery);

    return targets.some(target => {
        if (!target) return false;
        return normalizeArabicSearch(target).includes(normalizedQuery);
    });
}
