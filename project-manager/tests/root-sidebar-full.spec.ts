/**
 * ROOT Sidebar Comprehensive — validates ROOT sees correct nav items
 * and that other roles DON'T see ROOT-only items.
 */
import { test, expect } from './fixtures/auth.fixture';
import type { Page } from '@playwright/test';

async function loadSidebar(page: Page) {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForSelector('nav', { timeout: 15_000 });
    await page.waitForTimeout(1000);
}

async function getSidebarText(page: Page): Promise<string> {
    return (await page.locator('nav').first().textContent()) || '';
}

async function expandAndGetText(page: Page, parentLabel: string): Promise<string> {
    const parentBtn = page.locator(`nav button:has-text("${parentLabel}")`).first();
    if (await parentBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await parentBtn.click();
        await page.waitForTimeout(500);
    }
    return (await page.textContent('body')) || '';
}

// ═══════════════════════════════════════════════════════════════
// ROOT Sidebar — sees everything ADMIN sees + إدارة الفروع
// ═══════════════════════════════════════════════════════════════
test.describe('ROOT Sidebar — Full Access', () => {
    test('sees إدارة الفروع (ROOT-only)', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await getSidebarText(rootPage);
        expect(text).toContain('إدارة الفروع');
    });

    test('sees لوحة التحكم', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await getSidebarText(rootPage);
        expect(text).toContain('لوحة التحكم');
    });

    test('sees المحادثات', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await getSidebarText(rootPage);
        expect(text).toContain('المحادثات');
    });

    test('sees الديون', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await getSidebarText(rootPage);
        expect(text).toContain('الديون');
    });

    test('sees إضافة سريعة', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        // إضافة سريعة is outside nav, in a button above it
        const text = await rootPage.textContent('body') || '';
        expect(text).toContain('إضافة سريعة');
    });

    test('sees المشاريع accordion with sub-items', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await expandAndGetText(rootPage, 'المشاريع');
        expect(text).toContain('قائمة المشاريع');
        expect(text).toContain('إضافة مشروع جديد');
    });

    test('sees الفواتير accordion', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await expandAndGetText(rootPage, 'الفواتير');
        expect(text).toContain('جميع الفواتير');
        expect(text).toContain('إضافة فاتورة');
    });

    test('sees المشتريات accordion', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await expandAndGetText(rootPage, 'المشتريات');
        expect(text).toContain('جميع المشتريات');
        expect(text).toContain('إضافة طلب شراء');
    });

    test('sees العهدة accordion with sub-items', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await expandAndGetText(rootPage, 'العهدة');
        expect(text).toContain('عهد الموظفين');
        expect(text).toContain('العهد الخارجية');
    });

    test('does NOT see إدارة عهدي (USER-only)', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await expandAndGetText(rootPage, 'العهدة');
        expect(text).not.toContain('إدارة عهدي');
    });

    test('sees خزنة الشركة with إيداع جديد', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await expandAndGetText(rootPage, 'خزنة الشركة');
        expect(text).toContain('لوحة الخزنة');
        expect(text).toContain('إيداع جديد');
    });

    test('sees الموظفين with إضافة موظف جديد', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await expandAndGetText(rootPage, 'الموظفين');
        expect(text).toContain('قائمة الموظفين');
        expect(text).toContain('إضافة موظف جديد');
    });

    test('sees admin-level items (التقارير، السلة، التصنيفات)', async ({ rootPage }) => {
        await loadSidebar(rootPage);
        const text = await getSidebarText(rootPage);
        expect(text).toContain('الطلبات المالية');
        expect(text).toContain('التقارير');
        expect(text).toContain('إرسال إشعارات');
        expect(text).toContain('المؤرشفات');
        expect(text).toContain('السلة');
        expect(text).toContain('إدارة التصنيفات');
    });
});

// ═══════════════════════════════════════════════════════════════
// Negative — other roles DON'T see إدارة الفروع
// ═══════════════════════════════════════════════════════════════
test.describe('إدارة الفروع visibility by role', () => {
    test('ADMIN does NOT see إدارة الفروع', async ({ adminPage }) => {
        await loadSidebar(adminPage);
        const text = await getSidebarText(adminPage);
        expect(text).not.toContain('إدارة الفروع');
    });

    test('GM does NOT see إدارة الفروع', async ({ gmPage }) => {
        await loadSidebar(gmPage);
        const text = await getSidebarText(gmPage);
        expect(text).not.toContain('إدارة الفروع');
    });

    test('ACCOUNTANT does NOT see إدارة الفروع', async ({ accountantPage }) => {
        await loadSidebar(accountantPage);
        const text = await getSidebarText(accountantPage);
        expect(text).not.toContain('إدارة الفروع');
    });

    test('PE does NOT see إدارة الفروع', async ({ pePage }) => {
        await loadSidebar(pePage);
        const text = await getSidebarText(pePage);
        expect(text).not.toContain('إدارة الفروع');
    });

    test('PM does NOT see إدارة الفروع', async ({ pmPage }) => {
        await loadSidebar(pmPage);
        const text = await getSidebarText(pmPage);
        expect(text).not.toContain('إدارة الفروع');
    });
});
