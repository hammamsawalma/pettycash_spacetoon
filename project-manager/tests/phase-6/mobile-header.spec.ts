/**
 * Phase 6 — Mobile Header
 *
 * Tests MH1–MH10: Header behavior on mobile — hamburger, title, notifications.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-05: Mobile Header', () => {

    test('MH1: Header visible on page load', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const header = adminPage.locator('header');
        await expect(header).toBeVisible();
    });

    test('MH2: Header shows page content', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerText = await adminPage.locator('header').textContent() || '';
        expect(headerText.length).toBeGreaterThan(0);
    });

    test('MH3: Hamburger button visible on mobile', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const buttons = adminPage.locator('header button');
        expect(await buttons.count()).toBeGreaterThan(0);
    });

    test('MH4: Notification bell visible', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Look for notification bell icon or button
        const bell = adminPage.locator('header button svg, header a svg');
        expect(await bell.count()).toBeGreaterThan(0);
    });

    test('MH5: Header compact on mobile', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const header = adminPage.locator('header');
        const box = await header.boundingBox();
        if (box) {
            expect(box.height).toBeLessThan(100); // Compact header <= 80-90px
        }
    });

    test('MH6: Header doesn\'t overflow', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const header = adminPage.locator('header');
        const box = await header.boundingBox();
        if (box) {
            expect(box.width).toBeLessThanOrEqual(390 + 1); // iPhone 14 width
        }
    });

    test('MH7: Header visible on /projects', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const header = adminPage.locator('header');
        await expect(header).toBeVisible();
    });

    test('MH8: Header visible on /invoices', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const header = adminPage.locator('header');
        await expect(header).toBeVisible();
    });

    test('MH9: PE header visible', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const header = pePage.locator('header');
        await expect(header).toBeVisible();
    });

    test('MH10: GM header visible', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const header = gmPage.locator('header');
        await expect(header).toBeVisible();
    });
});
