/**
 * Phase 2: RBAC — Sidebar Navigation Visibility
 * Tests that each of the 7 roles sees ONLY the correct sidebar links.
 * 
 * NOTE: Accordion sub-items are hidden until parent is clicked.
 * For sub-items, we click the parent menu first, then verify.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: load dashboard and wait for sidebar
async function loadSidebar(page: Page) {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForSelector('nav', { timeout: 15_000 });
    await page.waitForTimeout(1000);
}

// Helper: expand an accordion menu by clicking its label, then get body text
async function expandAndGetText(page: Page, parentLabel: string): Promise<string> {
    // Click the accordion parent if it exists and is not already expanded
    const parentBtn = page.locator(`nav button:has-text("${parentLabel}")`).first();
    if (await parentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await parentBtn.click();
        // Wait for animation
        await page.waitForTimeout(500);
    }
    return await page.textContent('body') || '';
}

// Helper: get visible body text
async function getBodyText(page: Page): Promise<string> {
    return await page.textContent('body') || '';
}

// ═══════════════════════════════════════════════════════════════
// ADMIN — sees everything
// ═══════════════════════════════════════════════════════════════
test.describe('ADMIN Sidebar Visibility', () => {
    test('sees top-level nav items', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await getBodyText(adminPage);
        expect(text).toContain('لوحة التحكم');
        expect(text).toContain('المحادثات');
        expect(text).toContain('الديون');
        expect(text).toContain('الدعم الفني');
        expect(text).toContain('المؤرشفات');
        expect(text).toContain('السلة');
        expect(text).toContain('إضافة سريعة');
    });

    test('sees المشاريع accordion with sub-items', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await expandAndGetText(adminPage, 'المشاريع');
        expect(text).toContain('قائمة المشاريع');
        expect(text).toContain('إضافة مشروع جديد');
    });

    test('sees الفواتير accordion with sub-items', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await expandAndGetText(adminPage, 'الفواتير');
        expect(text).toContain('جميع الفواتير');
        expect(text).toContain('إضافة فاتورة');
    });

    test('sees المشتريات accordion with sub-items', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await expandAndGetText(adminPage, 'المشتريات');
        expect(text).toContain('جميع المشتريات');
        expect(text).toContain('إضافة طلب شراء');
    });

    test('sees العهدة accordion with sub-items (no إدارة عهدي)', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await expandAndGetText(adminPage, 'العهدة');
        expect(text).toContain('سجل العهدة');
        expect(text).toContain('العهد الخارجية');
        expect(text).not.toContain('إدارة عهدي');
    });

    test('sees خزنة الشركة with إيداع جديد', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await expandAndGetText(adminPage, 'خزنة الشركة');
        expect(text).toContain('لوحة الخزنة');
        expect(text).toContain('إيداع جديد');
    });

    test('sees الموظفين with إضافة موظف جديد', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await expandAndGetText(adminPage, 'الموظفين');
        expect(text).toContain('قائمة الموظفين');
        expect(text).toContain('إضافة موظف جديد');
    });

    test('sees الطلبات المالية + التقارير + إرسال إشعارات + إدارة التصنيفات', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await getBodyText(adminPage);
        expect(text).toContain('الطلبات المالية');
        expect(text).toContain('التقارير');
        expect(text).toContain('إرسال إشعارات');
        expect(text).toContain('إدارة التصنيفات');
    });
});

// ═══════════════════════════════════════════════════════════════
// GENERAL_MANAGER
// ═══════════════════════════════════════════════════════════════
test.describe('GM Sidebar Visibility', () => {
    test('sees top-level items', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await getBodyText(gmPage);
        expect(text).toContain('لوحة التحكم');
        expect(text).toContain('المحادثات');
        expect(text).toContain('الديون');
        expect(text).toContain('الطلبات المالية');
        expect(text).toContain('التقارير');
        expect(text).toContain('إرسال إشعارات');
        expect(text).toContain('المؤرشفات');
        expect(text).toContain('الدعم الفني');
    });

    test('does NOT see admin-only items', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await getBodyText(gmPage);
        expect(text).not.toContain('إدارة التصنيفات');
        expect(text).not.toContain('السلة');
        expect(text).not.toContain('إدارة عهدي');
    });

    test('sees المشاريع but NOT إضافة مشروع جديد', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await expandAndGetText(gmPage, 'المشاريع');
        expect(text).toContain('قائمة المشاريع');
        expect(text).not.toContain('إضافة مشروع جديد');
    });

    test('sees الفواتير but NOT إضافة فاتورة (GM is view-only)', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await expandAndGetText(gmPage, 'الفواتير');
        expect(text).toContain('جميع الفواتير');
        expect(text).not.toContain('إضافة فاتورة');
    });

    test('sees المشتريات with إضافة طلب شراء', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await expandAndGetText(gmPage, 'المشتريات');
        expect(text).toContain('جميع المشتريات');
        expect(text).toContain('إضافة طلب شراء');
    });

    test('sees العهدة with سجل العهدة + العهد الخارجية', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await expandAndGetText(gmPage, 'العهدة');
        expect(text).toContain('سجل العهدة');
        expect(text).toContain('العهد الخارجية');
    });

    test('sees خزنة الشركة but NOT إيداع جديد', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await expandAndGetText(gmPage, 'خزنة الشركة');
        expect(text).toContain('لوحة الخزنة');
        expect(text).not.toContain('إيداع جديد');
    });

    test('sees الموظفين but NOT إضافة موظف جديد', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await expandAndGetText(gmPage, 'الموظفين');
        expect(text).toContain('قائمة الموظفين');
        expect(text).not.toContain('إضافة موظف جديد');
    });
});

// ═══════════════════════════════════════════════════════════════
// GLOBAL_ACCOUNTANT
// ═══════════════════════════════════════════════════════════════
test.describe('ACCOUNTANT Sidebar Visibility', () => {
    test('sees financial items + categories', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await getBodyText(accountantPage);
        expect(text).toContain('الطلبات المالية');
        expect(text).toContain('الديون');
        expect(text).toContain('التقارير');
        expect(text).toContain('إدارة التصنيفات');
        expect(text).toContain('المؤرشفات');
    });

    test('does NOT see admin-only items', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await getBodyText(accountantPage);
        expect(text).not.toContain('السلة');
        expect(text).not.toContain('إرسال إشعارات');
        expect(text).not.toContain('إدارة عهدي');
    });

    test('sees الفواتير with إضافة فاتورة', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await expandAndGetText(accountantPage, 'الفواتير');
        expect(text).toContain('جميع الفواتير');
        expect(text).toContain('إضافة فاتورة');
    });

    test('sees المشتريات but NOT إضافة طلب شراء', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await expandAndGetText(accountantPage, 'المشتريات');
        expect(text).toContain('جميع المشتريات');
        expect(text).not.toContain('إضافة طلب شراء');
    });

    test('sees العهدة with سجل العهدة + العهد الخارجية', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await expandAndGetText(accountantPage, 'العهدة');
        expect(text).toContain('سجل العهدة');
        expect(text).toContain('العهد الخارجية');
    });

    test('sees خزنة الشركة but NOT إيداع جديد', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await expandAndGetText(accountantPage, 'خزنة الشركة');
        expect(text).toContain('لوحة الخزنة');
        expect(text).not.toContain('إيداع جديد');
    });

    test('sees الموظفين but NOT إضافة موظف', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await expandAndGetText(accountantPage, 'الموظفين');
        expect(text).toContain('قائمة الموظفين');
        expect(text).not.toContain('إضافة موظف جديد');
    });

    test('does NOT see إضافة مشروع جديد', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await expandAndGetText(accountantPage, 'المشاريع');
        expect(text).not.toContain('إضافة مشروع جديد');
    });
});

// ═══════════════════════════════════════════════════════════════
// USER+PE (PROJECT_EMPLOYEE only)
// ═══════════════════════════════════════════════════════════════
test.describe('USER+PE Sidebar Visibility', () => {
    test('sees basic nav + limited items', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await getBodyText(pePage);
        expect(text).toContain('لوحة التحكم');
        expect(text).toContain('المحادثات');
        expect(text).toContain('الديون');
        expect(text).toContain('الدعم الفني');
    });

    test('does NOT see admin/finance items', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await getBodyText(pePage);
        expect(text).not.toContain('التقارير');
        expect(text).not.toContain('المؤرشفات');
        expect(text).not.toContain('السلة');
        expect(text).not.toContain('إرسال إشعارات');
        expect(text).not.toContain('إدارة التصنيفات');
    });

    test('sees الفواتير with إضافة فاتورة (PE can create)', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await expandAndGetText(pePage, 'الفواتير');
        expect(text).toContain('جميع الفواتير');
        expect(text).toContain('إضافة فاتورة');
    });

    test('sees المشتريات but NOT إضافة طلب شراء (PE is not coordinator)', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await expandAndGetText(pePage, 'المشتريات');
        expect(text).toContain('جميع المشتريات');
        expect(text).not.toContain('إضافة طلب شراء');
    });

    test('sees العهدة with إدارة عهدي only', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await expandAndGetText(pePage, 'العهدة');
        expect(text).toContain('إدارة عهدي');
        expect(text).not.toContain('سجل العهدة');
        expect(text).not.toContain('العهد الخارجية');
    });

    test('does NOT see خزنة الشركة or الطلبات المالية', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await getBodyText(pePage);
        expect(text).not.toContain('خزنة الشركة');
        expect(text).not.toContain('الطلبات المالية');
    });

    test('does NOT see إضافة مشروع جديد', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await expandAndGetText(pePage, 'المشاريع');
        expect(text).not.toContain('إضافة مشروع جديد');
    });
});

// ═══════════════════════════════════════════════════════════════
// USER+PM (PROJECT_MANAGER only) — isCoordinatorInAny = true
// ═══════════════════════════════════════════════════════════════
test.describe('USER+PM Sidebar Visibility', () => {
    test('sees المشتريات with إضافة طلب شراء (coordinator)', async ({ pmPage }) => {
        await loadSidebar(pmPage);
        const text = await expandAndGetText(pmPage, 'المشتريات');
        expect(text).toContain('جميع المشتريات');
        expect(text).toContain('إضافة طلب شراء');
    });

    test('sees العهدة with إدارة عهدي only', async ({ pmPage }) => {
        await loadSidebar(pmPage);
        const text = await expandAndGetText(pmPage, 'العهدة');
        expect(text).toContain('إدارة عهدي');
        expect(text).not.toContain('سجل العهدة');
    });

    test('does NOT see admin/finance items', async ({ pmPage }) => {
        await loadSidebar(pmPage);
        const text = await getBodyText(pmPage);
        expect(text).not.toContain('التقارير');
        expect(text).not.toContain('السلة');
        expect(text).not.toContain('خزنة الشركة');
        expect(text).not.toContain('قائمة الموظفين');
    });

    test('sees إضافة سريعة', async ({ pmPage }) => {
        await loadSidebar(pmPage);
        const text = await getBodyText(pmPage);
        expect(text).toContain('إضافة سريعة');
    });
});

// ═══════════════════════════════════════════════════════════════
// USER+PE+PM (Both roles)
// ═══════════════════════════════════════════════════════════════
test.describe('USER+PE+PM Sidebar Visibility', () => {
    test('sees الفواتير with إضافة فاتورة', async ({ pepmPage }) => {
        await loadSidebar(pepmPage);
        const text = await expandAndGetText(pepmPage, 'الفواتير');
        expect(text).toContain('إضافة فاتورة');
    });

    test('sees العهدة with إدارة عهدي', async ({ pepmPage }) => {
        await loadSidebar(pepmPage);
        const text = await expandAndGetText(pepmPage, 'العهدة');
        expect(text).toContain('إدارة عهدي');
        expect(text).not.toContain('سجل العهدة');
    });

    test('does NOT see admin-only items', async ({ pepmPage }) => {
        await loadSidebar(pepmPage);
        const text = await getBodyText(pepmPage);
        expect(text).not.toContain('خزنة الشركة');
        expect(text).not.toContain('قائمة الموظفين');
    });
});

// ═══════════════════════════════════════════════════════════════
// USER (No Project / Outsider) — minimal sidebar
// ═══════════════════════════════════════════════════════════════
test.describe('USER (No Project) Sidebar Visibility', () => {
    test('sees basic items', async ({ outsiderPage }) => {
        await loadSidebar(outsiderPage);
        const text = await getBodyText(outsiderPage);
        expect(text).toContain('لوحة التحكم');
        expect(text).toContain('المحادثات');
        expect(text).toContain('الدعم الفني');
    });

    test('does NOT see admin/finance items', async ({ outsiderPage }) => {
        await loadSidebar(outsiderPage);
        const text = await getBodyText(outsiderPage);
        expect(text).not.toContain('خزنة الشركة');
        expect(text).not.toContain('قائمة الموظفين');
        expect(text).not.toContain('التقارير');
        expect(text).not.toContain('السلة');
        expect(text).not.toContain('المؤرشفات');
        expect(text).not.toContain('إدارة التصنيفات');
    });

    test('does NOT see إضافة طلب شراء (not coordinator)', async ({ outsiderPage }) => {
        await loadSidebar(outsiderPage);
        // Outsider is USER but not coordinator, so no purchase create
        const text = await getBodyText(outsiderPage);
        expect(text).not.toContain('إضافة طلب شراء');
    });
});
