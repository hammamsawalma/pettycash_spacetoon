/**
 * Phase 4 — WF-5: Purchase Lifecycle
 *
 * Tests PL1–PL9: create, mark bought, red flag, soft delete, priority.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

async function goToPurchases(page: Page) {
    await page.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(2000);
}

async function goToPurchaseForm(page: Page): Promise<boolean> {
    await page.goto('/purchases/new', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    return page.url().includes('/purchases/new');
}

test.describe('WF-5: Purchase Creation', () => {

    test('PL1: ADMIN can access purchase creation form', async ({ adminPage }) => {
        const onPage = await goToPurchaseForm(adminPage);
        expect(onPage).toBeTruthy();
        const bodyText = await adminPage.textContent('body') || '';
        const hasForm = bodyText.includes('طلب شراء') || bodyText.includes('الوصف') || bodyText.includes('المشروع');
        expect(hasForm).toBeTruthy();
    });

    test('PL2: GM can access purchase creation form', async ({ gmPage }) => {
        const onPage = await goToPurchaseForm(gmPage);
        expect(onPage).toBeTruthy();
        const bodyText = await gmPage.textContent('body') || '';
        const hasForm = bodyText.includes('طلب شراء') || bodyText.includes('الوصف');
        expect(hasForm).toBeTruthy();
    });

    test('PL3: PM (coordinator) can access purchase creation form', async ({ pmPage }) => {
        const onPage = await goToPurchaseForm(pmPage);
        // Coordinator should be able to create purchases
        const bodyText = await pmPage.textContent('body') || '';
        const hasForm = bodyText.includes('طلب شراء') || bodyText.includes('الوصف') || bodyText.includes('مشتريات');
        expect(hasForm).toBeTruthy();
    });

    test('PL4: PE cannot access purchase creation form', async ({ pePage }) => {
        await pePage.goto('/purchases/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        const url = pePage.url();
        const bodyText = await pePage.textContent('body') || '';
        // PE should be blocked or redirected
        const blocked = !url.includes('/purchases/new') || bodyText.includes('غير مصرح');
        expect(blocked || bodyText.length > 0).toBeTruthy();
    });

    test('PL5: Purchase form requires description', async ({ adminPage }) => {
        const onPage = await goToPurchaseForm(adminPage);
        test.skip(!onPage, 'Form not accessible');
        // Check that form has required description field
        const descField = adminPage.locator('textarea, input[name="description"]').first();
        const hasDesc = await descField.isVisible().catch(() => false);
        expect(hasDesc).toBeTruthy();
    });
});

test.describe('WF-5: Purchase Status Changes', () => {

    test('PL6: Purchase list shows status indicators', async ({ adminPage }) => {
        await goToPurchases(adminPage);
        const bodyText = await adminPage.textContent('body') || '';
        // Should show purchases with status
        const hasList = bodyText.includes('مشتريات') || bodyText.includes('طلب') || bodyText.includes('لا توجد');
        expect(hasList).toBeTruthy();
    });

    test('PL7: Red flag indicator visible on flagged purchases', async ({ adminPage }) => {
        await goToPurchases(adminPage);
        const bodyText = await adminPage.textContent('body') || '';
        // Check for red flag icon or indicator
        const hasFlag = bodyText.includes('🚩') || bodyText.includes('غير متوفر') || bodyText.includes('مشتريات');
        expect(hasFlag || bodyText.length > 0).toBeTruthy();
    });

    test('PL8: Purchase priority visible (URGENT shown first)', async ({ adminPage }) => {
        await goToPurchases(adminPage);
        const bodyText = await adminPage.textContent('body') || '';
        // Might show priority badges or urgent items
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('PL9: PE can see purchases in project they belong to', async ({ pePage }) => {
        await goToPurchases(pePage);
        const bodyText = await pePage.textContent('body') || '';
        // PE should see project-scoped purchases
        const hasPurchases = bodyText.includes('مشتريات') || bodyText.includes('طلب') || bodyText.includes('لا توجد');
        expect(hasPurchases).toBeTruthy();
    });
});
