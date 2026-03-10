/**
 * Phase 6 — Mobile Viewport & Layout
 *
 * Tests MVL1–MVL12: Layout integrity on iPhone 14 — overflow, padding, RTL, safe-area.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

const pagesToCheck = [
    '/',
    '/projects',
    '/invoices',
    '/purchases',
    '/employees',
    '/chat',
    '/support',
    '/notifications',
];

test.describe('M6-13: Mobile Viewport & Layout', () => {

    for (const path of pagesToCheck) {
        test(`MVL: No horizontal scroll on ${path}`, async ({ adminPage }) => {
            await adminPage.goto(path, { waitUntil: 'domcontentloaded' });
            await adminPage.waitForLoadState('networkidle').catch(() => { });
            await adminPage.waitForTimeout(2000);
            const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
            const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
            expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
        });
    }

    test('MVL9: Content padding correct on mobile (p-4)', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const main = adminPage.locator('main, #main-content');
        if (await main.count() > 0) {
            const styles = await main.evaluate((el) => {
                const cs = window.getComputedStyle(el);
                return { paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight };
            });
            // p-4 = 16px on mobile
            const paddingValue = parseInt(styles.paddingLeft || '0');
            expect(paddingValue).toBeGreaterThanOrEqual(8);
            expect(paddingValue).toBeLessThanOrEqual(32);
        }
    });

    test('MVL10: Font sizes readable (min 12px)', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Check body font size
        const fontSize = await adminPage.evaluate(() => {
            const cs = window.getComputedStyle(document.body);
            return parseInt(cs.fontSize);
        });
        expect(fontSize).toBeGreaterThanOrEqual(12);
    });

    test('MVL11: RTL direction set', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const dir = await adminPage.evaluate(() => {
            return document.documentElement.dir || document.body.dir || window.getComputedStyle(document.body).direction;
        });
        expect(dir).toBe('rtl');
    });

    test('MVL12: Content doesn\'t overlap bottom nav', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const main = adminPage.locator('main, #main-content');
        if (await main.count() > 0) {
            const styles = await main.evaluate((el) => {
                const cs = window.getComputedStyle(el);
                return { paddingBottom: cs.paddingBottom };
            });
            const pb = parseInt(styles.paddingBottom || '0');
            // Should have bottom padding for nav (pb-[calc(5rem+env(safe-area-inset-bottom))])
            expect(pb).toBeGreaterThanOrEqual(40);
        }
    });
});
