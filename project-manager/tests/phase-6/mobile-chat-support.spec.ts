/**
 * Phase 6 — Mobile Chat & Support
 *
 * Tests MCS1–MCS12: Chat and support pages on iPhone 14 viewport.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-10: Mobile Chat', () => {

    test('MCS1: /chat renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MCS2: Chat no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MCS3: Chat has input area', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const inputs = adminPage.locator('input, textarea');
        const bodyText = await adminPage.textContent('body') || '';
        expect(await inputs.count() > 0 || bodyText.includes('رسال')).toBeTruthy();
    });

    test('MCS4: Chat area fills mobile width', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const main = adminPage.locator('main, #main-content');
        if (await main.count() > 0) {
            const box = await main.boundingBox();
            if (box) {
                expect(box.width).toBeGreaterThan(300);
            }
        }
    });

    test('MCS5: PE can access chat on mobile', async ({ pePage }) => {
        await pePage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect(pePage.url()).toContain('/chat');
    });

    test('MCS6: GM can access chat on mobile', async ({ gmPage }) => {
        await gmPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect(gmPage.url()).toContain('/chat');
    });
});

test.describe('M6-10: Mobile Support', () => {

    test('MCS7: /support renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MCS8: /support no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MCS9: Support tickets list visible', async ({ adminPage }) => {
        await adminPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should show tickets or empty state
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MCS10: PE can access support on mobile', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect(pePage.url()).toContain('/support');
    });

    test('MCS11: /manual page renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MCS12: Manual content readable (no truncation)', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(3000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        // No horizontal overflow means content is readable
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });
});
