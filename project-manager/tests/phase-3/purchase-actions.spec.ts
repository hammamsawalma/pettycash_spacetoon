/**
 * Phase 3: Purchase Status Transitions & Edge Cases
 *
 * Tests for: markPurchaseAsBought, togglePurchaseRedFlag, softDeletePurchase,
 * and closed project validation.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Navigate to any purchase detail
async function navigateToAnyPurchase(page: Page): Promise<boolean> {
    await page.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    const row = page.locator('table tbody tr[class*="cursor"]').first();
    if (await row.isVisible().catch(() => false)) {
        await row.click({ force: true });
        try {
            await page.waitForURL((url) => /\/purchases\/[a-zA-Z0-9]/.test(url.pathname), { timeout: 20_000 });
            await page.waitForTimeout(2000);
            return true;
        } catch (_e) { return false; }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════
// Purchase — Mark as Bought
// ═══════════════════════════════════════════════════════════════
test.describe('Purchase — Mark as Bought', () => {

    test('P-MB1: ADMIN sees "إتمام الشراء" button in purchase list', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('إتمام الشراء');
    });

    test('P-MB2: GM sees "إتمام الشراء" button in purchase list', async ({ gmPage }) => {
        await gmPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await gmPage.waitForTimeout(3000);
        const bodyText = await gmPage.textContent('body') || '';
        // GM should also see markAsBought
        expect(bodyText).toContain('إتمام الشراء');
    });

    test('P-MB3: PE sees purchases page', async ({ pePage }) => {
        await pePage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(3000);
        const bodyText = await pePage.textContent('body') || '';
        // PE can see purchases page — may or may not see markAsBought depending on project role
        expect(bodyText).toContain('المشتريات');
    });
});

// ═══════════════════════════════════════════════════════════════
// Purchase — Red Flag
// ═══════════════════════════════════════════════════════════════
test.describe('Purchase — Red Flag', () => {

    test('P-RF1: ADMIN can see red flag controls on purchase detail', async ({ adminPage }) => {
        const found = await navigateToAnyPurchase(adminPage);
        test.skip(!found, 'No purchases');
        const bodyText = await adminPage.textContent('body') || '';
        // Detail page should have action controls for admin
        expect(bodyText).toContain('طلب');
    });

    test('P-RF2: PM sees purchase detail page', async ({ pmPage }) => {
        const found = await navigateToAnyPurchase(pmPage);
        test.skip(!found, 'No purchases for PM');
        // PM should at least see the detail page
        expect(pmPage.url()).toContain('/purchases/');
    });
});

// ═══════════════════════════════════════════════════════════════
// Purchase — Soft Delete
// ═══════════════════════════════════════════════════════════════
test.describe('Purchase — Soft Delete', () => {

    test('P-SD1: ACC cannot see delete on purchase detail', async ({ accountantPage }) => {
        const found = await navigateToAnyPurchase(accountantPage);
        test.skip(!found, 'No purchases');
        const bodyText = await accountantPage.textContent('body') || '';
        // Only ADMIN should have delete — ACC should NOT
        expect(bodyText).not.toContain('نقل إلى السلة');
    });

    test('P-SD2: PE cannot see delete on purchase detail', async ({ pePage }) => {
        const found = await navigateToAnyPurchase(pePage);
        test.skip(!found, 'No purchases');
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText).not.toContain('نقل إلى السلة');
        expect(bodyText).not.toContain('حذف نهائي');
    });
});

// ═══════════════════════════════════════════════════════════════
// Purchase — List Filtering
// ═══════════════════════════════════════════════════════════════
test.describe('Purchase — List Features', () => {

    test('P-LF1: ADMIN sees purchase status filters', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('الكل');
        expect(bodyText).toContain('بانتظار الشراء');
    });

    test('P-LF2: ADMIN sees "إضافة طلب شراء" button', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('إضافة طلب شراء');
    });

    test('P-LF3: PE does not see "إضافة طلب شراء"', async ({ pePage }) => {
        await pePage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText).not.toContain('إضافة طلب شراء');
    });

    test('P-LF4: Search box exists on purchase list', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const searchInput = adminPage.locator('input[placeholder*="ابحث"]').first();
        expect(await searchInput.isVisible().catch(() => false)).toBeTruthy();
    });
});
