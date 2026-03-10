/**
 * ROOT Dashboard & Branch Management Tests
 * Verifies that the ROOT user sees the correct dashboard, sidebar items,
 * and can access the branch management page.
 */
import { test, expect } from './fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: load page and wait for hydration
async function loadPage(page: Page, path = '/') {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(2000); // Wait for client hydration
}

// ═══════════════════════════════════════════════════════════════
// ROOT Dashboard — should see RootDashboard, NOT AdminDashboard
// ═══════════════════════════════════════════════════════════════
test.describe('ROOT Dashboard', () => {
    test('renders RootDashboard component (not AdminDashboard)', async ({ rootPage }) => {
        await loadPage(rootPage, '/');

        // Wait for the RootDashboard to fully load (it fetches data via useEffect)
        // The RootDashboard shows "لوحة التحكم المركزية" in its banner
        await rootPage.waitForSelector('text=لوحة التحكم المركزية', { timeout: 15_000 }).catch(() => null);

        const text = await rootPage.textContent('body') || '';

        // RootDashboard-specific markers
        expect(text).toContain('ROOT ACCESS');
        expect(text).toContain('لوحة التحكم المركزية');

        // Should NOT show AdminDashboard-specific markers
        expect(text).not.toContain('نسبة الإنجاز');
        expect(text).not.toContain('عدد المشاريع حسب الفترة');
    });

    test('shows aggregate KPI cards', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        await rootPage.waitForSelector('text=لوحة التحكم المركزية', { timeout: 15_000 }).catch(() => null);

        const text = await rootPage.textContent('body') || '';

        // RootDashboard KPI labels
        expect(text).toContain('إجمالي المشاريع');
        expect(text).toContain('إجمالي الموظفين');
        expect(text).toContain('رصيد الخزن الموحّد');
        expect(text).toContain('فواتير معلّقة');
    });

    test('shows active branches section', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        await rootPage.waitForSelector('text=الفروع النشطة', { timeout: 15_000 }).catch(() => null);

        const text = await rootPage.textContent('body') || '';

        // Branch section
        expect(text).toContain('الفروع النشطة');
        expect(text).toContain('إدارة الفروع');
    });

    test('shows wallet comparison chart', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        await rootPage.waitForSelector('text=مقارنة رصيد الخزنة بين الفروع', { timeout: 15_000 }).catch(() => null);

        const text = await rootPage.textContent('body') || '';
        expect(text).toContain('مقارنة رصيد الخزنة بين الفروع');
    });

    test('shows financial flow section', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        await rootPage.waitForSelector('text=التدفق المالي الموحّد', { timeout: 15_000 }).catch(() => null);

        const text = await rootPage.textContent('body') || '';
        expect(text).toContain('التدفق المالي الموحّد');
        expect(text).toContain('إجمالي الوارد');
        expect(text).toContain('إجمالي المنصرف');
        expect(text).toContain('الرصيد الحالي');
    });
});

// ═══════════════════════════════════════════════════════════════
// ROOT Sidebar — should see "إدارة الفروع" and all admin items
// ═══════════════════════════════════════════════════════════════
test.describe('ROOT Sidebar Visibility', () => {
    test('sees إدارة الفروع in sidebar', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        await rootPage.waitForSelector('nav', { timeout: 15_000 });

        const navText = await rootPage.locator('nav').first().textContent() || '';
        expect(navText).toContain('إدارة الفروع');
    });

    test('sees standard admin-level nav items', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        await rootPage.waitForSelector('nav', { timeout: 15_000 });

        const text = await rootPage.textContent('body') || '';
        expect(text).toContain('لوحة التحكم');
        expect(text).toContain('المحادثات');
        expect(text).toContain('الديون');
        expect(text).toContain('إضافة سريعة');
    });

    test('ADMIN does NOT see إدارة الفروع', async ({ adminPage }) => {
        await loadPage(adminPage, '/');
        await adminPage.waitForSelector('nav', { timeout: 15_000 });

        const navText = await adminPage.locator('nav').first().textContent() || '';
        expect(navText).not.toContain('إدارة الفروع');
    });
});

// ═══════════════════════════════════════════════════════════════
// Branches Page — ROOT can access and sees all branches
// ═══════════════════════════════════════════════════════════════
test.describe('ROOT Branches Page', () => {
    test('can access /branches page', async ({ rootPage }) => {
        await loadPage(rootPage, '/branches');

        const text = await rootPage.textContent('body') || '';
        expect(text).toContain('إدارة الفروع');
    });

    test('sees all 6 branches', async ({ rootPage }) => {
        await loadPage(rootPage, '/branches');
        await rootPage.waitForSelector('text=قطر', { timeout: 15_000 }).catch(() => null);

        const text = await rootPage.textContent('body') || '';

        // All 6 branches from seed
        expect(text).toContain('قطر');
        expect(text).toContain('الإمارات');
        expect(text).toContain('البحرين');
        expect(text).toContain('السعودية');
        expect(text).toContain('تركيا');
        expect(text).toContain('سوريا');
    });

    test('shows branch stats for Qatar branch', async ({ rootPage }) => {
        await loadPage(rootPage, '/branches');
        await rootPage.waitForSelector('text=قطر', { timeout: 15_000 }).catch(() => null);

        // Qatar should have data (22 projects, 24 employees from seed)
        const qatarCard = rootPage.locator('text=QA').first();
        await expect(qatarCard).toBeVisible();
    });

    test('ADMIN cannot access /branches (redirected)', async ({ adminPage }) => {
        await adminPage.goto('/branches', { waitUntil: 'networkidle', timeout: 30_000 });

        // Should be redirected away or see access denied
        const url = adminPage.url();
        const text = await adminPage.textContent('body') || '';
        // Either redirected to home or shows error
        expect(url.includes('/branches') && text.includes('إدارة الفروع')).toBeFalsy();
    });
});
