/**
 * S1/S2: Shared upload validation utility
 * Centralizes file type, size, and filename sanitization for all upload handlers.
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validate an uploaded file.
 * @param file      The File object from FormData
 * @param mode      'image' = photos only | 'doc' = photos + PDF
 * @returns         { ok: true } or { ok: false, error: string }
 */
export function validateUploadedFile(
    file: File,
    mode: 'image' | 'doc' = 'image'
): { ok: true } | { ok: false; error: string } {
    const allowed = mode === 'doc' ? ALLOWED_DOC_TYPES : ALLOWED_IMAGE_TYPES;

    if (!allowed.includes(file.type)) {
        const label = mode === 'doc'
            ? 'صورة (JPG/PNG/WEBP) أو ملف PDF'
            : 'صورة (JPG/PNG/WEBP/GIF)';
        return { ok: false, error: `نوع الملف غير مدعوم. يرجى رفع ${label}` };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { ok: false, error: 'حجم الملف يتجاوز الحد المسموح به (5 ميجابايت)' };
    }

    return { ok: true };
}

/**
 * Sanitize a filename to prevent path traversal and special characters.
 * Replaces everything except alphanumeric, dots, and hyphens.
 */
export function sanitizeFileName(rawName: string): string {
    // Strip any directory components first
    const base = rawName.split(/[\\/]/).pop() ?? 'upload';
    return base.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}
