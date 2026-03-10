/**
 * v9: Document Branding — Shared logo + branch header for all exported documents.
 * Generates reusable HTML/CSS snippets for PDF/print header branding.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandingInfo {
    branchName?: string | null;   // "قطر"
    branchFlag?: string | null;   // "🇶🇦"
}

// ─── Logo Base64 (cached) ─────────────────────────────────────────────────────

let cachedLogoBase64: string | null = null;

/**
 * Read the company logo and return as a data: URI.
 * Server-side only — caches after first read.
 */
export function getLogoBase64(): string {
    if (cachedLogoBase64) return cachedLogoBase64;
    try {
        const logoPath = path.join(process.cwd(), 'public', 'spacetoon-logo.png');
        const buf = fs.readFileSync(logoPath);
        cachedLogoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
        return cachedLogoBase64;
    } catch {
        // Fallback: return empty string if logo not found
        return '';
    }
}

// ─── Branding CSS ─────────────────────────────────────────────────────────────

export function getBrandingCSS(): string {
    return `
        .brand-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 16px;
        }
        .brand-logo {
            width: 64px;
            height: 64px;
            object-fit: contain;
            border-radius: 8px;
        }
        .brand-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .brand-company {
            font-size: 18px;
            font-weight: 900;
            color: #102550;
            letter-spacing: 0.5px;
        }
        .brand-company-en {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            letter-spacing: 1px;
        }
        .brand-branch {
            font-size: 13px;
            font-weight: 700;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .brand-branch-flag {
            font-size: 18px;
        }
        .brand-divider {
            width: 100%;
            height: 3px;
            border: none;
            border-radius: 2px;
            margin: 8px 0 20px;
        }
    `;
}

// ─── Branding HTML ────────────────────────────────────────────────────────────

/**
 * Generate the brand header HTML block with logo + company name + branch.
 * Used at the top of all printed documents.
 */
export function getBrandingHeaderHTML(
    branding: BrandingInfo,
    options?: { logoBase64?: string; accentColor?: string }
): string {
    const logo = options?.logoBase64 || '';
    const accent = options?.accentColor || '#102550';
    const branchDisplay = branding.branchName
        ? `<div class="brand-branch">
               ${branding.branchFlag ? `<span class="brand-branch-flag">${branding.branchFlag}</span>` : ''}
               فرع ${branding.branchName}
           </div>`
        : '';

    return `
        <div class="brand-header">
            ${logo ? `<img class="brand-logo" src="${logo}" alt="Logo" />` : ''}
            <div class="brand-info">
                <div class="brand-company">سبيستون بوكيت</div>
                <div class="brand-company-en">SPACETOON POCKET</div>
                ${branchDisplay}
            </div>
        </div>
        <hr class="brand-divider" style="background: ${accent};" />
    `;
}

/**
 * Client-side version: uses /spacetoon-logo.png URL instead of base64.
 */
export function getBrandingHeaderHTMLClient(
    branding: BrandingInfo,
    options?: { accentColor?: string }
): string {
    const accent = options?.accentColor || '#102550';
    const branchDisplay = branding.branchName
        ? `<div class="brand-branch">
               ${branding.branchFlag ? `<span class="brand-branch-flag">${branding.branchFlag}</span>` : ''}
               فرع ${branding.branchName}
           </div>`
        : '';

    return `
        <div class="brand-header">
            <img class="brand-logo" src="/spacetoon-logo.png" alt="Logo" />
            <div class="brand-info">
                <div class="brand-company">سبيستون بوكيت</div>
                <div class="brand-company-en">SPACETOON POCKET</div>
                ${branchDisplay}
            </div>
        </div>
        <hr class="brand-divider" style="background: ${accent};" />
    `;
}
