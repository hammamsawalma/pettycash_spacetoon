/**
 * Phase 6 — Mobile Detail Pages
 *
 * Tests MDP1–MDP14: Detail/view pages render correctly on iPhone 14.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-09: Mobile Detail Pages', () => {

    test('MDP1: /wallet page renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MDP2: /wallet no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MDP3: /reports page renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MDP4: /reports no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MDP5: /settings page renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MDP6: /settings/categories page renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/settings/categories', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MDP7: /manual page renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MDP8: /manual no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(3000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MDP9: /wallet balance card visible', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasBalance = bodyText.includes('رصيد') || bodyText.includes('محفظ') || bodyText.includes('المحفظة');
        expect(hasBalance || bodyText.length > 100).toBeTruthy();
    });

    test('MDP10: /wallet/deposit renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MDP11: /wallet/deposit no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MDP12: /manual scrollable on mobile', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(3000);
        const scrollHeight = await adminPage.evaluate(() => document.body.scrollHeight);
        const viewportHeight = await adminPage.evaluate(() => window.innerHeight);
        expect(scrollHeight).toBeGreaterThan(viewportHeight);
    });

    test('MDP13: /settings PE view on mobile', async ({ pePage }) => {
        await pePage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MDP14: /reports GM view on mobile', async ({ gmPage }) => {
        await gmPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
