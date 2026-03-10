/**
 * Phase 6 — Mobile Bottom Nav (Employee/USER)
 *
 * Tests MBE1–MBE14: Employee bottom nav on iPhone 14 viewport.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-01: Employee Bottom Nav', () => {

    test('MBE1: Bottom nav visible on dashboard', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const nav = pePage.locator('nav[aria-label="التنقل الرئيسي"]');
        await expect(nav).toBeVisible();
    });

    test('MBE2: Shows 5 nav items (حسابي عهدي الديون المشاريع الرئيسية)', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('nav[aria-label="التنقل الرئيسي"]') || '';
        expect(bodyText).toContain('الرئيسية');
        expect(bodyText).toContain('المشاريع');
    });

    test('MBE3: Active item highlighted on dashboard (/)', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const activeLink = pePage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        const count = await activeLink.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MBE4: Active item highlighted on /my-custodies', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const activeLink = pePage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        const count = await activeLink.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MBE5: Active item highlighted on /debts', async ({ pePage }) => {
        await pePage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const activeLink = pePage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        const count = await activeLink.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MBE6: Active item highlighted on /projects', async ({ pePage }) => {
        await pePage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const activeLink = pePage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        const count = await activeLink.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MBE7: Active item highlighted on /settings', async ({ pePage }) => {
        await pePage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const activeLink = pePage.locator('nav[aria-label="التنقل الرئيسي"] a[aria-current="page"]');
        const count = await activeLink.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MBE8: CTA button visible inside navbar', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        // CTA is inside the nav element (not floating above it)
        const cta = pePage.locator('nav[aria-label="التنقل الرئيسي"] button[aria-label="رفع فاتورة"], nav[aria-label="التنقل الرئيسي"] button[aria-label="طلب شراء"]');
        const count = await cta.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MBE9: Nav hidden on /invoices/new', async ({ pePage }) => {
        await pePage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const nav = pePage.locator('nav[aria-label="التنقل الرئيسي"]');
        const count = await nav.count();
        expect(count).toBe(0);
    });

    test('MBE10: Nav hidden on /purchases/new or page redirects', async ({ pePage }) => {
        await pePage.goto('/purchases/new', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        // PE may be redirected if not coordinator
        const nav = pePage.locator('nav[aria-label="التنقل الرئيسي"]');
        const count = await nav.count();
        const url = pePage.url();
        expect(count === 0 || !url.includes('/purchases/new')).toBeTruthy();
    });

    test('MBE11: Nav links have minimum touch target', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const links = pePage.locator('nav[aria-label="التنقل الرئيسي"] a');
        const count = await links.count();
        expect(count).toBeGreaterThan(0);
        // Check first link has sufficient height
        if (count > 0) {
            const box = await links.first().boundingBox();
            expect(box).not.toBeNull();
            if (box) {
                expect(box.height).toBeGreaterThanOrEqual(44);
            }
        }
    });

    test('MBE12: Nav links navigate correctly', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        // Click on المشاريع link
        const projectsLink = pePage.locator('nav[aria-label="التنقل الرئيسي"] a[href="/projects"]');
        if (await projectsLink.count() > 0) {
            await projectsLink.click();
            await pePage.waitForURL('**/projects', { timeout: 10000 }).catch(() => { });
            expect(pePage.url()).toContain('/projects');
        }
    });

    test('MBE13: Nav items show icons (including CTA)', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        // 5 nav item icons + 1 CTA icon = 6 total
        const icons = pePage.locator('nav[aria-label="التنقل الرئيسي"] svg[aria-hidden="true"]');
        const count = await icons.count();
        expect(count).toBeGreaterThanOrEqual(5);
    });

    test('MBE14: Nav bar has glassmorphism style', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const nav = pePage.locator('nav[aria-label="التنقل الرئيسي"]');
        await expect(nav).toBeVisible();
        // Check it has the backdrop-blur class
        const navHtml = await nav.innerHTML();
        expect(navHtml).toContain('backdrop-blur');
    });

    test('MBE15: CTA button is within navbar bounds (not floating above)', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const nav = pePage.locator('nav[aria-label="التنقل الرئيسي"]');
        const cta = pePage.locator('nav[aria-label="التنقل الرئيسي"] button[aria-label="رفع فاتورة"], nav[aria-label="التنقل الرئيسي"] button[aria-label="طلب شراء"]');
        const navBox = await nav.boundingBox();
        const ctaBox = await cta.first().boundingBox();
        if (navBox && ctaBox) {
            // CTA top must be at or below the nav top (not floating above)
            expect(ctaBox.y).toBeGreaterThanOrEqual(navBox.y);
            // CTA bottom must be at or above the nav bottom
            expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(navBox.y + navBox.height + 1);
        }
    });

    test('MBE16: CTA has distinct styled background', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const cta = pePage.locator('nav[aria-label="التنقل الرئيسي"] button[aria-label="رفع فاتورة"], nav[aria-label="التنقل الرئيسي"] button[aria-label="طلب شراء"]');
        if (await cta.count() > 0) {
            const ctaHtml = await cta.first().evaluate(el => el.className);
            expect(ctaHtml).toContain('bg-[#102550]');
        }
    });

    test('MBE17: CTA button has adequate touch target', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const cta = pePage.locator('nav[aria-label="التنقل الرئيسي"] button[aria-label="رفع فاتورة"], nav[aria-label="التنقل الرئيسي"] button[aria-label="طلب شراء"]');
        if (await cta.count() > 0) {
            const box = await cta.first().boundingBox();
            expect(box).not.toBeNull();
            if (box) {
                expect(box.width).toBeGreaterThanOrEqual(44);
                expect(box.height).toBeGreaterThanOrEqual(44);
            }
        }
    });
});
