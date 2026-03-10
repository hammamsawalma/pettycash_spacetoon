/**
 * Unit Tests: Format Utilities + Voucher/Invoice Output Verification
 *
 * Ensures NO Arabic-Indic numerals (٠-٩) appear anywhere.
 * Run: npx playwright test --config=playwright.unit.config.ts tests/unit/format-utils.spec.ts
 */

import { test, expect } from '@playwright/test';
import { formatNumber, formatDateAr } from '../../src/lib/format-utils';
import { generateVoucherHTML, VoucherData } from '../../src/lib/voucher';
import { generateInvoiceVoucherHTML, InvoiceVoucherData } from '../../src/lib/invoice-voucher';

// Regex matching Arabic-Indic digits (U+0660 – U+0669)
const ARABIC_INDIC_RE = /[\u0660-\u0669]/;

// ══════════════════════════════════════════════════════════════════════════════
//  formatNumber
// ══════════════════════════════════════════════════════════════════════════════
test.describe('formatNumber — Western digits only', () => {

    test('formats zero correctly', () => {
        expect(formatNumber(0)).toBe('0');
        expect(ARABIC_INDIC_RE.test(formatNumber(0))).toBe(false);
    });

    test('formats small number', () => {
        expect(formatNumber(42)).toBe('42');
        expect(ARABIC_INDIC_RE.test(formatNumber(42))).toBe(false);
    });

    test('formats number with commas', () => {
        const result = formatNumber(1234567);
        expect(result).toBe('1,234,567');
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
    });

    test('formats decimal number', () => {
        const result = formatNumber(1234.56);
        expect(result).toContain('1,234');
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
    });

    test('formats negative number', () => {
        const result = formatNumber(-5000);
        expect(result).toContain('5,000');
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
    });

    test('formats very large number', () => {
        const result = formatNumber(999999999);
        expect(result).toBe('999,999,999');
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  formatDateAr
// ══════════════════════════════════════════════════════════════════════════════
test.describe('formatDateAr — Arabic month names, Western digits', () => {

    test('returns "-" for null/undefined', () => {
        expect(formatDateAr(null)).toBe('-');
        expect(formatDateAr(undefined)).toBe('-');
    });

    test('formats a specific date with no Arabic-Indic digits', () => {
        const date = new Date(2026, 2, 10); // March 10, 2026
        const result = formatDateAr(date);
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
        // Should contain Arabic month name
        expect(result).toContain('مارس');
        // Should contain Western year digits
        expect(result).toContain('2026');
    });

    test('handles string date input', () => {
        const result = formatDateAr('2025-01-15');
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
        expect(result).toContain('2025');
    });

    test('custom format options produce Western digits', () => {
        const date = new Date(2026, 0, 5); // Jan 5, 2026
        const result = formatDateAr(date, { day: 'numeric', month: 'short' });
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
    });

    test('year-only format produces Western digits', () => {
        const date = new Date(2026, 5, 1);
        const result = formatDateAr(date, { year: 'numeric' });
        expect(ARABIC_INDIC_RE.test(result)).toBe(false);
        expect(result).toContain('2026');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  generateVoucherHTML — no Arabic-Indic digits in output
// ══════════════════════════════════════════════════════════════════════════════
test.describe('generateVoucherHTML — Western digits only', () => {

    const sampleVoucher: VoucherData = {
        voucherNumber: 123,
        type: 'ISSUE',
        date: new Date(2026, 2, 10),
        employeeName: 'أحمد محمد',
        projectName: 'مشروع تجريبي',
        amount: 15000,
        method: 'CASH',
        note: 'ملاحظة اختبارية',
        issuerName: 'المدير',
    };

    test('HTML contains no Arabic-Indic digits', () => {
        const html = generateVoucherHTML(sampleVoucher);
        const matches = html.match(/[\u0660-\u0669]/g);
        expect(matches).toBeNull();
    });

    test('amount is formatted with Western digits', () => {
        const html = generateVoucherHTML(sampleVoucher);
        expect(html).toContain('15,000');
    });

    test('voucher number uses Western digits', () => {
        const html = generateVoucherHTML(sampleVoucher);
        expect(html).toContain('00123');
    });

    test('RECEIPT type also has no Arabic-Indic digits', () => {
        const receiptData: VoucherData = { ...sampleVoucher, type: 'RECEIPT', amount: 7500.5 };
        const html = generateVoucherHTML(receiptData);
        expect(html.match(/[\u0660-\u0669]/g)).toBeNull();
    });

    test('external voucher has no Arabic-Indic digits', () => {
        const extData: VoucherData = {
            ...sampleVoucher,
            isExternal: true,
            externalName: 'شركة خارجية',
            externalPhone: '+96612345678',
            externalPurpose: 'خدمات استشارية',
            amount: 250000,
        };
        const html = generateVoucherHTML(extData);
        expect(html.match(/[\u0660-\u0669]/g)).toBeNull();
        expect(html).toContain('250,000');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
//  generateInvoiceVoucherHTML — no Arabic-Indic digits
// ══════════════════════════════════════════════════════════════════════════════
test.describe('generateInvoiceVoucherHTML — Western digits only', () => {

    const sampleInvoice: InvoiceVoucherData = {
        invoiceNumber: 'INV-2026-0042',
        date: new Date(2026, 2, 10),
        employeeName: 'أحمد',
        projectName: 'مشروع اختباري',
        amount: 3450,
        status: 'APPROVED',
        categoryName: 'مواصلات',
        description: 'فاتورة نقل وتوصيل',
        paymentSource: 'CUSTODY',
    };

    test('HTML contains no Arabic-Indic digits', () => {
        const html = generateInvoiceVoucherHTML(sampleInvoice);
        const matches = html.match(/[\u0660-\u0669]/g);
        expect(matches).toBeNull();
    });

    test('amount is formatted with Western digits', () => {
        const html = generateInvoiceVoucherHTML(sampleInvoice);
        expect(html).toContain('3,450');
    });

    test('PENDING status invoice has no Arabic-Indic digits', () => {
        const pending: InvoiceVoucherData = { ...sampleInvoice, status: 'PENDING', amount: 99999 };
        const html = generateInvoiceVoucherHTML(pending);
        expect(html.match(/[\u0660-\u0669]/g)).toBeNull();
        expect(html).toContain('99,999');
    });

    test('REJECTED status invoice has no Arabic-Indic digits', () => {
        const rejected: InvoiceVoucherData = { ...sampleInvoice, status: 'REJECTED', amount: 500 };
        const html = generateInvoiceVoucherHTML(rejected);
        expect(html.match(/[\u0660-\u0669]/g)).toBeNull();
    });

    test('edge: zero amount', () => {
        const zero: InvoiceVoucherData = { ...sampleInvoice, amount: 0 };
        const html = generateInvoiceVoucherHTML(zero);
        expect(html.match(/[\u0660-\u0669]/g)).toBeNull();
    });
});
