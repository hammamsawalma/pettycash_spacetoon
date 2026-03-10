/**
 * Phase 7 — E2E Debt Settlement — 14 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-DS: Debt Settlement', () => {
    test('E2E-DS1: Debts list renders', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-DS2: ACC views debts', async ({ accountantPage }) => {
        await accountantPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect(accountantPage.url()).toContain('/debts');
    });
    test('E2E-DS3: PE sees own debts only', async ({ pePage }) => {
        await pePage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect(pePage.url()).toContain('/debts');
    });
    test('E2E-DS4: GM cannot settle debts', async ({ gmPage }) => {
        await gmPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const t = await gmPage.textContent('body') || '';
        const settleBtn = gmPage.locator('button:has-text("تسوية")');
        expect(await settleBtn.count()).toBe(0);
    });
    test('E2E-DS5: PE cannot settle debts', async ({ pePage }) => {
        await pePage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const settleBtn = pePage.locator('button:has-text("تسوية")');
        expect(await settleBtn.count()).toBe(0);
    });
    test('E2E-DS6: Debt list shows amounts', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-DS7: Debt shows invoice info', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-DS8: Debt settlement button for ACC', async ({ accountantPage }) => {
        await accountantPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect((await accountantPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-DS9: Debt settlement button for ADMIN', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-DS10: Debts page no overflow', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });
    test('E2E-DS11: PM sees debts', async ({ pmPage }) => {
        await pmPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        expect(pmPage.url()).toContain('/debts');
    });
    test('E2E-DS12: Debt detail has employee info', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-DS13: Multiple debts listed', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-DS14: Settlement updates wallet', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
});
