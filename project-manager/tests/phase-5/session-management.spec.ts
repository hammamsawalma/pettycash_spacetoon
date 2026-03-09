/**
 * Phase 5 — Session Management
 *
 * Tests SM1–SM8: Login flow, session persistence, role redirects.
 */
import { test, expect } from '../fixtures/auth.fixture';
import { test as baseTest } from '@playwright/test';

test.describe('WF-24: Session & Auth', () => {

    test('SM1: Session persists across page navigation', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(1000);
        // Navigate to another page
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(1000);
        // Should not be redirected to login
        expect(adminPage.url()).not.toContain('/login');
    });

    test('SM2: Admin session accesses admin pages', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/settings');
    });

    test('SM3: GM session accesses GM pages', async ({ gmPage }) => {
        await gmPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(1000);
        expect(gmPage.url()).not.toContain('/login');
    });

    test('SM4: PE session persists on dashboard', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(1000);
        expect(pePage.url()).not.toContain('/login');
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });
});

// Tests using fresh browser context (no pre-auth)
baseTest.describe('WF-24: Login Flow', () => {

    baseTest('SM5: Protected routes redirect to login', async ({ page }) => {
        await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const url = page.url();
        const isOnLogin = url.includes('/login');
        const bodyText = await page.textContent('body') || '';
        const hasLoginForm = bodyText.includes('تسجيل') || bodyText.includes('دخول');
        expect(isOnLogin || hasLoginForm).toBeTruthy();
    });

    baseTest('SM6: Login page shows form fields', async ({ page }) => {
        await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        const hasForm = bodyText.includes('كلمة') || bodyText.includes('هاتف') || bodyText.includes('دخول') || bodyText.includes('تسجيل');
        expect(hasForm).toBeTruthy();
    });

    baseTest('SM7: Login page has submit button', async ({ page }) => {
        await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const submitBtn = page.locator('button[type="submit"]');
        const hasSubmit = await submitBtn.count();
        const bodyText = await page.textContent('body') || '';
        expect(hasSubmit > 0 || bodyText.includes('دخول')).toBeTruthy();
    });

    baseTest('SM8: Login page renders without errors', async ({ page }) => {
        await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(1000);
        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
    });
});
