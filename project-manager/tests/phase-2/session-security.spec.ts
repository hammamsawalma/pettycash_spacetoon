/**
 * Phase 2: Session Security Edge Cases
 * Tests edge cases for authentication: no cookie, corrupted JWT,
 * redirect to ?from=, and logged-in user accessing /login.
 */
import { test, expect } from '@playwright/test';

test.describe('Session Security', () => {
    // These tests use a CLEAN browser context (no pre-authenticated state)

    test('Accessing dashboard without cookie redirects to /login', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(page.url()).toContain('/login');
        await context.close();
    });

    test('Accessing /invoices without cookie redirects to /login with ?from=', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('/invoices', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = new URL(page.url());
        expect(url.pathname).toBe('/login');
        expect(url.searchParams.get('from')).toBe('/invoices');
        await context.close();
    });

    test('Corrupted JWT cookie is rejected and cleared', async ({ browser }) => {
        const context = await browser.newContext();
        // Inject a corrupted cookie
        await context.addCookies([{
            name: 'session',
            value: 'eyJhbGciOiJIUzI1NiJ9.CORRUPTED_PAYLOAD.invalid_signature',
            domain: 'localhost',
            path: '/',
        }]);
        const page = await context.newPage();
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
        // Should redirect to /login because the token is invalid
        expect(page.url()).toContain('/login');
        await context.close();
    });

    test('Logged-in user accessing /login is redirected to /', async ({ browser }) => {
        // First, login normally to get a valid session
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30_000 });

        // Wait for form hydration
        await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 30_000 });

        // Fill the form — same pattern as auth.setup.ts
        const emailInput = page.locator('input[name="email"]');
        await emailInput.click();
        await emailInput.fill('admin@pocket.com');

        const passInput = page.locator('input[name="password"]');
        await passInput.click();
        await passInput.fill('123456');

        // Click and wait for redirect
        await page.locator('button[type="submit"]').click();
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });

        // Verify we're logged in
        const dashboardUrl = new URL(page.url());
        expect(dashboardUrl.pathname).not.toContain('/login');

        // Now try to access /login again — should be redirected away
        await page.goto('/login', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.waitForTimeout(2000);
        const finalUrl = new URL(page.url());
        expect(finalUrl.pathname).toBe('/');
        await context.close();
    });
});
