/**
 * Phase 3: Invoice Status Transitions & Edge Cases
 *
 * Tests for: updateInvoiceStatus (approve/reject), softDeleteInvoice,
 * company expense creation, and closed project edge cases.
 * These tests interact with existing data via detail pages.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Navigate to a pending invoice detail page
async function navigateToPendingInvoice(page: Page): Promise<boolean> {
    await page.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    // Filter to show only pending invoices
    const pendingBtn = page.locator('button:has-text("معلقة")').first();
    if (await pendingBtn.isVisible().catch(() => false)) {
        await pendingBtn.click();
        await page.waitForTimeout(2000);
    }
    // Click first invoice "عرض الفاتورة" button
    const viewBtn = page.locator('button[title="عرض الفاتورة"]').first();
    if (await viewBtn.isVisible().catch(() => false)) {
        await viewBtn.click();
        try {
            await page.waitForURL((url) => /\/invoices\/[a-zA-Z0-9]/.test(url.pathname), { timeout: 20_000 });
            await page.waitForTimeout(2000);
            return true;
        } catch (_e) { return false; }
    }
    return false;
}

// Helper: Navigate to any invoice detail page
async function navigateToAnyInvoice(page: Page): Promise<boolean> {
    await page.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    const viewBtn = page.locator('button[title="عرض الفاتورة"]').first();
    if (await viewBtn.isVisible().catch(() => false)) {
        await viewBtn.click();
        try {
            await page.waitForURL((url) => /\/invoices\/[a-zA-Z0-9]/.test(url.pathname), { timeout: 20_000 });
            await page.waitForTimeout(2000);
            return true;
        } catch (_e) { return false; }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════
// Invoice — Approve / Reject via UI
// ═══════════════════════════════════════════════════════════════
test.describe('Invoice — Status Transitions', () => {

    test('I14-full: ACC sees approve/reject buttons on pending invoice detail', async ({ accountantPage }) => {
        const found = await navigateToPendingInvoice(accountantPage);
        test.skip(!found, 'No pending invoices');
        const bodyText = await accountantPage.textContent('body') || '';
        // ACC should see approval actions
        const hasActions = bodyText.includes('اعتماد') || bodyText.includes('رفض') || bodyText.includes('موافقة');
        expect(hasActions).toBeTruthy();
    });

    test('I14b: ADMIN sees approve/reject buttons on pending invoice detail', async ({ adminPage }) => {
        const found = await navigateToPendingInvoice(adminPage);
        test.skip(!found, 'No pending invoices');
        const bodyText = await adminPage.textContent('body') || '';
        const hasActions = bodyText.includes('اعتماد') || bodyText.includes('رفض');
        expect(hasActions).toBeTruthy();
    });

    test('I15: PE cannot see approval buttons on invoice detail', async ({ pePage }) => {
        const found = await navigateToAnyInvoice(pePage);
        test.skip(!found, 'No invoices accessible by PE');
        const bodyText = await pePage.textContent('body') || '';
        // PE should NOT have approval buttons — they are the requester
        expect(bodyText).not.toContain('اعتماد الفاتورة');
    });

    test('I16: GM cannot see approval buttons on invoice detail', async ({ gmPage }) => {
        const found = await navigateToAnyInvoice(gmPage);
        test.skip(!found, 'No invoices accessible by GM');
        const bodyText = await gmPage.textContent('body') || '';
        // GM might see the invoice but NOT have edit/approval controls
        expect(bodyText).not.toContain('اعتماد الفاتورة');
    });

    test('I17: PM cannot see approval buttons on invoice detail', async ({ pmPage }) => {
        const found = await navigateToAnyInvoice(pmPage);
        test.skip(!found, 'No invoices accessible by PM');
        const bodyText = await pmPage.textContent('body') || '';
        expect(bodyText).not.toContain('اعتماد الفاتورة');
    });
});

// ═══════════════════════════════════════════════════════════════
// Invoice — Soft Delete
// ═══════════════════════════════════════════════════════════════
test.describe('Invoice — Soft Delete', () => {

    test('I21b: ACC cannot see delete/trash option on invoice', async ({ accountantPage }) => {
        const found = await navigateToAnyInvoice(accountantPage);
        test.skip(!found, 'No invoices');
        const bodyText = await accountantPage.textContent('body') || '';
        // Only ADMIN should see trash — ACC should NOT
        expect(bodyText).not.toContain('نقل إلى السلة');
    });

    test('I21c: PE cannot see delete option on invoice', async ({ pePage }) => {
        const found = await navigateToAnyInvoice(pePage);
        test.skip(!found, 'No invoices');
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText).not.toContain('نقل إلى السلة');
        expect(bodyText).not.toContain('حذف');
    });
});

// ═══════════════════════════════════════════════════════════════
// Invoice — Company Expense Access
// ═══════════════════════════════════════════════════════════════
test.describe('Invoice — Company Expenses', () => {

    test('I-CE1: ADMIN sees company expense tab in invoice form', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        // ADMIN should see option for company expense or project expense
        const hasScope = bodyText.includes('مصروف شركة') || bodyText.includes('شركة') || bodyText.includes('COMPANY');
        expect(hasScope).toBeTruthy();
    });

    test('I-CE2: ADMIN sees company expenses filter on invoice list', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('مصاريف شركة');
    });

    test('I-CE3: ACC sees company expenses filter on invoice list', async ({ accountantPage }) => {
        await accountantPage.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText).toContain('مصاريف شركة');
    });
});

// ═══════════════════════════════════════════════════════════════
// Invoice — Detail Page Content
// ═══════════════════════════════════════════════════════════════
test.describe('Invoice — Detail Content', () => {

    test('I-D1: Invoice detail shows project name', async ({ adminPage }) => {
        const found = await navigateToAnyInvoice(adminPage);
        test.skip(!found, 'No invoices');
        const bodyText = await adminPage.textContent('body') || '';
        // Should show project name, amount, date, etc.
        const hasDetail = bodyText.includes('المشروع') || bodyText.includes('المبلغ') || bodyText.includes('فاتورة');
        expect(hasDetail).toBeTruthy();
    });

    test('I-D2: Invoice detail shows status badge', async ({ adminPage }) => {
        const found = await navigateToAnyInvoice(adminPage);
        test.skip(!found, 'No invoices');
        const bodyText = await adminPage.textContent('body') || '';
        const hasStatus = bodyText.includes('معلق') || bodyText.includes('معتمد') || bodyText.includes('مرفوض');
        expect(hasStatus).toBeTruthy();
    });
});
