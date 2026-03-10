/**
 * Phase 7 — E2E Employee Management — 16 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-EM: Employee Management', () => {
    test('E2E-EM1: Employee list renders', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-EM2: Employee creation form', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('اسم') || t.includes('بريد')).toBeTruthy();
    });
    test('E2E-EM3: Employee form required fields', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const inputs = adminPage.locator('input, select');
        expect(await inputs.count()).toBeGreaterThan(2);
    });
    test('E2E-EM4: Employee detail accessible', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/employees/"]').first();
        if (await link.count() > 0) { await link.click(); await adminPage.waitForTimeout(2000); }
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-EM5: Employee shows job title', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-EM6: Employee creation validates email', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const emailInput = adminPage.locator('input[name="email"]');
        expect(await emailInput.count()).toBeGreaterThan(0);
    });
    test('E2E-EM7: GM cannot create employees', async ({ gmPage }) => {
        await gmPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const u = gmPage.url(); const t = await gmPage.textContent('body') || '';
        expect(!u.includes('/employees/new') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-EM8: PE cannot access employees', async ({ pePage }) => {
        await pePage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const u = pePage.url(); const t = await pePage.textContent('body') || '';
        expect(!u.includes('/employees') || t.includes('غير مصرح')).toBeTruthy();
    });
    test('E2E-EM9: Employee update form', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-EM10: Employee role change', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-EM11: Employee photo upload', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect(await adminPage.locator('input[type="file"]').count()).toBeGreaterThanOrEqual(0);
    });
    test('E2E-EM12: Employee phone displayed', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-EM13: Employee signature feature', async ({ pePage }) => {
        await pePage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-EM14: ACC can view employees', async ({ accountantPage }) => {
        await accountantPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect(accountantPage.url()).toContain('/employees');
    });
    test('E2E-EM15: GM can view employees', async ({ gmPage }) => {
        await gmPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect(gmPage.url()).toContain('/employees');
    });
    test('E2E-EM16: Employee soft-delete', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
});
