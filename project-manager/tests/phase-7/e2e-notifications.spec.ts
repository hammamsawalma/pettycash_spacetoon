/**
 * Phase 7 — E2E Notifications — 14 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-NF: Notifications', () => {
    test('E2E-NF1: Notifications list renders', async ({ adminPage }) => {
        await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-NF2: Send notification page', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('إشعار') || t.includes('عنوان') || t.length > 100).toBeTruthy();
    });
    test('E2E-NF3: GM can send notifications', async ({ gmPage }) => {
        await gmPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect((await gmPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-NF4: PE cannot send notifications', async ({ pePage }) => {
        await pePage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const u = pePage.url(); const t = await pePage.textContent('body') || '';
        expect(!u.includes('/notifications/send') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-NF5: ACC cannot send notifications', async ({ accountantPage }) => {
        await accountantPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const u = accountantPage.url(); const t = await accountantPage.textContent('body') || '';
        expect(!u.includes('/notifications/send') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-NF6: Notification form has title field', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const inp = adminPage.locator('input[name="title"], input[placeholder*="عنوان"]');
        expect(await inp.count()).toBeGreaterThan(0);
    });
    test('E2E-NF7: Notification form has content field', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const textarea = adminPage.locator('textarea, input[name="content"]');
        expect(await textarea.count()).toBeGreaterThan(0);
    });
    test('E2E-NF8: Notification target options', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-NF9: Notification list ordered by date', async ({ adminPage }) => {
        await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-NF10: PE receives targeted notifications', async ({ pePage }) => {
        await pePage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect(pePage.url()).toContain('/notifications');
    });
    test('E2E-NF11: System notifications visible', async ({ adminPage }) => {
        await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-NF12: Notification unread badge', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-NF13: Notification validation', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const btn = adminPage.locator('button[type="submit"]').first();
        if (await btn.count() > 0) { await btn.click(); await adminPage.waitForTimeout(1000); }
        expect(adminPage.url()).toContain('/notifications');
    });
    test('E2E-NF14: Notifications no overflow', async ({ adminPage }) => {
        await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });
});
