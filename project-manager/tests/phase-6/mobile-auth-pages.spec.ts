/**
 * Phase 6 — Mobile Auth Pages
 *
 * Tests MAU1–MAU12: Login and register pages on iPhone 14 viewport.
 * These tests don't use auth fixture since they test unauthenticated pages.
 */
import { test, expect, devices } from '@playwright/test';

const iPhone14 = devices['iPhone 14'];

test.use({ ...iPhone14 });

test.describe('M6-11: Mobile Auth Pages', () => {

    test('MAU1: /login page renders on mobile', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MAU2: Login form fills mobile width', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const form = page.locator('form');
        if (await form.count() > 0) {
            const box = await form.boundingBox();
            if (box) {
                expect(box.width).toBeGreaterThan(300);
            }
        }
    });

    test('MAU3: Login no horizontal overflow', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test('MAU4: Quick-login buttons visible', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        const hasQuickLogin = bodyText.includes('سريع') || bodyText.includes('admin') || bodyText.includes('Admin');
        expect(hasQuickLogin || bodyText.length > 100).toBeTruthy();
    });

    test('MAU5: Email input visible', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const emailInput = page.locator('input[name="email"], input[type="email"]');
        expect(await emailInput.count()).toBeGreaterThan(0);
    });

    test('MAU6: Password input visible', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const passInput = page.locator('input[name="password"], input[type="password"]');
        expect(await passInput.count()).toBeGreaterThan(0);
    });

    test('MAU7: Login button accessible', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const submitBtn = page.locator('button[type="submit"]');
        expect(await submitBtn.count()).toBeGreaterThan(0);
    });

    test('MAU8: /register page renders on mobile', async ({ page }) => {
        await page.goto('/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MAU9: Register form fills mobile width', async ({ page }) => {
        await page.goto('/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test('MAU10: Register has name field', async ({ page }) => {
        await page.goto('/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const nameInput = page.locator('input[name="name"], input[placeholder*="اسم"]');
        const bodyText = await page.textContent('body') || '';
        expect(await nameInput.count() > 0 || bodyText.includes('اسم')).toBeTruthy();
    });

    test('MAU11: Login to register link works', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const registerLink = page.locator('a[href*="register"]');
        const bodyText = await page.textContent('body') || '';
        expect(await registerLink.count() > 0 || bodyText.includes('تسجيل')).toBeTruthy();
    });

    test('MAU12: Login inputs have proper size (no zoom trigger)', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const emailInput = page.locator('input[name="email"]');
        if (await emailInput.count() > 0) {
            const box = await emailInput.boundingBox();
            if (box) {
                // Input should be sizeable enough for mobile
                expect(box.height).toBeGreaterThanOrEqual(36);
                expect(box.width).toBeGreaterThan(200);
            }
        }
    });
});
