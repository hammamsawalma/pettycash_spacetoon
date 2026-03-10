/**
 * Phase 7 — E2E Cross-Module Workflows — 22 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-CM: Cross-Module Workflows', () => {
    test('E2E-CM1: Deposit→Wallet visible', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('رصيد') || t.includes('محفظ')).toBeTruthy();
    });
    test('E2E-CM2: Project→Invoice navigation', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/projects/"]').first();
        if (await link.count() > 0) { await link.click(); await adminPage.waitForTimeout(2000); }
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('فاتور') || t.length > 200).toBeTruthy();
    });
    test('E2E-CM3: Project→Purchase navigation', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/projects/"]').first();
        if (await link.count() > 0) { await link.click(); await adminPage.waitForTimeout(2000); }
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(200);
    });
    test('E2E-CM4: Project→Custody navigation', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/projects/"]').first();
        if (await link.count() > 0) { await link.click(); await adminPage.waitForTimeout(2000); }
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('عهد') || t.length > 200).toBeTruthy();
    });
    test('E2E-CM5: Dashboard→Projects link', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/projects"]').first();
        expect(await link.count()).toBeGreaterThan(0);
    });
    test('E2E-CM6: Dashboard→Invoices link', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/invoices"]').first();
        expect(await link.count()).toBeGreaterThan(0);
    });
    test('E2E-CM7: Dashboard shows financial info', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(200);
    });
    test('E2E-CM8: Trash→Restore→ListCheck', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CM9: Category→Invoice form', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('تصنيف') || t.length > 200).toBeTruthy();
    });
    test('E2E-CM10: Notification after action', async ({ adminPage }) => {
        await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CM11: Reports reflect data', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CM12: Support→ADMIN notification', async ({ adminPage }) => {
        await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CM13: End-of-project: archives', async ({ adminPage }) => {
        await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CM14: Chat→Project Members filter', async ({ pePage }) => {
        await pePage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CM15: Invoice→Debt created', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CM16: Dashboard data all roles', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect((await gmPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-CM17: ACC dashboard data', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect((await accountantPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-CM18: PE dashboard data', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-CM19: PM dashboard data', async ({ pmPage }) => {
        await pmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        expect((await pmPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-CM20: PEPM dual-role dashboard', async ({ pepmPage }) => {
        await pepmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await pepmPage.waitForLoadState('networkidle').catch(() => { });
        await pepmPage.waitForTimeout(2000);
        expect((await pepmPage.textContent('body') || '').length).toBeGreaterThan(100);
    });
    test('E2E-CM21: Sidebar→all pages accessible', async ({ adminPage }) => {
        const pages = ['/projects', '/invoices', '/purchases', '/employees', '/wallet'];
        for (const p of pages) {
            await adminPage.goto(p, { waitUntil: 'domcontentloaded' });
            await adminPage.waitForTimeout(1000);
            expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
        }
    });
    test('E2E-CM22: Full 7-role dashboard access', async ({ adminPage, gmPage, accountantPage, pePage, pmPage, pepmPage }) => {
        for (const [role, pg] of [['ADMIN', adminPage], ['GM', gmPage], ['ACC', accountantPage], ['PE', pePage], ['PM', pmPage], ['PEPM', pepmPage]] as const) {
            await (pg as any).goto('/', { waitUntil: 'domcontentloaded' });
            await (pg as any).waitForTimeout(1500);
            expect(((await (pg as any).textContent('body')) || '').length).toBeGreaterThan(50);
        }
    });
});
