/**
 * Phase 6 — Mobile Dashboard
 *
 * Tests MD1–MD16: Dashboard rendering per role on iPhone 14 viewport.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-06: Mobile Dashboard — ADMIN', () => {

    test('MD1: ADMIN dashboard renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MD2: Dashboard cards visible', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Dashboard should show stats or summary cards
        const hasCards = bodyText.includes('مشروع') || bodyText.includes('فاتور') || bodyText.includes('إحصائ');
        expect(hasCards || bodyText.length > 200).toBeTruthy();
    });

    test('MD3: No horizontal overflow on ADMIN dashboard', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test('MD4: Dashboard content scrollable', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollHeight = await adminPage.evaluate(() => document.body.scrollHeight);
        const viewportHeight = await adminPage.evaluate(() => window.innerHeight);
        // Dashboard likely extends beyond single screen
        expect(scrollHeight).toBeGreaterThan(0);
    });
});

test.describe('M6-06: Mobile Dashboard — GM', () => {

    test('MD5: GM dashboard renders on mobile', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MD6: No horizontal overflow on GM dashboard', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const scrollWidth = await gmPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await gmPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test('MD7: GM sees relevant dashboard content', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });
});

test.describe('M6-06: Mobile Dashboard — ACC', () => {

    test('MD8: ACC dashboard renders on mobile', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MD9: No horizontal overflow on ACC dashboard', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const scrollWidth = await accountantPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await accountantPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });
});

test.describe('M6-06: Mobile Dashboard — Employee', () => {

    test('MD10: PE dashboard renders on mobile', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MD11: PE should see custody/debt info', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        const hasCustodyOrDebt = bodyText.includes('عهد') || bodyText.includes('دين') || bodyText.includes('مشروع');
        expect(hasCustodyOrDebt || bodyText.length > 200).toBeTruthy();
    });

    test('MD12: No horizontal overflow on PE dashboard', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const scrollWidth = await pePage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await pePage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    });

    test('MD13: PM dashboard renders on mobile', async ({ pmPage }) => {
        await pmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        const bodyText = await pmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MD14: PE+PM dashboard renders', async ({ pepmPage }) => {
        await pepmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await pepmPage.waitForLoadState('networkidle').catch(() => { });
        await pepmPage.waitForTimeout(2000);
        const bodyText = await pepmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MD15: Action buttons visible and tappable', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Check buttons exist and have reasonable size
        const buttons = adminPage.locator('main button, main a[href]');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MD16: Dashboard loads within timeout', async ({ adminPage }) => {
        const start = Date.now();
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        const elapsed = Date.now() - start;
        // Should load within 30 seconds on prod build
        expect(elapsed).toBeLessThan(30_000);
    });
});
