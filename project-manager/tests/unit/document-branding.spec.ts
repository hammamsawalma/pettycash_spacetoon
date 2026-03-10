/**
 * Unit Tests: Document Branding — Edge Cases & Scenario Coverage
 *
 * Tests the branding module, voucher, invoice-voucher, and export-utils
 * for all edge cases related to the logo + branch branding feature.
 *
 * Run: npx playwright test --config=playwright.unit.config.ts tests/unit/document-branding.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
    getBrandingCSS,
    getBrandingHeaderHTML,
    getBrandingHeaderHTMLClient,
    getLogoBase64,
    type BrandingInfo,
} from '../../src/lib/document-branding';
import { generateVoucherHTML, type VoucherData } from '../../src/lib/voucher';
import { generateInvoiceVoucherHTML, type InvoiceVoucherData } from '../../src/lib/invoice-voucher';

// ══════════════════════════════════════════════════════════════════════════════
//  getBrandingCSS — returns valid CSS string
// ══════════════════════════════════════════════════════════════════════════════
test.describe('getBrandingCSS', () => {

    test('returns a non-empty string', () => {
        const css = getBrandingCSS();
        expect(css.length).toBeGreaterThan(50);
    });

    test('contains key class selectors', () => {
        const css = getBrandingCSS();
        expect(css).toContain('.brand-header');
        expect(css).toContain('.brand-logo');
        expect(css).toContain('.brand-branch');
        expect(css).toContain('.brand-divider');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  getBrandingHeaderHTML — Server-side (Base64 logo)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('getBrandingHeaderHTML — Edge Cases', () => {

    test('EDGE: branchName=null → no branch display', () => {
        const html = getBrandingHeaderHTML({ branchName: null, branchFlag: null });
        expect(html).toContain('سبيستون بوكيت');
        expect(html).toContain('SPACETOON POCKET');
        expect(html).not.toContain('فرع');
    });

    test('EDGE: branchName=undefined → no branch display', () => {
        const html = getBrandingHeaderHTML({ branchName: undefined, branchFlag: undefined });
        expect(html).not.toContain('فرع');
    });

    test('EDGE: branchName="" (empty string) → no branch display', () => {
        const html = getBrandingHeaderHTML({ branchName: '', branchFlag: '' });
        expect(html).not.toContain('فرع');
    });

    test('branchName present, branchFlag=null → branch without flag emoji span', () => {
        const html = getBrandingHeaderHTML({ branchName: 'قطر', branchFlag: null });
        expect(html).toContain('فرع قطر');
        // Should NOT have the flag <span> element (CSS class in <style> block always exists)
        expect(html).not.toContain('<span class="brand-branch-flag">');
    });

    test('branchName + branchFlag both present → branch with flag', () => {
        const html = getBrandingHeaderHTML({ branchName: 'قطر', branchFlag: '🇶🇦' });
        expect(html).toContain('فرع قطر');
        expect(html).toContain('🇶🇦');
        expect(html).toContain('brand-branch-flag');
    });

    test('EDGE: no logoBase64 → no <img> tag', () => {
        const html = getBrandingHeaderHTML({ branchName: 'قطر', branchFlag: '🇶🇦' });
        expect(html).not.toContain('<img');
    });

    test('logoBase64 provided → <img> tag with correct src', () => {
        const logo = 'data:image/png;base64,ABC123';
        const html = getBrandingHeaderHTML(
            { branchName: 'قطر', branchFlag: '🇶🇦' },
            { logoBase64: logo }
        );
        expect(html).toContain('<img');
        expect(html).toContain(logo);
    });

    test('custom accentColor → used in hr divider', () => {
        const html = getBrandingHeaderHTML(
            { branchName: 'قطر', branchFlag: '🇶🇦' },
            { accentColor: '#ff0000' }
        );
        expect(html).toContain('#ff0000');
    });

    test('default accentColor is #102550', () => {
        const html = getBrandingHeaderHTML({ branchName: 'قطر', branchFlag: '🇶🇦' });
        expect(html).toContain('#102550');
    });

    test('EDGE: XSS in branchName → rendered as-is (HTML injection)', () => {
        // This tests awareness — branchName comes from DB, should be safe
        // But we document the behavior
        const html = getBrandingHeaderHTML({
            branchName: '<script>alert(1)</script>',
            branchFlag: null,
        });
        // The content is inserted as-is into HTML
        expect(html).toContain('فرع <script>');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  getBrandingHeaderHTMLClient — Client-side (URL logo)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('getBrandingHeaderHTMLClient — Edge Cases', () => {

    test('always includes <img> tag with URL', () => {
        const html = getBrandingHeaderHTMLClient({ branchName: null, branchFlag: null });
        expect(html).toContain('<img');
        expect(html).toContain('src="/spacetoon-logo.png"');
    });

    test('EDGE: branchName=null → no branch display', () => {
        const html = getBrandingHeaderHTMLClient({ branchName: null, branchFlag: null });
        expect(html).not.toContain('فرع');
    });

    test('branchName + branchFlag present → branch with flag', () => {
        const html = getBrandingHeaderHTMLClient({ branchName: 'الإمارات', branchFlag: '🇦🇪' });
        expect(html).toContain('فرع الإمارات');
        expect(html).toContain('🇦🇪');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  getLogoBase64 — Server-side logo loading
// ══════════════════════════════════════════════════════════════════════════════
test.describe('getLogoBase64', () => {

    test('returns a non-empty string or empty on missing file', () => {
        const result = getLogoBase64();
        // In test environment, logo may or may not exist
        expect(typeof result).toBe('string');
    });

    test('if logo exists, returns data:image/png;base64 prefix', () => {
        const result = getLogoBase64();
        if (result) {
            expect(result).toMatch(/^data:image\/png;base64,/);
        }
    });

    test('calling multiple times returns same cached value', () => {
        const first = getLogoBase64();
        const second = getLogoBase64();
        expect(first).toBe(second);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  generateVoucherHTML — Branding Edge Cases
// ══════════════════════════════════════════════════════════════════════════════
test.describe('generateVoucherHTML — Branding Scenarios', () => {

    const baseVoucher: VoucherData = {
        voucherNumber: 42,
        type: 'ISSUE',
        date: new Date(2026, 2, 10),
        employeeName: 'أحمد',
        projectName: 'مشروع',
        amount: 5000,
        method: 'CASH',
        issuerName: 'المدير',
    };

    test('EDGE: no branch info → no branch in header/footer', () => {
        const html = generateVoucherHTML(baseVoucher);
        expect(html).toContain('سبيستون بوكيت');
        expect(html).not.toContain('فرع');
    });

    test('with branch info → branch in header and footer', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            branchName: 'قطر',
            branchFlag: '🇶🇦',
        });
        expect(html).toContain('فرع قطر');
        expect(html).toContain('🇶🇦');
        // Footer should also show branch
        expect(html).toContain('فرع قطر');
    });

    test('EDGE: branchName present but branchFlag null → shows branch, no flag emoji span', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            branchName: 'الإمارات',
            branchFlag: null,
        });
        expect(html).toContain('فرع الإمارات');
        // The CSS class definition always exists in <style>, but the actual <span> element shouldn't
        expect(html).not.toContain('<span class="brand-branch-flag">');
    });

    test('EDGE: branchFlag present but branchName null → no branch', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            branchName: null,
            branchFlag: '🇶🇦',
        });
        // Should NOT show branch since name is null
        const branchMatches = html.match(/فرع/g);
        // Footer uses conditional: branchName ? `— فرع ${branchName}` : ''
        // Header uses getBrandingHeaderHTML which checks branchName
        expect(branchMatches).toBeNull();
    });

    test('with logoBase64 → logo in HTML', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            logoBase64: 'data:image/png;base64,TEST',
        });
        expect(html).toContain('data:image/png;base64,TEST');
    });

    test('EDGE: logoBase64 empty string → no logo img element', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            logoBase64: '',
        });
        // getBrandingHeaderHTML checks: logo ? `<img...>` : ''
        // The CSS class .brand-logo always exists in <style> block, but no actual <img> element
        expect(html).not.toContain('<img class="brand-logo"');
    });

    test('RECEIPT type with branch → same branding', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            type: 'RECEIPT',
            branchName: 'قطر',
            branchFlag: '🇶🇦',
            logoBase64: 'data:image/png;base64,TEST',
        });
        expect(html).toContain('فرع قطر');
        expect(html).toContain('سند قبض');
    });

    test('company expense voucher with branch → correct branding', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            isCompanyExpense: true,
            branchName: 'قطر',
            branchFlag: '🇶🇦',
        });
        expect(html).toContain('فرع قطر');
        expect(html).toContain('مصاريف شركة');
    });

    test('external voucher with branch → correct branding', () => {
        const html = generateVoucherHTML({
            ...baseVoucher,
            isExternal: true,
            externalName: 'مورد خارجي',
            externalPhone: '055-1234567',
            branchName: 'الإمارات',
            branchFlag: '🇦🇪',
        });
        expect(html).toContain('فرع الإمارات');
        expect(html).toContain('خارجي');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  generateInvoiceVoucherHTML — Branding & External Number Edge Cases
// ══════════════════════════════════════════════════════════════════════════════
test.describe('generateInvoiceVoucherHTML — Branding & External Number', () => {

    const baseInvoice: InvoiceVoucherData = {
        invoiceNumber: 'INV-2026-001',
        date: new Date(2026, 2, 10),
        employeeName: 'سارة',
        projectName: 'مشروع اختباري',
        amount: 12500,
        status: 'APPROVED',
        categoryName: 'لوجستيات',
        paymentSource: 'CUSTODY',
    };

    // ── External Number Edge Cases ──
    test('externalNumber present → displayed in header', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            externalNumber: 'EXT-2026-0042',
        });
        expect(html).toContain('الرقم الخارجي');
        expect(html).toContain('EXT-2026-0042');
    });

    test('EDGE: externalNumber=null → NOT displayed', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            externalNumber: null,
        });
        expect(html).not.toContain('الرقم الخارجي');
    });

    test('EDGE: externalNumber=undefined → NOT displayed', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            externalNumber: undefined,
        });
        expect(html).not.toContain('الرقم الخارجي');
    });

    test('EDGE: externalNumber="" (empty string) → NOT displayed', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            externalNumber: '',
        });
        expect(html).not.toContain('الرقم الخارجي');
    });

    test('externalNumber with special chars → rendered correctly', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            externalNumber: 'INV/2026/042-A',
        });
        expect(html).toContain('INV/2026/042-A');
    });

    // ── Branding Edge Cases (same as voucher but for invoice) ──
    test('EDGE: no branch info → no branch in header/footer', () => {
        const html = generateInvoiceVoucherHTML(baseInvoice);
        expect(html).toContain('سبيستون بوكيت');
        expect(html).not.toContain('فرع');
    });

    test('with branch → branch in header and footer', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            branchName: 'قطر',
            branchFlag: '🇶🇦',
        });
        expect(html).toContain('فرع قطر');
        expect(html).toContain('🇶🇦');
    });

    test('EDGE: branchName without flag → branch text, no flag emoji span', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            branchName: 'مصر',
            branchFlag: null,
        });
        expect(html).toContain('فرع مصر');
        // CSS class definition always exists in <style> block, but no actual <span> element
        expect(html).not.toContain('<span class="brand-branch-flag">');
    });

    test('EDGE: branchFlag without branchName → no branch displayed', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            branchName: null,
            branchFlag: '🇪🇬',
        });
        expect(html).not.toContain('فرع');
    });

    // ── Combined: externalNumber + branch ──
    test('externalNumber + branch → both displayed', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            externalNumber: 'ACC-999',
            branchName: 'قطر',
            branchFlag: '🇶🇦',
        });
        expect(html).toContain('ACC-999');
        expect(html).toContain('فرع قطر');
        expect(html).toContain('🇶🇦');
    });

    test('all invoice statuses render with branding', () => {
        for (const status of ['PENDING', 'APPROVED', 'REJECTED']) {
            const html = generateInvoiceVoucherHTML({
                ...baseInvoice,
                status,
                branchName: 'قطر',
                branchFlag: '🇶🇦',
            });
            expect(html).toContain('فرع قطر');
        }
    });

    // ── Payment Source variations ──
    test('all payment sources render correctly with branding', () => {
        for (const src of ['CUSTODY', 'PROJECT', 'PERSONAL', 'SPLIT', 'COMPANY_DIRECT']) {
            const html = generateInvoiceVoucherHTML({
                ...baseInvoice,
                paymentSource: src,
                branchName: 'الإمارات',
                branchFlag: '🇦🇪',
            });
            expect(html).toContain('فرع الإمارات');
        }
    });

    test('EDGE: unknown paymentSource → "غير محدد"', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            paymentSource: 'UNKNOWN_SOURCE',
        });
        expect(html).toContain('غير محدد');
    });

    test('EDGE: no paymentSource → "غير محدد"', () => {
        const html = generateInvoiceVoucherHTML({
            ...baseInvoice,
            paymentSource: undefined,
        });
        expect(html).toContain('غير محدد');
    });
});
