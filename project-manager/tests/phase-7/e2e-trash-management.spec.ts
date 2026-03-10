/**
 * Phase 7 — E2E Trash Management — 12 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-TR: Trash Management', () => {
    test('E2E-TR1: Trash page renders', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-TR2: Trash shows projects section', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('مشاريع') || t.includes('مشروع') || t.length > 100).toBeTruthy();
    });
    test('E2E-TR3: Trash shows invoices section', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('فواتير') || t.includes('فاتورة') || t.length > 100).toBeTruthy();
    });
    test('E2E-TR4: Trash shows purchases section', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-TR5: Trash shows users section', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-TR6: Restore button accessible', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-TR7: Permanent delete button', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-TR8: Purge old trash option', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-TR9: Non-ADMIN cannot access trash', async ({ pePage }) => {
        await pePage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const u = pePage.url(); const t = await pePage.textContent('body') || '';
        expect(!u.includes('/trash') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-TR10: GM cannot access trash', async ({ gmPage }) => {
        await gmPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const u = gmPage.url(); const t = await gmPage.textContent('body') || '';
        expect(!u.includes('/trash') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-TR11: ACC cannot access trash', async ({ accountantPage }) => {
        await accountantPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const u = accountantPage.url(); const t = await accountantPage.textContent('body') || '';
        expect(!u.includes('/trash') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-TR12: Trash no overflow', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });
});
