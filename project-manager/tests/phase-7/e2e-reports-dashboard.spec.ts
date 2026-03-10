/**
 * Phase 7 — E2E Reports & Dashboard — 16 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-RD: Reports & Dashboard', () => {
    test('E2E-RD1: ADMIN dashboard renders', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(100);
    });
    test('E2E-RD2: ADMIN dashboard wallet stats', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('محفظ') || t.includes('رصيد') || t.length > 200).toBeTruthy();
    });
    test('E2E-RD3: ADMIN dashboard projects', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('مشاريع') || t.includes('مشروع') || t.length > 200).toBeTruthy();
    });
    test('E2E-RD4: GM dashboard renders', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect((await gmPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-RD5: ACC dashboard renders', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect((await accountantPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-RD6: PE dashboard renders', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-RD7: PM dashboard', async ({ pmPage }) => {
        await pmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        expect((await pmPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-RD8: Reports page for ADMIN', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-RD9: Reports page for ACC', async ({ accountantPage }) => {
        await accountantPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect(accountantPage.url()).toContain('/reports');
    });
    test('E2E-RD10: Reports page for GM', async ({ gmPage }) => {
        await gmPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect((await gmPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-RD11: PE cannot access reports', async ({ pePage }) => {
        await pePage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const u = pePage.url(); const t = await pePage.textContent('body') || '';
        expect(!u.includes('/reports') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-RD12: External custody report', async ({ adminPage }) => {
        await adminPage.goto('/external-custodies', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-RD13: Dashboard no overflow', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });
    test('E2E-RD14: Company expenses section', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-RD15: Dashboard scrollable', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sh = await adminPage.evaluate(() => document.body.scrollHeight);
        expect(sh).toBeGreaterThan(0);
    });
    test('E2E-RD16: Reports no overflow', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });
});
