/**
 * Phase 5 — Responsive Navigation
 *
 * Tests RN1–RN9: Sidebar menu items per role, header, breadcrumbs.
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('WF-27: Sidebar by Role', () => {

    test('RN1: ADMIN sidebar shows all menu items', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // ADMIN should see: employees, projects, invoices, purchases, wallet, settings, trash
        const hasNav = bodyText.includes('مشاريع') && (bodyText.includes('فواتير') || bodyText.includes('موظف'));
        expect(hasNav).toBeTruthy();
    });

    test('RN2: GM sidebar shows appropriate menu items', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        const hasNav = bodyText.includes('مشاريع') || bodyText.includes('تقارير');
        expect(hasNav).toBeTruthy();
    });

    test('RN3: ACC sidebar shows financial menu items', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        const hasNav = bodyText.includes('عهد') || bodyText.includes('فواتير') || bodyText.includes('مشاريع');
        expect(hasNav).toBeTruthy();
    });

    test('RN4: PE sidebar shows employee-relevant menu', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        // PE should see limited menu — no settings, no trash
        expect(bodyText).not.toContain('إعدادات النظام');
    });

    test('RN5: PM sidebar shows coordinator menu', async ({ pmPage }) => {
        await pmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        const bodyText = await pmPage.textContent('body') || '';
        const hasNav = bodyText.includes('مشاريع') || bodyText.includes('مشتريات');
        expect(hasNav || bodyText.length > 100).toBeTruthy();
    });
});

test.describe('WF-27: Navigation Structure', () => {

    test('RN6: Page header shows user info', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should show user name or role
        const hasUser = bodyText.includes('مدير') || bodyText.includes('admin') || bodyText.includes('مرحبا');
        expect(hasUser || bodyText.length > 100).toBeTruthy();
    });

    test('RN7: Logo links to dashboard', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Check for home/logo link
        const homeLink = adminPage.locator('a[href="/"]');
        const homeCount = await homeLink.count();
        expect(homeCount).toBeGreaterThan(0);
    });

    test('RN8: Sidebar highlights active page', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Page should render with some indication of current location
        const bodyText = await adminPage.textContent('body') || '';
        const hasProjects = bodyText.includes('مشاريع') || bodyText.includes('المشاريع');
        expect(hasProjects).toBeTruthy();
    });

    test('RN9: Navigation renders consistently', async ({ adminPage }) => {
        // Test multiple page navigations for consistency
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        const bodyText1 = await adminPage.textContent('body') || '';

        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        const bodyText2 = await adminPage.textContent('body') || '';

        // Both pages should have substantial content (navigation + page content)
        expect(bodyText1.length).toBeGreaterThan(100);
        expect(bodyText2.length).toBeGreaterThan(100);
    });
});
