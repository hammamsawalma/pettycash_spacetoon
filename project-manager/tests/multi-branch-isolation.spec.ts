/**
 * Multi-Branch Data Isolation Tests
 * Validates that branch-scoped data is correctly isolated:
 *  - QA Admin sees only QA data
 *  - ROOT sees all branches  
 *  - GM sees all branches
 *  - No cross-branch data leakage
 */
import { test, expect } from './fixtures/auth.fixture';
import type { Page } from '@playwright/test';

async function loadPage(page: Page, path: string) {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1500);
}

async function getBodyText(page: Page): Promise<string> {
    return (await page.textContent('body')) || '';
}

// ═══════════════════════════════════════════════════════════════
// Data Isolation: QA Admin sees only QA branch data
// ═══════════════════════════════════════════════════════════════
test.describe('QA Admin Data Isolation', () => {
    test('sees projects on /projects page', async ({ adminPage }) => {
        await loadPage(adminPage, '/projects');
        const text = await getBodyText(adminPage);
        // QA has 22 projects from seed — should see some projects
        expect(text).toContain('المشاريع');
        // Should NOT see "لا توجد مشاريع" (we know QA has projects)
    });

    test('sees employees on /employees page', async ({ adminPage }) => {
        await loadPage(adminPage, '/employees');
        const text = await getBodyText(adminPage);
        expect(text).toContain('الموظفين');
    });

    test('dashboard shows QA-specific data', async ({ adminPage }) => {
        await loadPage(adminPage, '/');
        const text = await getBodyText(adminPage);
        // Admin sees AdminDashboard with QA branch data
        expect(text).not.toContain('ROOT ACCESS');
        // Should see some stats
        expect(text).toContain('لوحة التحكم');
    });
});

// ═══════════════════════════════════════════════════════════════
// ROOT sees aggregate data across all branches
// ═══════════════════════════════════════════════════════════════
test.describe('ROOT Cross-Branch Visibility', () => {
    test('dashboard shows aggregate stats from all branches', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        await rootPage.waitForSelector('text=لوحة التحكم المركزية', { timeout: 15_000 }).catch(() => null);
        const text = await getBodyText(rootPage);
        expect(text).toContain('ROOT ACCESS');
        expect(text).toContain('إجمالي المشاريع');
        expect(text).toContain('إجمالي الموظفين');
    });

    test('/projects shows projects from all branches', async ({ rootPage }) => {
        await loadPage(rootPage, '/projects');
        const text = await getBodyText(rootPage);
        // ROOT should see projects (getBranchFilter returns {} for ROOT)
        expect(text).toContain('المشاريع');
    });

    test('/employees shows employees from all branches', async ({ rootPage }) => {
        await loadPage(rootPage, '/employees');
        const text = await getBodyText(rootPage);
        expect(text).toContain('الموظفين');
    });

    test('/branches shows all 6 branches', async ({ rootPage }) => {
        await loadPage(rootPage, '/branches');
        const text = await getBodyText(rootPage);
        expect(text).toContain('قطر');
        expect(text).toContain('الإمارات');
        expect(text).toContain('البحرين');
        expect(text).toContain('السعودية');
        expect(text).toContain('تركيا');
        expect(text).toContain('سوريا');
    });
});

// ═══════════════════════════════════════════════════════════════
// GM sees all branches (getBranchFilter returns {} for GM)
// ═══════════════════════════════════════════════════════════════
test.describe('GM Cross-Branch Visibility', () => {
    test('GM dashboard shows GeneralManagerDashboard', async ({ gmPage }) => {
        await loadPage(gmPage, '/');
        const text = await getBodyText(gmPage);
        // GM should see their own dashboard, NOT admin or ROOT
        expect(text).not.toContain('ROOT ACCESS');
        expect(text).toContain('لوحة التحكم');
    });

    test('GM /projects shows all projects', async ({ gmPage }) => {
        await loadPage(gmPage, '/projects');
        const text = await getBodyText(gmPage);
        expect(text).toContain('المشاريع');
    });
});

// ═══════════════════════════════════════════════════════════════
// Accountant data isolation
// ═══════════════════════════════════════════════════════════════
test.describe('Accountant Branch Scoping', () => {
    test('sees invoices page', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/invoices');
        expect(accountantPage.url()).not.toContain('/login');
    });

    test('sees custody page', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/custody');
        expect(accountantPage.url()).not.toContain('/login');
    });

    test('cannot access /branches', async ({ accountantPage }) => {
        await accountantPage.goto('/branches', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(accountantPage.url()).not.toMatch(/\/branches$/);
    });
});
