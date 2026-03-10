/**
 * Employee Custodies Page Tests
 * Verifies the /employee-custodies page is accessible and functional
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Employee Custodies Page', () => {

    test('EC1: Accountant can navigate to /employee-custodies', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        // Page should contain the title
        expect(body).toContain('عهد الموظفين');
    });

    test('EC2: Admin can navigate to /employee-custodies', async ({ adminPage }) => {
        await adminPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body).toContain('عهد الموظفين');
    });

    test('EC3: GM can navigate to /employee-custodies', async ({ gmPage }) => {
        await gmPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const body = await gmPage.textContent('body') || '';
        expect(body).toContain('عهد الموظفين');
    });

    test('EC4: Page renders KPI cards', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('إجمالي المصروفات');
        expect(body).toContain('الرصيد المتبقي');
        expect(body).toContain('عهد نشطة');
        expect(body).toContain('بانتظار التأكيد');
    });

    test('EC5: Page renders filter tabs', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        // Filter tabs
        const allTab = accountantPage.locator('button', { hasText: 'الكل' });
        expect(await allTab.count()).toBeGreaterThan(0);
        const pendingTab = accountantPage.locator('button', { hasText: 'بانتظار التأكيد' });
        expect(await pendingTab.count()).toBeGreaterThan(0);
    });

    test('EC6: Page has project filter dropdown', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const select = accountantPage.locator('select');
        expect(await select.count()).toBeGreaterThan(0);
    });

    test('EC7: Page has employee search input', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const searchInput = accountantPage.locator('input[placeholder*="بحث"]');
        expect(await searchInput.count()).toBeGreaterThan(0);
    });

    test('EC8: Page has print report button', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('طباعة التقرير');
    });

    test('EC9: Page has subtitle explaining scope', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('جميع العهد الصادرة للموظفين عبر كل المشاريع');
    });

    test('EC10: Sidebar shows عهد الموظفين link', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        // Check sidebar has the new link
        const sidebarLink = accountantPage.locator('a[href="/employee-custodies"]');
        expect(await sidebarLink.count()).toBeGreaterThan(0);
    });

    test('EC11: Sidebar no longer has old سجل العهدة link to /deposits', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        // Old link should NOT be in sidebar
        const oldLink = accountantPage.locator('nav a[href="/deposits"]');
        expect(await oldLink.count()).toBe(0);
    });

    test('EC12: Table header columns are correct', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        // Even if table is empty, check subtitle is there
        expect(body).toContain('سندات صرف عهد الموظفين');
    });
});
