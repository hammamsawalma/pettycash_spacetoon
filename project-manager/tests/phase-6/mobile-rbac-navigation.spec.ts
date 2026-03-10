/**
 * Phase 6 — Mobile RBAC Navigation
 *
 * Tests MRN1–MRN14: Role-based page access on iPhone 14 viewport.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-14: Mobile RBAC Navigation', () => {

    test('MRN1: ADMIN can navigate to /projects', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        expect(adminPage.url()).toContain('/projects');
    });

    test('MRN2: ADMIN can navigate to /employees', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        expect(adminPage.url()).toContain('/employees');
    });

    test('MRN3: ADMIN can access /wallet/deposit', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        expect(adminPage.url()).toContain('/wallet/deposit');
    });

    test('MRN4: ADMIN can access /trash', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        expect(adminPage.url()).toContain('/trash');
    });

    test('MRN5: GM cannot access /wallet/deposit', async ({ gmPage }) => {
        await gmPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        // Should redirect away from /wallet/deposit
        const url = gmPage.url();
        const isRedirected = !url.includes('/wallet/deposit') || url.includes('/login');
        const bodyText = await gmPage.textContent('body') || '';
        expect(isRedirected || bodyText.includes('غير مصرح')).toBeTruthy();
    });

    test('MRN6: PE can access /my-custodies', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        expect(pePage.url()).toContain('/my-custodies');
    });

    test('MRN7: PE can access /debts', async ({ pePage }) => {
        await pePage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        expect(pePage.url()).toContain('/debts');
    });

    test('MRN8: PE cannot access /employees', async ({ pePage }) => {
        await pePage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const url = pePage.url();
        const bodyText = await pePage.textContent('body') || '';
        const isDenied = !url.includes('/employees') || bodyText.includes('غير مصرح');
        expect(isDenied).toBeTruthy();
    });

    test('MRN9: PE cannot access /wallet', async ({ pePage }) => {
        await pePage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const url = pePage.url();
        const bodyText = await pePage.textContent('body') || '';
        const isDenied = !url.includes('/wallet') || bodyText.includes('غير مصرح');
        expect(isDenied).toBeTruthy();
    });

    test('MRN10: Non-ADMIN cannot access /trash', async ({ gmPage }) => {
        await gmPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const url = gmPage.url();
        const bodyText = await gmPage.textContent('body') || '';
        const isDenied = !url.includes('/trash') || bodyText.includes('غير مصرح');
        expect(isDenied).toBeTruthy();
    });

    test('MRN11: Login redirect works on mobile', async ({ page }) => {
        // Fresh page with no auth
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        expect(page.url()).toContain('/login');
    });

    test('MRN12: ADMIN can access /invoices', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        expect(adminPage.url()).toContain('/invoices');
    });

    test('MRN13: ACC can access /invoices', async ({ accountantPage }) => {
        await accountantPage.goto('/invoices', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        expect(accountantPage.url()).toContain('/invoices');
    });

    test('MRN14: GM can access /projects', async ({ gmPage }) => {
        await gmPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        expect(gmPage.url()).toContain('/projects');
    });
});
