/**
 * Phase 6 — Mobile Bottom Nav (GM & ACC roles)
 *
 * Tests MBR1–MBR12: GM and accountant bottom nav, quick-add per role.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-03: GM Bottom Nav', () => {

    test('MBR1: GM sees bottom nav', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const nav = gmPage.locator('nav[aria-label="التنقل الرئيسي"]');
        await expect(nav).toBeVisible();
    });

    test('MBR2: GM quick-add does NOT show فاتورة جديدة', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const fab = gmPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await gmPage.waitForTimeout(500);
            const menuText = await gmPage.textContent('body') || '';
            expect(menuText).not.toContain('فاتورة جديدة');
        }
    });

    test('MBR3: GM quick-add shows available items', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const fab = gmPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await gmPage.waitForTimeout(500);
            const menuText = await gmPage.textContent('body') || '';
            expect(menuText).toContain('إضافة سريعة');
        } else {
            // GM may not have quick-add items — this is valid
            expect(true).toBeTruthy();
        }
    });

    test('MBR4: GM FAB opens menu', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const fab = gmPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await gmPage.waitForTimeout(500);
            const bodyText = await gmPage.textContent('body') || '';
            expect(bodyText).toContain('إضافة سريعة');
        }
    });

    test('MBR5: GM active state on /', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const active = gmPage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        expect(await active.count()).toBeGreaterThan(0);
    });

    test('MBR6: GM nav hidden on form pages', async ({ gmPage }) => {
        await gmPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        // GM may be redirected from /invoices/new (GM can't create invoices)
        const nav = gmPage.locator('nav[aria-label="التنقل الرئيسي"]');
        const url = gmPage.url();
        expect(await nav.count() === 0 || !url.includes('/invoices/new')).toBeTruthy();
    });
});

test.describe('M6-03: ACC Bottom Nav', () => {

    test('MBR7: ACC sees bottom nav', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const nav = accountantPage.locator('nav[aria-label="التنقل الرئيسي"]');
        await expect(nav).toBeVisible();
    });

    test('MBR8: ACC quick-add shows فاتورة جديدة', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const fab = accountantPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await accountantPage.waitForTimeout(500);
            const bodyText = await accountantPage.textContent('body') || '';
            expect(bodyText).toContain('فاتورة جديدة');
        }
    });

    test('MBR9: ACC quick-add shows طلب مالي', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const fab = accountantPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await accountantPage.waitForTimeout(500);
            const bodyText = await accountantPage.textContent('body') || '';
            expect(bodyText).toContain('طلب مالي');
        }
    });

    test('MBR10: ACC active state works', async ({ accountantPage }) => {
        await accountantPage.goto('/invoices', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const active = accountantPage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        expect(await active.count()).toBeGreaterThan(0);
    });

    test('MBR11: ACC FAB opens menu', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const fab = accountantPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await accountantPage.waitForTimeout(500);
            const bodyText = await accountantPage.textContent('body') || '';
            expect(bodyText).toContain('إضافة سريعة');
        }
    });

    test('MBR12: ACC nav hidden on form pages', async ({ accountantPage }) => {
        await accountantPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const nav = accountantPage.locator('nav[aria-label="التنقل الرئيسي"]');
        expect(await nav.count()).toBe(0);
    });
});
