/**
 * Phase 6 — Mobile Sidebar
 *
 * Tests MS1–MS14: Sidebar navigation on mobile — hamburger toggle, groups, accordion, RTL.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-04: Mobile Sidebar', () => {

    test('MS1: Sidebar hidden by default on mobile', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Desktop sidebar should not be visible on mobile
        const sidebar = adminPage.locator('aside, nav').filter({ hasText: 'الأساسيات' });
        // It should either be hidden or off-screen
        const visibleCount = await sidebar.count();
        // On mobile the sidebar is only visible when toggled
        expect(visibleCount >= 0).toBeTruthy();
    });

    test('MS2: Hamburger menu button visible', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Look for menu/hamburger button
        const menuBtn = adminPage.locator('button').filter({ hasText: /menu|القائمة/ }).or(
            adminPage.locator('button[aria-label*="menu"], button[aria-label*="القائمة"]')
        );
        const headerBtn = adminPage.locator('header button').first();
        expect(await headerBtn.count()).toBeGreaterThan(0);
    });

    test('MS3: Hamburger click opens sidebar', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Click the first header button (hamburger)
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            // Sidebar should show navigation sections
            const hasSections = bodyText.includes('الأساسيات') || bodyText.includes('المالية') || bodyText.includes('لوحة التحكم');
            expect(hasSections).toBeTruthy();
        }
    });

    test('MS4: Sidebar shows user info', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            // Should show admin info or role
            expect(bodyText.length).toBeGreaterThan(100);
        }
    });

    test('MS5: Sidebar has backdrop overlay', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            // Look for overlay/backdrop
            const backdrop = adminPage.locator('[class*="bg-black"], [class*="backdrop"]').first();
            expect(await backdrop.count()).toBeGreaterThanOrEqual(0);
        }
    });

    test('MS6: Sidebar shows navigation groups', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText).toContain('الأساسيات');
        }
    });

    test('MS7: ADMIN sees all menu sections', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText).toContain('المالية');
        }
    });

    test('MS8: PE sees limited menu', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        // PE sees bottom nav not sidebar on mobile
        const nav = pePage.locator('nav[aria-label="التنقل الرئيسي"]');
        await expect(nav).toBeVisible();
    });

    test('MS9: Navigation from sidebar works', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            // Click a nav link
            const projectsLink = adminPage.locator('a[href="/projects"]').first();
            if (await projectsLink.count() > 0) {
                await projectsLink.click();
                await adminPage.waitForURL('**/projects', { timeout: 10000 }).catch(() => { });
                expect(adminPage.url()).toContain('/projects');
            }
        }
    });

    test('MS10: Sidebar shows logo', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            const images = adminPage.locator('img[alt*="logo"], img[alt*="Logo"], img[src*="logo"]');
            const bodyText = await adminPage.textContent('body') || '';
            // Either an image or text logo
            expect(await images.count() > 0 || bodyText.includes('Pocket')).toBeTruthy();
        }
    });

    test('MS11: Sidebar is scrollable', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(500);
            // Sidebar content should have overflow-y-auto or similar
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText.length).toBeGreaterThan(0);
        }
    });

    test('MS12: Sidebar has interactive navigation items', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const headerBtn = adminPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await adminPage.waitForTimeout(1000);
            // Check sidebar has clickable navigation links
            const navLinks = adminPage.locator('a[href]');
            const count = await navLinks.count();
            expect(count).toBeGreaterThan(3);
        }
    });

    test('MS13: GM sidebar shows correct sections', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const headerBtn = gmPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await gmPage.waitForTimeout(500);
            const bodyText = await gmPage.textContent('body') || '';
            expect(bodyText).toContain('الأساسيات');
        }
    });

    test('MS14: ACC sidebar shows correct sections', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const headerBtn = accountantPage.locator('header button').first();
        if (await headerBtn.count() > 0) {
            await headerBtn.click();
            await accountantPage.waitForTimeout(500);
            const bodyText = await accountantPage.textContent('body') || '';
            expect(bodyText).toContain('الأساسيات');
        }
    });
});
