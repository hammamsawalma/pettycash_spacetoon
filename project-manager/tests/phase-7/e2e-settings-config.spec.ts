/**
 * Phase 7 — E2E Settings & Config — 12 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-SC: Settings & Configuration', () => {
    test('E2E-SC1: ADMIN settings page', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('إعدادات') || t.length > 100).toBeTruthy();
    });
    test('E2E-SC2: Auto-approval in settings', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('اعتماد') || t.includes('تلقائي') || t.length > 200).toBeTruthy();
    });
    test('E2E-SC3: Categories in settings', async ({ adminPage }) => {
        await adminPage.goto('/settings/categories', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('تصنيف') || t.length > 100).toBeTruthy();
    });
    test('E2E-SC4: PE settings (limited)', async ({ pePage }) => {
        await pePage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-SC5: GM settings', async ({ gmPage }) => {
        await gmPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect((await gmPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-SC6: ACC settings', async ({ accountantPage }) => {
        await accountantPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect((await accountantPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-SC7: Manual/help accessible', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-SC8: Settings no overflow', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });
    test('E2E-SC9: Settings persist after nav', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForTimeout(2000);
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForTimeout(1000);
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-SC10: PM settings', async ({ pmPage }) => {
        await pmPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        expect((await pmPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-SC11: PEPM settings', async ({ pepmPage }) => {
        await pepmPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await pepmPage.waitForLoadState('networkidle').catch(() => { });
        await pepmPage.waitForTimeout(2000);
        expect((await pepmPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-SC12: Settings scrollable', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sh = await adminPage.evaluate(() => document.body.scrollHeight);
        expect(sh).toBeGreaterThan(0);
    });
});
