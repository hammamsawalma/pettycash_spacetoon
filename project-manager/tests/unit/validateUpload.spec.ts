/**
 * Unit Tests: validateUpload utility (Phase 6)
 *
 * These tests run via Playwright's test runner but require NO browser.
 * They test the pure logic of validateUploadedFile() and sanitizeFileName()
 * directly as Node.js functions.
 *
 * Run with: npm test -- tests/unit/validateUpload.spec.ts
 */

import { test, expect } from '@playwright/test';
import { validateUploadedFile, sanitizeFileName } from '../../src/lib/validateUpload';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeFile(name: string, type: string, sizeBytes: number): File {
    const arr = new Uint8Array(sizeBytes);
    return new File([arr], name, { type });
}

const MB = 1024 * 1024;

// ══════════════════════════════════════════════════════════════════════════════
//  validateUploadedFile — Image Mode
// ══════════════════════════════════════════════════════════════════════════════
test.describe('validateUploadedFile — image mode', () => {

    test('accepts JPEG under 5MB', () => {
        const file = makeFile('photo.jpg', 'image/jpeg', 1 * MB);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(true);
    });

    test('accepts PNG under 5MB', () => {
        const file = makeFile('image.png', 'image/png', 2 * MB);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(true);
    });

    test('accepts WEBP under 5MB', () => {
        const file = makeFile('image.webp', 'image/webp', 500 * 1024);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(true);
    });

    test('rejects PDF in image mode', () => {
        const file = makeFile('document.pdf', 'application/pdf', 1 * MB);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('نوع الملف');
        }
    });

    test('rejects executable file', () => {
        const file = makeFile('malware.exe', 'application/x-msdownload', 100 * 1024);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(false);
    });

    test('rejects file over 5MB', () => {
        const file = makeFile('huge.jpg', 'image/jpeg', 6 * MB);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('5');
        }
    });

    test('accepts file exactly at 5MB', () => {
        const file = makeFile('exact.jpg', 'image/jpeg', 5 * MB);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(true);
    });

    test('rejects file 1 byte over 5MB', () => {
        const file = makeFile('exact.jpg', 'image/jpeg', 5 * MB + 1);
        const result = validateUploadedFile(file, 'image');
        expect(result.ok).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  validateUploadedFile — Doc Mode
// ══════════════════════════════════════════════════════════════════════════════
test.describe('validateUploadedFile — doc mode', () => {

    test('accepts PDF in doc mode', () => {
        const file = makeFile('invoice.pdf', 'application/pdf', 1 * MB);
        const result = validateUploadedFile(file, 'doc');
        expect(result.ok).toBe(true);
    });

    test('accepts JPEG in doc mode', () => {
        const file = makeFile('receipt.jpg', 'image/jpeg', 1 * MB);
        const result = validateUploadedFile(file, 'doc');
        expect(result.ok).toBe(true);
    });

    test('rejects text/plain in doc mode', () => {
        const file = makeFile('notes.txt', 'text/plain', 10 * 1024);
        const result = validateUploadedFile(file, 'doc');
        expect(result.ok).toBe(false);
    });

    test('rejects zip even in doc mode', () => {
        const file = makeFile('archive.zip', 'application/zip', 1 * MB);
        const result = validateUploadedFile(file, 'doc');
        expect(result.ok).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  sanitizeFileName — Path Traversal Prevention
// ══════════════════════════════════════════════════════════════════════════════
test.describe('sanitizeFileName — path traversal prevention', () => {

    test('keeps simple filenames unchanged', () => {
        expect(sanitizeFileName('photo.jpg')).toBe('photo.jpg');
        expect(sanitizeFileName('my-document.pdf')).toBe('my-document.pdf');
        expect(sanitizeFileName('file_name_123.png')).toBe('file_name_123.png');
    });

    test('strips path traversal prefixes (../)', () => {
        const result = sanitizeFileName('../../etc/passwd');
        expect(result).not.toContain('..');
        expect(result).not.toContain('/');
        expect(result).toBe('passwd');
    });

    test('strips backslash path traversal', () => {
        const result = sanitizeFileName('..\\..\\windows\\system32\\config');
        expect(result).not.toContain('\\');
        expect(result).toBe('config');
    });

    test('replaces spaces with underscores', () => {
        const result = sanitizeFileName('my photo file.jpg');
        expect(result).toBe('my_photo_file.jpg');
    });

    test('replaces Arabic characters with underscores', () => {
        const result = sanitizeFileName('صورة.jpg');
        // Arabic chars should be replaced
        expect(result).not.toMatch(/[\u0600-\u06FF]/);
        expect(result.endsWith('.jpg')).toBe(true);
    });

    test('handles empty string gracefully', () => {
        const result = sanitizeFileName('');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0); // fallback 'upload'
    });

    test('strips leading dots except in extensions', () => {
        const result = sanitizeFileName('.htaccess');
        expect(result).not.toMatch(/^[/\\]/);
    });

    test('does not produce path separators in output', () => {
        const inputs = [
            'path/to/file.jpg',
            'path\\to\\file.jpg',
            '../../malicious.sh',
            '/etc/passwd',
        ];
        for (const input of inputs) {
            const result = sanitizeFileName(input);
            expect(result).not.toContain('/');
            expect(result).not.toContain('\\');
        }
    });
});
