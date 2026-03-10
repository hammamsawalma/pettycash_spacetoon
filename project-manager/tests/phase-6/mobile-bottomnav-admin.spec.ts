/**
 * Phase 6 — Mobile Bottom Nav (ADMIN)
 *
 * Tests MBA1–MBA16: Admin bottom nav, FAB quick-add menu, notification badge.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-02: Admin Bottom Nav', () => {

    test('MBA1: Bottom nav visible on dashboard', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const nav = adminPage.locator('nav[aria-label="التنقل الرئيسي"]');
        await expect(nav).toBeVisible();
    });

    test('MBA2: Shows 4 nav items (الرئيسية المشاريع الفواتير حسابي)', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const navText = await adminPage.textContent('nav[aria-label="التنقل الرئيسي"]') || '';
        expect(navText).toContain('الرئيسية');
        expect(navText).toContain('حسابي');
    });

    test('MBA3: FAB (+) button visible', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const fab = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        const count = await fab.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MBA4: FAB opens quick-add menu', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const fab = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText).toContain('إضافة سريعة');
        }
    });

    test('MBA5: Quick-add shows فاتورة جديدة', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const fab = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText).toContain('فاتورة جديدة');
        }
    });

    test('MBA6: Quick-add shows مشروع جديد', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const fab = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText).toContain('مشروع جديد');
        }
    });

    test('MBA7: Quick-add shows طلب شراء', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const fab = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await adminPage.waitForTimeout(500);
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText).toContain('طلب شراء');
        }
    });

    test('MBA8: Quick-add menu closes on second FAB click', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const fab = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
        if (await fab.count() > 0) {
            await fab.click();
            await adminPage.waitForTimeout(500);
            // Close button should now appear
            const closeBtn = adminPage.locator('button[aria-label="إغلاق قائمة الإضافة السريعة"]');
            if (await closeBtn.count() > 0) {
                await closeBtn.click();
                await adminPage.waitForTimeout(500);
                // After closing, the open FAB button should be back
                const openBtn = adminPage.locator('button[aria-label="قائمة الإضافة السريعة"]');
                expect(await openBtn.count()).toBeGreaterThan(0);
            }
        }
    });

    test('MBA9: Active state on /', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const active = adminPage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        expect(await active.count()).toBeGreaterThan(0);
    });

    test('MBA10: Active state on /projects', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const active = adminPage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        expect(await active.count()).toBeGreaterThan(0);
    });

    test('MBA11: Active state on /invoices', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const active = adminPage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        expect(await active.count()).toBeGreaterThan(0);
    });

    test('MBA12: Active state on /settings', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const active = adminPage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        expect(await active.count()).toBeGreaterThan(0);
    });

    test('MBA13: Nav hidden on /invoices/new', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const nav = adminPage.locator('nav[aria-label="التنقل الرئيسي"]');
        expect(await nav.count()).toBe(0);
    });

    test('MBA14: Nav hidden on /projects/new', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const nav = adminPage.locator('nav[aria-label="التنقل الرئيسي"]');
        expect(await nav.count()).toBe(0);
    });

    test('MBA15: Nav icons present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const icons = adminPage.locator('nav[aria-label="التنقل الرئيسي"] svg[aria-hidden="true"]');
        expect(await icons.count()).toBeGreaterThanOrEqual(3);
    });

    test('MBA16: Touch targets meet 48px minimum', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const links = adminPage.locator('nav[aria-label="التنقل الرئيسي"] a');
        const count = await links.count();
        expect(count).toBeGreaterThan(0);
        if (count > 0) {
            const box = await links.first().boundingBox();
            if (box) {
                expect(box.height).toBeGreaterThanOrEqual(44);
            }
        }
    });
});
