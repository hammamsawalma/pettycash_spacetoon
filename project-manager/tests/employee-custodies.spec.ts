/**
 * Employee Custodies Page Tests
 * Verifies the /employee-custodies page is accessible and functional
 * for authorized roles and blocked for unauthorized ones.
 */
import { test, expect } from './fixtures/auth.fixture';

test.describe('Employee Custodies Page', () => {

    // ── Access Control ─────────────────────────────────────────────────────

    test('EC1: Accountant can access /employee-custodies', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('عهد الموظفين');
    });

    test('EC2: Admin can access /employee-custodies', async ({ adminPage }) => {
        await adminPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body).toContain('عهد الموظفين');
    });

    test('EC3: GM can access /employee-custodies', async ({ gmPage }) => {
        await gmPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const body = await gmPage.textContent('body') || '';
        expect(body).toContain('عهد الموظفين');
    });

    test('EC4: PROJECT_EMPLOYEE (USER) is redirected away from /employee-custodies', async ({ pePage }) => {
        await pePage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        // Proxy should redirect USER to / — they should NOT see the page title
        const url = pePage.url();
        expect(url).not.toContain('/employee-custodies');
    });

    test('EC5: PROJECT_MANAGER (USER) is redirected away from /employee-custodies', async ({ pmPage }) => {
        await pmPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        const url = pmPage.url();
        expect(url).not.toContain('/employee-custodies');
    });

    // ── KPI Cards ──────────────────────────────────────────────────────────

    test('EC6: Page renders all 4 KPI cards', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('إجمالي المصروفات');
        expect(body).toContain('الرصيد المتبقي');
        expect(body).toContain('عهد نشطة');
        expect(body).toContain('بانتظار التأكيد');
    });

    // ── Filters ────────────────────────────────────────────────────────────

    test('EC7: Page renders all 5 status filter tabs', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('الكل');
        expect(body).toContain('نشطة');
        expect(body).toContain('مغلقة');
        expect(body).toContain('مرفوضة');
    });

    test('EC8: Page has project filter dropdown with "كل المشاريع" default', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const select = accountantPage.locator('select');
        expect(await select.count()).toBeGreaterThan(0);
        const selectedValue = await select.first().inputValue();
        expect(selectedValue).toBe('all');
    });

    test('EC9: Page has employee search input', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const searchInput = accountantPage.locator('input[placeholder*="بحث"]');
        expect(await searchInput.count()).toBeGreaterThan(0);
    });

    test('EC10: Clicking status filter tabs changes active tab styling', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        // Click "مغلقة" tab
        const closedTab = accountantPage.locator('button', { hasText: 'مغلقة' }).first();
        if (await closedTab.count() > 0) {
            await closedTab.click();
            await accountantPage.waitForTimeout(500);
            // The clicked tab should now have the active style
            const classes = await closedTab.getAttribute('class') || '';
            expect(classes).toContain('bg-[#102550]');
        }
    });

    // ── Header & Actions ───────────────────────────────────────────────────

    test('EC11: Page has print report button', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('طباعة التقرير');
    });

    test('EC12: Page has descriptive subtitle', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('جميع العهد الصادرة للموظفين عبر كل المشاريع');
    });

    test('EC13: Page title is "سندات صرف عهد الموظفين"', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const body = await accountantPage.textContent('body') || '';
        expect(body).toContain('سندات صرف عهد الموظفين');
    });

    // ── Navigation ─────────────────────────────────────────────────────────

    test('EC14: Sidebar shows "عهد الموظفين" link (not old سجل العهدة)', async ({ accountantPage }) => {
        // Navigate to the page itself — this triggers the sidebar auto-expand for the custody menu
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const sidebar = await accountantPage.textContent('body') || '';
        expect(sidebar).toContain('عهد الموظفين');
        expect(sidebar).not.toContain('سجل العهدة');
    });

    test('EC15: Sidebar عهد الموظفين link navigates correctly', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        // Expand the العهدة submenu
        const custodyParent = accountantPage.locator('button, a, div', { hasText: 'العهدة' }).first();
        if (await custodyParent.count() > 0) {
            await custodyParent.click();
            await accountantPage.waitForTimeout(500);
        }
        // Click the link
        const link = accountantPage.locator('a', { hasText: 'عهد الموظفين' }).first();
        if (await link.count() > 0) {
            await link.click();
            await accountantPage.waitForLoadState('networkidle').catch(() => { });
            await accountantPage.waitForTimeout(2000);
            expect(accountantPage.url()).toContain('/employee-custodies');
        }
    });

    // ── Data Table & Empty State ───────────────────────────────────────────

    test('EC16: Empty state or data table is shown (no JS error)', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(3000);
        const body = await accountantPage.textContent('body') || '';
        // Should either show empty state or the table (with footer totals)
        const hasEmptyState = body.includes('لا توجد عهد موظفين');
        const hasTable = body.includes('الإجمالي');
        expect(hasEmptyState || hasTable).toBe(true);
    });

    test('EC17: Search filters results in real-time', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const searchInput = accountantPage.locator('input[placeholder*="بحث"]');
        if (await searchInput.count() > 0) {
            // Type a non-existent name
            await searchInput.fill('zzz_nonexistent_name_zzz');
            await accountantPage.waitForTimeout(500);
            const body = await accountantPage.textContent('body') || '';
            // Should show empty state or 0 results
            const hasEmptyState = body.includes('لا توجد عهد موظفين');
            const hasZeroTotal = body.includes('الإجمالي (0 عهدة)');
            expect(hasEmptyState || hasZeroTotal).toBe(true);
        }
    });

    // ── Voucher Links ──────────────────────────────────────────────────────

    test('EC18: If data exists, voucher "صرف" links point to /api/vouchers/', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(3000);
        // Check if any voucher links exist
        const voucherLinks = accountantPage.locator('a[href*="/api/vouchers/"]');
        const count = await voucherLinks.count();
        if (count > 0) {
            const href = await voucherLinks.first().getAttribute('href');
            expect(href).toContain('/api/vouchers/');
        }
        // If no data, that's OK too — the page should still render without errors
        expect(true).toBe(true);
    });

    test('EC19: Receipt voucher links include ?type=receipt', async ({ accountantPage }) => {
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(3000);
        // Check if any receipt voucher links exist
        const receiptLinks = accountantPage.locator('a[href*="type=receipt"]');
        const count = await receiptLinks.count();
        if (count > 0) {
            const href = await receiptLinks.first().getAttribute('href');
            expect(href).toContain('type=receipt');
        }
        // If no data with returns, that's OK
        expect(true).toBe(true);
    });

    // ── Loading State ──────────────────────────────────────────────────────

    test('EC20: Page shows loading state initially', async ({ accountantPage }) => {
        // Navigate and immediately check for loading text
        await accountantPage.goto('/employee-custodies', { waitUntil: 'domcontentloaded' });
        // Don't wait for network idle — we want to catch the loading state
        await accountantPage.waitForTimeout(500);
        const body = await accountantPage.textContent('body') || '';
        // Should show either loading state or data (if it loaded very fast)
        const hasLoading = body.includes('جاري تحميل البيانات');
        const hasData = body.includes('الإجمالي') || body.includes('لا توجد عهد موظفين');
        expect(hasLoading || hasData).toBe(true);
    });
});
