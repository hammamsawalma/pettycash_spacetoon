import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes potentially dirty HTML or Markdown strings to prevent XSS attacks.
 * Uses isomorphic-dompurify which works safely on both Server and Client environments.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
        // Auto-secure external links
        ADD_ATTR: ['target'],
    }).replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
}
