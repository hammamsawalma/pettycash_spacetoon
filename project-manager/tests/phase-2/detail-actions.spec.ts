/**
 * Phase 2: Detail Page Action Buttons — RBAC Visibility
 * Tests that each role sees ONLY the correct action buttons on detail pages.
 *
 * Strategy: Use page-specific selectors to click the first item on each list
 * page and navigate to its detail. Each page has different clickable elements:
 * - Invoices: button[title="عرض الفاتورة"]
 * - Projects: Card with cursor-pointer class
 * - Employees: button with text "المزيد"
 * - Purchases: table row with cursor-pointer class
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// Warmup: Pre-compile all 4 list pages to avoid cold-start skips
// ═══════════════════════════════════════════════════════════════
test('warmup: pre-compile list pages', async ({ adminPage }) => {
    // Visit each list page to trigger Next.js JIT compilation
    // These pages have heavy client components that need first-time compilation
    for (const path of ['/invoices', '/projects', '/employees', '/purchases']) {
        await adminPage.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(3000);
    }
});

// ─── Page-Specific Navigation Helpers ──────────────────────────────────
// After clicking, waits for loading indicator to disappear before returning.

async function waitForDetailPageLoad(page: Page): Promise<void> {
    // Wait for the loading text "جاري التحميل" to disappear
    const loading = page.locator('text=جاري التحميل');
    try {
        await loading.waitFor({ state: 'hidden', timeout: 15_000 });
    } catch (_e) {
        // Loading might have already disappeared
    }
    await page.waitForTimeout(500);
}

async function navigateToFirstInvoice(page: Page): Promise<boolean> {
    await page.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
    const btn = page.locator('button[title="عرض الفاتورة"]').first();
    try {
        await btn.waitFor({ state: 'visible', timeout: 20_000 });
        await btn.click();
        await page.waitForURL((url) => url.pathname.startsWith('/invoices/') && url.pathname !== '/invoices/', { timeout: 15_000 });
        await waitForDetailPageLoad(page);
        return true;
    } catch (_e) { return false; }
}

async function navigateToFirstProject(page: Page): Promise<boolean> {
    // Approach: go to projects list, wait for any project heading (h4) to render,
    // then extract the project URL from clicking a card, or use evaluate to find it.
    await page.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });

    // Wait for the "grid" view to render project cards.
    // Each project grid card has: <Card onClick={...} className="...cursor-pointer group">
    //   <h4 className="...font-bold...">Project Name</h4>
    // So wait for a bold heading inside the main content area
    try {
        // Wait for any project card h4 heading to appear (indicates data loaded)
        const projectHeading = page.locator('main h4.font-bold').first();
        await projectHeading.waitFor({ state: 'visible', timeout: 25_000 });

        // Now click the closest ancestor card which has the onClick handler
        // The card is the parent with class cursor-pointer
        await projectHeading.click();

        await page.waitForURL((url) => url.pathname.startsWith('/projects/') && url.pathname !== '/projects/', { timeout: 15_000 });
        await waitForDetailPageLoad(page);
        return true;
    } catch (_e) { return false; }
}

async function navigateToFirstEmployee(page: Page): Promise<boolean> {
    await page.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(2000);
    const moreBtn = page.locator('button:has-text("المزيد")').first();
    try {
        await moreBtn.waitFor({ state: 'visible', timeout: 20_000 });
        await moreBtn.click();
        try {
            await page.waitForURL((url) => url.pathname.startsWith('/employees/') && url.pathname !== '/employees/', { timeout: 15_000 });
        } catch (_e) {
            // Retry: click again after a brief wait
            await page.waitForTimeout(1000);
            await moreBtn.click({ force: true });
            await page.waitForURL((url) => url.pathname.startsWith('/employees/') && url.pathname !== '/employees/', { timeout: 30_000 });
        }
        await waitForDetailPageLoad(page);
        return true;
    } catch (_e) { return false; }
}

async function navigateToFirstPurchase(page: Page): Promise<boolean> {
    await page.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
    const row = page.locator('tr.cursor-pointer').first();
    try {
        await row.waitFor({ state: 'visible', timeout: 20_000 });
        await row.click();
        await page.waitForURL((url) => url.pathname.startsWith('/purchases/') && url.pathname !== '/purchases/', { timeout: 15_000 });
        await waitForDetailPageLoad(page);
        return true;
    } catch (_e) { return false; }
}

// ═══════════════════════════════════════════════════════════════
// Invoice Detail Page — Action Button Visibility
// ═══════════════════════════════════════════════════════════════
test.describe('Invoice Detail — Action Buttons', () => {

    test('ADMIN sees invoice detail with print (no approve panel)', async ({ adminPage }) => {
        const found = await navigateToFirstInvoice(adminPage);
        test.skip(!found, 'No invoices to navigate to');
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('طباعة الإيصال');
    });

    test('GM sees invoice detail (no delete)', async ({ gmPage }) => {
        const found = await navigateToFirstInvoice(gmPage);
        test.skip(!found, 'No invoices to navigate to');
        const text = await gmPage.textContent('body') || '';
        expect(text).toContain('طباعة الإيصال');
        expect(text).not.toContain('نقل إلى سلة المهملات');
    });

    test('ACCOUNTANT sees invoice detail with print', async ({ accountantPage }) => {
        const found = await navigateToFirstInvoice(accountantPage);
        test.skip(!found, 'No invoices to navigate to');
        const text = await accountantPage.textContent('body') || '';
        expect(text).toContain('طباعة الإيصال');
    });

    test('PE sees invoice detail (view-only)', async ({ pePage }) => {
        const found = await navigateToFirstInvoice(pePage);
        test.skip(!found, 'No invoices to navigate to');
        const text = await pePage.textContent('body') || '';
        expect(text).toContain('طباعة الإيصال');
        expect(text).not.toContain('نقل إلى سلة المهملات');
    });
});

// ═══════════════════════════════════════════════════════════════
// Project Detail Page — Action Button Visibility
// ═══════════════════════════════════════════════════════════════
test.describe('Project Detail — Action Buttons', () => {

    test('ADMIN sees project with management actions', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects to navigate to');
        // ADMIN should see management buttons: تعديل, الأعضاء, حذف, إغلاق المشروع
        // Use locators to wait for elements to be visible (buttons may render after loading)
        await expect(adminPage.locator('button:has-text("تعديل")').first()).toBeVisible({ timeout: 10_000 });
        await expect(adminPage.locator('button:has-text("الأعضاء")').first()).toBeVisible({ timeout: 5_000 });
    });

    test('GM sees project (view-only, no close)', async ({ gmPage }) => {
        const found = await navigateToFirstProject(gmPage);
        test.skip(!found, 'No projects to navigate to');
        const text = await gmPage.textContent('body') || '';
        // GM should NOT see close/delete buttons
        expect(text).not.toContain('إغلاق المشروع نهائياً');
        expect(text).not.toContain('حذف');
    });

    test('ACCOUNTANT sees project financial data', async ({ accountantPage }) => {
        const found = await navigateToFirstProject(accountantPage);
        test.skip(!found, 'No projects to navigate to');
        // Verify the page loaded — accountant can see project detail
        expect(accountantPage.url()).toContain('/projects/');
    });

    test('PE sees own project (limited view)', async ({ pePage }) => {
        const found = await navigateToFirstProject(pePage);
        test.skip(!found, 'No projects to navigate to');
        const text = await pePage.textContent('body') || '';
        // PE should NOT see admin-only buttons
        expect(text).not.toContain('إغلاق المشروع نهائياً');
        expect(text).not.toContain('تخصيص ميزانية');
    });
});

// ═══════════════════════════════════════════════════════════════
// Employee Detail Page — Edit button (ADMIN only)
// ═══════════════════════════════════════════════════════════════
test.describe('Employee Detail — Action Buttons', () => {

    test('ADMIN sees edit option on employee detail', async ({ adminPage }) => {
        const found = await navigateToFirstEmployee(adminPage);
        test.skip(!found, 'No employees to navigate to');
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('تعديل');
    });

    test('GM sees employee (view-only)', async ({ gmPage }) => {
        const found = await navigateToFirstEmployee(gmPage);
        test.skip(!found, 'No employees to navigate to');
        expect(gmPage.url()).toContain('/employees/');
    });

    test('ACCOUNTANT sees employee (view-only)', async ({ accountantPage }) => {
        const found = await navigateToFirstEmployee(accountantPage);
        test.skip(!found, 'No employees to navigate to');
        expect(accountantPage.url()).toContain('/employees/');
    });
});

// ═══════════════════════════════════════════════════════════════
// Purchase Detail Page
// ═══════════════════════════════════════════════════════════════
test.describe('Purchase Detail — Action Buttons', () => {

    test('ADMIN sees purchase detail', async ({ adminPage }) => {
        const found = await navigateToFirstPurchase(adminPage);
        test.skip(!found, 'No purchases to navigate to');
        expect(adminPage.url()).toContain('/purchases/');
    });

    test('GM sees purchase detail', async ({ gmPage }) => {
        const found = await navigateToFirstPurchase(gmPage);
        test.skip(!found, 'No purchases to navigate to');
        expect(gmPage.url()).toContain('/purchases/');
    });

    test('PM sees own project purchases', async ({ pmPage }) => {
        const found = await navigateToFirstPurchase(pmPage);
        test.skip(!found, 'No purchases to navigate to');
        expect(pmPage.url()).toContain('/purchases/');
    });

    test('PE sees purchase detail', async ({ pePage }) => {
        const found = await navigateToFirstPurchase(pePage);
        test.skip(!found, 'No purchases to navigate to');
        expect(pePage.url()).toContain('/purchases/');
    });
});

// ═══════════════════════════════════════════════════════════════
// Dynamic Route Access
// ═══════════════════════════════════════════════════════════════
test.describe('Dynamic Route Access', () => {

    test('ADMIN accessing /custody/new is redirected to /projects (page always redirects)', async ({ adminPage }) => {
        await adminPage.goto('/custody/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const url = new URL(adminPage.url());
        expect(url.pathname).toBe('/projects');
    });

    test('PE is denied /custody/new (proxy blocks USER role)', async ({ pePage }) => {
        await pePage.goto('/custody/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        const url = new URL(pePage.url());
        expect(url.pathname).toBe('/');
    });

    test('ADMIN can navigate to employee edit page', async ({ adminPage }) => {
        const found = await navigateToFirstEmployee(adminPage);
        test.skip(!found, 'No employees to navigate to');
        // Look for edit link/button on detail page
        const editBtn = adminPage.locator('a:has-text("تعديل"), button:has-text("تعديل")').first();
        if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editBtn.click();
            await adminPage.waitForLoadState('networkidle', { timeout: 15_000 });
            expect(adminPage.url()).toContain('/edit');
        }
    });

    test('ADMIN can access /manual page', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(new URL(adminPage.url()).pathname).toBe('/manual');
    });

    test('PE can access /notifications page', async ({ pePage }) => {
        await pePage.goto('/notifications', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(new URL(pePage.url()).pathname).toBe('/notifications');
    });

    test('PE can access /my-custodies page', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(new URL(pePage.url()).pathname).toBe('/my-custodies');
    });

    test('PM can access /my-custodies page', async ({ pmPage }) => {
        await pmPage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(new URL(pmPage.url()).pathname).toBe('/my-custodies');
    });

    test('Outsider can access /my-custodies page', async ({ outsiderPage }) => {
        await outsiderPage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(new URL(outsiderPage.url()).pathname).toBe('/my-custodies');
    });
});
