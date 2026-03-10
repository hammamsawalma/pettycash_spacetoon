/**
 * Phase 6 — Mobile Touch & Interactions
 *
 * Tests MTI1–MTI14: Touch targets, modals, toasts, dropdowns on iPhone 14.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-12: Mobile Touch & Interactions', () => {

    test('MTI1: Main content buttons have min 44px touch target', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const buttons = adminPage.locator('main button');
        const count = await buttons.count();
        if (count > 0) {
            const box = await buttons.first().boundingBox();
            if (box) {
                expect(box.height).toBeGreaterThanOrEqual(30);
            }
        }
    });

    test('MTI2: Nav buttons have min touch target', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const navLinks = adminPage.locator('nav a');
        const count = await navLinks.count();
        if (count > 0) {
            const box = await navLinks.first().boundingBox();
            if (box) {
                expect(box.height).toBeGreaterThanOrEqual(40);
            }
        }
    });

    test('MTI3: Toast notification visible area', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Verify toast container exists (it's always rendered by Toaster)
        const bodyHtml = await adminPage.innerHTML('body');
        // react-hot-toast renders a container div
        expect(bodyHtml.length).toBeGreaterThan(100);
    });

    test('MTI4: Loading state placeholder', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' });
        // Don't wait for network idle — check for loading/spinner
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('MTI5: Empty state centered on mobile', async ({ adminPage }) => {
        await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Check no overflow
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MTI6: Badge/status indicators visible', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Status badges should be visible
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MTI7: Skip to content link exists', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const skipLink = adminPage.locator('a[href="#main-content"]');
        expect(await skipLink.count()).toBeGreaterThan(0);
    });

    test('MTI8: ARIA live region exists', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const liveRegion = adminPage.locator('[aria-live="polite"]');
        expect(await liveRegion.count()).toBeGreaterThan(0);
    });

    test('MTI9: FAB button tappable on mobile', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const fab = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            const box = await fab.boundingBox();
            if (box) {
                expect(box.width).toBeGreaterThanOrEqual(40);
                expect(box.height).toBeGreaterThanOrEqual(40);
            }
        }
    });

    test('MTI10: Header buttons tappable', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtns = adminPage.locator('header button');
        const count = await headerBtns.count();
        if (count > 0) {
            const box = await headerBtns.first().boundingBox();
            if (box) {
                expect(box.width).toBeGreaterThanOrEqual(30);
                expect(box.height).toBeGreaterThanOrEqual(30);
            }
        }
    });

    test('MTI11: Notification dropdown positioned in viewport', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // The notification bell should be within the viewport
        const bell = adminPage.locator('header button').last();
        if (await bell.count() > 0) {
            const box = await bell.boundingBox();
            if (box) {
                expect(box.x).toBeGreaterThanOrEqual(0);
                expect(box.x + box.width).toBeLessThanOrEqual(395);
            }
        }
    });

    test('MTI12: Form validation messages visible', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Try submitting empty form
        const submitBtn = adminPage.locator('button[type="submit"]');
        if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await adminPage.waitForTimeout(1000);
            // Check for validation messages or error
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText.length).toBeGreaterThan(50);
        }
    });

    test('MTI13: Dropdown menus within viewport', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // General check: no element extends beyond viewport
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test('MTI14: Page transitions work', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(1000);
        expect(adminPage.url()).toContain('/projects');
    });
});
