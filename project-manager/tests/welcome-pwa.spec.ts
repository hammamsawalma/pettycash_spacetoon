/**
 * Welcome Page & PWA UX Tests
 * Tests the first-visit flow, error handling, and PWA elements
 */
import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// Welcome Page — Unauthenticated Flow
// ═══════════════════════════════════════════════════════════════
test.describe('Welcome Page — First Visit Flow', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('unauthenticated user is redirected to /welcome', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(page.url()).toContain('/welcome');
    });

    test('welcome page shows logo and title', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const body = await page.textContent('body');
        expect(body).toContain('Spacetoon Pocket');
        // Logo should be visible
        const logo = page.locator('img[alt="Spacetoon Logo"]');
        await expect(logo).toBeVisible();
    });

    test('welcome page shows features', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const body = await page.textContent('body');
        expect(body).toContain('إدارة المشاريع');
        expect(body).toContain('العهد والفواتير');
        expect(body).toContain('فروع متعددة');
    });

    test('welcome page has CTA "ابدأ الآن" button', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const cta = page.locator('.welcome-cta');
        await expect(cta).toBeVisible();
        const ctaText = await cta.textContent();
        expect(ctaText).toContain('ابدأ الآن');
    });

    test('clicking CTA shows branch selection', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        // Click "ابدأ الآن"
        await page.locator('.welcome-cta').click();
        await page.waitForTimeout(500);
        const body = await page.textContent('body');
        expect(body).toContain('اختر الفرع');
    });

    test('branch selection shows available branches', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.locator('.welcome-cta').click();
        await page.waitForTimeout(500);
        // Should show branch cards
        const branchCards = page.locator('.welcome-branch-card');
        const count = await branchCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('branch selection has ROOT login link', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.locator('.welcome-cta').click();
        await page.waitForTimeout(500);
        const rootBtn = page.locator('.welcome-root-btn');
        await expect(rootBtn).toBeVisible();
    });

    test('selecting a branch navigates to login', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.locator('.welcome-cta').click();
        await page.waitForTimeout(500);
        // Click first branch
        const firstBranch = page.locator('.welcome-branch-card').first();
        await firstBranch.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/login');
        expect(page.url()).toContain('branch=');
    });

    test('back button returns to welcome step', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.locator('.welcome-cta').click();
        await page.waitForTimeout(500);
        // Click back button
        await page.locator('.welcome-back').click();
        await page.waitForTimeout(500);
        const body = await page.textContent('body');
        expect(body).toContain('ابدأ الآن');
    });
});

// ═══════════════════════════════════════════════════════════════
// PWA Meta Tags & Manifest
// ═══════════════════════════════════════════════════════════════
test.describe('PWA — Meta and Manifest', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('manifest.json is accessible', async ({ page }) => {
        const response = await page.goto('/manifest.json');
        expect(response?.status()).toBe(200);
        const manifest = await response?.json();
        expect(manifest?.name).toBe('Spacetoon Pocket');
        expect(manifest?.display).toBe('standalone');
        expect(manifest?.lang).toBe('ar');
        expect(manifest?.dir).toBe('rtl');
    });

    test('welcome page has theme-color meta', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
        expect(themeColor).toBe('#102550');
    });

    test('welcome page has viewport meta with viewport-fit=cover', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
        expect(viewport).toContain('viewport-fit=cover');
    });

    test('welcome page has apple-touch-icon', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const icon = await page.getAttribute('link[rel="apple-touch-icon"]', 'href');
        expect(icon).toBeTruthy();
    });

    test('icons are accessible', async ({ page }) => {
        const response192 = await page.goto('/icon-192.png');
        expect(response192?.status()).toBe(200);
        const response512 = await page.goto('/icon-512.png');
        expect(response512?.status()).toBe(200);
    });
});

// ═══════════════════════════════════════════════════════════════
// Authenticated redirect — logged-in user shouldn't see /welcome
// ═══════════════════════════════════════════════════════════════
test.describe('Welcome Page — Authenticated Redirect', () => {
    test('logged-in user is redirected away from /welcome', async ({ browser }) => {
        // Use admin auth state
        const context = await browser.newContext({
            storageState: 'tests/.auth/admin.json'
        });
        const page = await context.newPage();
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        // Should be redirected to dashboard (/)
        expect(page.url()).not.toContain('/welcome');
        await context.close();
    });

    test('logged-in user should not see /login', async ({ browser }) => {
        const context = await browser.newContext({
            storageState: 'tests/.auth/admin.json'
        });
        const page = await context.newPage();
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(page.url()).not.toContain('/login');
        await context.close();
    });
});
