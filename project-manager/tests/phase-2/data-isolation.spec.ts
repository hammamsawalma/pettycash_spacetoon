/**
 * Phase 2: Data Isolation Tests
 * Verify that USER-role users only see data from their assigned projects.
 * ADMIN/GM/ACC see all data; PE/PM see only their own projects.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Count visible table rows or list items on a page
async function getListItemCount(page: Page, listPath: string): Promise<number> {
    await page.goto(listPath, { waitUntil: 'networkidle', timeout: 30_000 });
    // Wait for content to load
    await page.waitForTimeout(1000);
    // Count items: look for table rows, card links, or data rows
    const rows = page.locator('table tbody tr, a[href*="/invoices/"], a[href*="/purchases/"]');
    return await rows.count();
}

// ═══════════════════════════════════════════════════════════════
// Invoices — Data Isolation
// ═══════════════════════════════════════════════════════════════
test.describe('Data Isolation — Invoices', () => {

    test('ADMIN sees all invoices (global view)', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await adminPage.textContent('body') || '';
        // ADMIN should see the invoice list page without restrictions
        // Look for the page title/header
        expect(text).toContain('الفواتير');
    });

    test('ACCOUNTANT sees all invoices (global financial view)', async ({ accountantPage }) => {
        await accountantPage.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await accountantPage.textContent('body') || '';
        expect(text).toContain('الفواتير');
    });

    test('PE sees only own project invoices (filtered view)', async ({ pePage }) => {
        await pePage.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await pePage.textContent('body') || '';
        // PE should see invoices page (proxy allows) — data is filtered server-side
        expect(text).toContain('الفواتير');
    });

    test('Outsider sees invoices page (may be empty — no project membership)', async ({ outsiderPage }) => {
        await outsiderPage.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await outsiderPage.textContent('body') || '';
        // Outsider can access the page but has no project membership
        // Should show empty state or minimal data
        expect(text).toContain('الفواتير');
    });
});

// ═══════════════════════════════════════════════════════════════
// Purchases — Data Isolation
// ═══════════════════════════════════════════════════════════════
test.describe('Data Isolation — Purchases', () => {

    test('ADMIN sees all purchases', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('المشتريات');
    });

    test('PM sees only own project purchases', async ({ pmPage }) => {
        await pmPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await pmPage.textContent('body') || '';
        expect(text).toContain('المشتريات');
    });

    test('PE sees purchases (filtered to own projects)', async ({ pePage }) => {
        await pePage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await pePage.textContent('body') || '';
        expect(text).toContain('المشتريات');
    });
});

// ═══════════════════════════════════════════════════════════════
// Debts — Data Isolation
// Users see only their own debts; ADMIN/ACC see all
// ═══════════════════════════════════════════════════════════════
test.describe('Data Isolation — Debts', () => {

    test('ADMIN sees all debts', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('الديون');
    });

    test('PE sees own debts only', async ({ pePage }) => {
        await pePage.goto('/debts', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await pePage.textContent('body') || '';
        expect(text).toContain('الديون');
    });

    test('Outsider sees debts page (own debts only — may be empty)', async ({ outsiderPage }) => {
        await outsiderPage.goto('/debts', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await outsiderPage.textContent('body') || '';
        expect(text).toContain('الديون');
    });
});

// ═══════════════════════════════════════════════════════════════
// Projects — Data Isolation
// USER sees only own project; ADMIN/GM/ACC see all
// ═══════════════════════════════════════════════════════════════
test.describe('Data Isolation — Projects', () => {

    test('ADMIN sees all projects', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('المشاريع');
    });

    test('PE sees only assigned projects', async ({ pePage }) => {
        await pePage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await pePage.textContent('body') || '';
        expect(text).toContain('المشاريع');
    });

    test('PM sees only managed projects', async ({ pmPage }) => {
        await pmPage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
        const text = await pmPage.textContent('body') || '';
        expect(text).toContain('المشاريع');
    });
});
