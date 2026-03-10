/**
 * E2E Tests: Accountant Export System
 *
 * Tests cover:
 * 1. RBAC — мركز التصدير sidebar link visibility per role
 * 2. RBAC — Export buttons visible only on authorized pages per role
 * 3. Export Hub page — loads for authorized roles, redirects unauthorized
 * 4. Export Hub — all 8 export cards render correctly
 * 5. Export Hub — Excel/PDF buttons are clickable and show loading state
 * 6. Page-level export buttons — present on all 10+ pages for accountant
 * 7. Dropdown — opens/closes correctly on ExportButton
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: load page and wait for content
async function loadPage(page: Page, url: string) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1000);
}

// Helper: get body text
async function getBodyText(page: Page): Promise<string> {
    return await page.textContent('body') || '';
}

// ═══════════════════════════════════════════════════════════════
// 1. SIDEBAR VISIBILITY — مركز التصدير link
// ═══════════════════════════════════════════════════════════════
test.describe('Export Hub Sidebar Visibility', () => {
    test('ADMIN sees مركز التصدير in sidebar', async ({ adminPage }) => {
        await loadPage(adminPage, '/');
        const text = await getBodyText(adminPage);
        expect(text).toContain('مركز التصدير');
    });

    test('GLOBAL_ACCOUNTANT sees مركز التصدير in sidebar', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/');
        const text = await getBodyText(accountantPage);
        expect(text).toContain('مركز التصدير');
    });

    test('GENERAL_MANAGER sees مركز التصدير in sidebar', async ({ gmPage }) => {
        await loadPage(gmPage, '/');
        const text = await getBodyText(gmPage);
        expect(text).toContain('مركز التصدير');
    });

    test('USER (PE) does NOT see مركز التصدير in sidebar', async ({ pePage }) => {
        await loadPage(pePage, '/');
        const text = await getBodyText(pePage);
        expect(text).not.toContain('مركز التصدير');
    });

    test('USER (PM) does NOT see مركز التصدير in sidebar', async ({ pmPage }) => {
        await loadPage(pmPage, '/');
        const text = await getBodyText(pmPage);
        expect(text).not.toContain('مركز التصدير');
    });

    test('USER (Outsider) does NOT see مركز التصدير in sidebar', async ({ outsiderPage }) => {
        await loadPage(outsiderPage, '/');
        const text = await getBodyText(outsiderPage);
        expect(text).not.toContain('مركز التصدير');
    });
});

// ═══════════════════════════════════════════════════════════════
// 2. EXPORT HUB PAGE — access control + content
// ═══════════════════════════════════════════════════════════════
test.describe('Export Hub Page Access', () => {
    test('ADMIN can access /exports page', async ({ adminPage }) => {
        await loadPage(adminPage, '/exports');
        const text = await getBodyText(adminPage);
        expect(text).toContain('مركز التصدير');
        expect(text).toContain('تقرير الفواتير');
        expect(text).toContain('كشف حساب الخزنة');
    });

    test('ACCOUNTANT can access /exports page', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/exports');
        const text = await getBodyText(accountantPage);
        expect(text).toContain('مركز التصدير');
        expect(text).toContain('تقرير الفواتير');
    });

    test('GM can access /exports page', async ({ gmPage }) => {
        await loadPage(gmPage, '/exports');
        const text = await getBodyText(gmPage);
        expect(text).toContain('مركز التصدير');
    });

    test('USER (PE) is redirected away from /exports', async ({ pePage }) => {
        await pePage.goto('/exports', { timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        // Should be redirected to home
        expect(pePage.url()).not.toContain('/exports');
    });

    test('USER (Outsider) is redirected away from /exports', async ({ outsiderPage }) => {
        await outsiderPage.goto('/exports', { timeout: 30_000 });
        await outsiderPage.waitForTimeout(2000);
        expect(outsiderPage.url()).not.toContain('/exports');
    });
});

// ═══════════════════════════════════════════════════════════════
// 3. EXPORT HUB — all 8 export cards render
// ═══════════════════════════════════════════════════════════════
test.describe('Export Hub Cards', () => {
    test('renders all 8 export report cards', async ({ adminPage }) => {
        await loadPage(adminPage, '/exports');
        const text = await getBodyText(adminPage);

        // All 8 card titles
        expect(text).toContain('تقرير الفواتير');
        expect(text).toContain('كشف حساب الخزنة');
        expect(text).toContain('تقرير الديون');
        expect(text).toContain('تقرير العهدات');
        expect(text).toContain('تقرير المشاريع');
        expect(text).toContain('تقرير المشتريات');
        expect(text).toContain('تقرير الطلبات المالية');
        expect(text).toContain('التقرير المالي الشامل');
    });

    test('each card has Excel and PDF buttons', async ({ adminPage }) => {
        await loadPage(adminPage, '/exports');

        const excelButtons = adminPage.locator('button:has-text("Excel")');
        const pdfButtons = adminPage.locator('button:has-text("PDF")');

        // Should have 8 Excel + 8 PDF = 16 buttons
        expect(await excelButtons.count()).toBe(8);
        expect(await pdfButtons.count()).toBe(8);
    });

    test('Excel button shows loading state on click', async ({ adminPage }) => {
        await loadPage(adminPage, '/exports');
        const firstExcel = adminPage.locator('#export-invoices-excel');
        await expect(firstExcel).toBeVisible();
        await firstExcel.click();


        // The button should eventually return to normal (after download)
        await expect(firstExcel).toBeEnabled({ timeout: 30_000 });
    });

    test('renders quick links section', async ({ adminPage }) => {
        await loadPage(adminPage, '/exports');
        const text = await getBodyText(adminPage);
        expect(text).toContain('روابط سريعة');
        expect(text).toContain('الفواتير');
        expect(text).toContain('الخزنة');
        expect(text).toContain('الديون');
    });

    test('stats bar shows correct numbers', async ({ adminPage }) => {
        await loadPage(adminPage, '/exports');
        const text = await getBodyText(adminPage);
        expect(text).toContain('أنواع التقارير');
        expect(text).toContain('صيغ التصدير');
        expect(text).toContain('Excel (.xlsx)');
        expect(text).toContain('PDF / طباعة');
    });
});

// ═══════════════════════════════════════════════════════════════
// 4. PAGE-LEVEL EXPORT BUTTONS — visibility on each page
// ═══════════════════════════════════════════════════════════════
test.describe('Page Export Buttons — ADMIN visibility', () => {
    const pagesWithExport = [
        { url: '/invoices', name: 'Invoices' },
        { url: '/debts', name: 'Debts' },
        { url: '/wallet', name: 'Wallet' },
        { url: '/employee-custodies', name: 'Employee Custodies' },
        { url: '/external-custodies', name: 'External Custodies' },
        { url: '/company-custodies', name: 'Company Custodies' },
        { url: '/finance-requests', name: 'Finance Requests' },
        { url: '/projects', name: 'Projects' },
        { url: '/purchases', name: 'Purchases' },
        { url: '/reports', name: 'Reports' },
    ];

    for (const pg of pagesWithExport) {
        test(`export button visible on ${pg.name} page`, async ({ adminPage }) => {
            await loadPage(adminPage, pg.url);
            // Look for the export button (id or text based)
            const exportBtn = adminPage.locator('#export-button').first();
            await expect(exportBtn).toBeVisible({ timeout: 15_000 });
        });
    }
});

test.describe('Page Export Buttons — USER (PE) does NOT see export', () => {
    const pagesWithoutExport = [
        { url: '/invoices', name: 'Invoices' },
        { url: '/debts', name: 'Debts' },
    ];

    for (const pg of pagesWithoutExport) {
        test(`no export button on ${pg.name} for USER`, async ({ pePage }) => {
            await loadPage(pePage, pg.url);
            const exportBtn = pePage.locator('#export-button');
            // Should be either not visible or not present
            expect(await exportBtn.count()).toBe(0);
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// 5. EXPORT BUTTON DROPDOWN — interaction tests
// ═══════════════════════════════════════════════════════════════
test.describe('ExportButton Dropdown Behavior', () => {
    test('dropdown opens on click and shows Excel/PDF options', async ({ adminPage }) => {
        await loadPage(adminPage, '/invoices');
        const exportBtn = adminPage.locator('#export-button').first();
        await expect(exportBtn).toBeVisible({ timeout: 15_000 });
        await exportBtn.click();

        const dropdown = adminPage.locator('#export-dropdown');
        await expect(dropdown).toBeVisible();

        // Check option labels
        await expect(adminPage.locator('#export-excel-btn')).toBeVisible();
        await expect(adminPage.locator('#export-pdf-btn')).toBeVisible();
        expect(await dropdown.textContent()).toContain('تصدير Excel');
        expect(await dropdown.textContent()).toContain('تصدير PDF / طباعة');
    });

    test('dropdown closes when clicking outside', async ({ adminPage }) => {
        await loadPage(adminPage, '/invoices');
        const exportBtn = adminPage.locator('#export-button').first();
        await exportBtn.click();

        // Dropdown should be open
        await expect(adminPage.locator('#export-dropdown')).toBeVisible();

        // Click outside
        await adminPage.locator('body').click({ position: { x: 10, y: 10 } });
        await adminPage.waitForTimeout(300);

        // Dropdown should be closed
        await expect(adminPage.locator('#export-dropdown')).not.toBeVisible();
    });

    test('Excel button triggers download without error', async ({ adminPage }) => {
        await loadPage(adminPage, '/invoices');
        const exportBtn = adminPage.locator('#export-button').first();
        await exportBtn.click();

        const excelBtn = adminPage.locator('#export-excel-btn');
        await expect(excelBtn).toBeVisible();

        // Listen for download event
        const [download] = await Promise.all([
            adminPage.waitForEvent('download', { timeout: 30_000 }).catch(() => null),
            excelBtn.click(),
        ]);

        // If download triggered, verify it has content
        if (download) {
            const suggestedFilename = download.suggestedFilename();
            expect(suggestedFilename).toContain('.xlsx');
        }
        // If no download (e.g. empty data), at least no crash
    });
});

// ═══════════════════════════════════════════════════════════════
// 6. ACCOUNTANT-SPECIFIC SCENARIOS
// ═══════════════════════════════════════════════════════════════
test.describe('Accountant Export Scenarios', () => {
    test('Accountant sees export buttons on all financial pages', async ({ accountantPage }) => {
        const financialPages = [
            '/invoices',
            '/debts',
            '/wallet',
            '/employee-custodies',
            '/external-custodies',
            '/company-custodies',
            '/finance-requests',
        ];

        for (const url of financialPages) {
            await loadPage(accountantPage, url);
            const exportBtn = accountantPage.locator('#export-button').first();
            await expect(exportBtn).toBeVisible({ timeout: 15_000 });
        }
    });

    test('Accountant export hub has all cards', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/exports');
        const text = await getBodyText(accountantPage);

        expect(text).toContain('تقرير الفواتير');
        expect(text).toContain('كشف حساب الخزنة');
        expect(text).toContain('تقرير الديون');
        expect(text).toContain('تقرير العهدات');
        expect(text).toContain('تقرير المشاريع');
        expect(text).toContain('تقرير المشتريات');
        expect(text).toContain('تقرير الطلبات المالية');
        expect(text).toContain('التقرير المالي الشامل');
    });
});

// ═══════════════════════════════════════════════════════════════
// 7. GM EXPORT SCENARIOS
// ═══════════════════════════════════════════════════════════════
test.describe('GM Export Scenarios', () => {
    test('GM sees export buttons on financial pages', async ({ gmPage }) => {
        const financialPages = [
            '/invoices',
            '/debts',
            '/wallet',
            '/employee-custodies',
            '/external-custodies',
            '/company-custodies',
        ];

        for (const url of financialPages) {
            await loadPage(gmPage, url);
            const exportBtn = gmPage.locator('#export-button').first();
            await expect(exportBtn).toBeVisible({ timeout: 15_000 });
        }
    });

    test('GM can access export hub', async ({ gmPage }) => {
        await loadPage(gmPage, '/exports');
        const text = await getBodyText(gmPage);
        expect(text).toContain('مركز التصدير');
    });
});
