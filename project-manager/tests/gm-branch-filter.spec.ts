/**
 * GM Dashboard Branch Filter Tests
 * Tests branch selector, data isolation, comparison table, and role restrictions
 */
import { test, expect } from './fixtures/auth.fixture';
import type { Page } from '@playwright/test';

async function loadDashboard(page: Page) {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(2000);
}

async function getBodyText(page: Page): Promise<string> {
    return (await page.textContent('body')) || '';
}

// ═══════════════════════════════════════════════════════════════
// GM Dashboard Core Elements
// ═══════════════════════════════════════════════════════════════
test.describe('GM Dashboard — Core', () => {
    test('renders dashboard title', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const text = await getBodyText(gmPage);
        expect(text).toContain('لوحة المدير العام');
    });

    test('shows KPI cards', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const text = await getBodyText(gmPage);
        expect(text).toContain('رصيد الخزنة');
        expect(text).toContain('المشاريع النشطة');
        expect(text).toContain('الموظفون');
        expect(text).toContain('الفواتير المعلّقة');
    });

    test('shows financial flow section', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const text = await getBodyText(gmPage);
        expect(text).toContain('التدفق المالي الشامل');
    });

    test('shows recent projects section', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const text = await getBodyText(gmPage);
        expect(text).toContain('آخر المشاريع');
    });
});

// ═══════════════════════════════════════════════════════════════
// Branch Selector
// ═══════════════════════════════════════════════════════════════
test.describe('GM Dashboard — Branch Selector', () => {
    test('shows branch selector with "كل الفروع" default', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const selector = gmPage.locator('#gm-branch-selector');
        await expect(selector).toBeVisible();
        const text = await selector.textContent();
        expect(text).toContain('كل الفروع');
    });

    test('opens branch dropdown on click', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const selector = gmPage.locator('#gm-branch-selector button').first();
        await selector.click();
        await gmPage.waitForTimeout(500);
        // Should show branch options
        const body = await getBodyText(gmPage);
        // At least "كل الفروع" option should be visible in the dropdown
        expect(body).toContain('كل الفروع');
    });

    test('can select a specific branch', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const selector = gmPage.locator('#gm-branch-selector button').first();
        await selector.click();
        await gmPage.waitForTimeout(500);

        // Click on first branch option (not "كل الفروع" which is first)
        const branchButtons = gmPage.locator('#gm-branch-selector >> button');
        const count = await branchButtons.count();
        if (count > 2) {
            // Click second option (first branch after "كل الفروع")
            await branchButtons.nth(2).click();
            await gmPage.waitForTimeout(2000);
            // Dashboard should update — subtitle should change
            const text = await getBodyText(gmPage);
            expect(text).toContain('عرض بيانات فرع');
        }
    });

    test('can switch back to all branches', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const selector = gmPage.locator('#gm-branch-selector button').first();
        
        // Open and select a branch first
        await selector.click();
        await gmPage.waitForTimeout(300);
        const branchButtons = gmPage.locator('#gm-branch-selector >> button');
        const count = await branchButtons.count();
        if (count > 2) {
            await branchButtons.nth(2).click();
            await gmPage.waitForTimeout(2000);
            
            // Now switch back to all
            await selector.click();
            await gmPage.waitForTimeout(300);
            const allButton = gmPage.locator('#gm-branch-selector >> button').first();
            // Click the "كل الفروع" button inside dropdown (2nd button overall - the first in dropdown list)
            const dropdownButtons = gmPage.locator('#gm-branch-selector button');
            await dropdownButtons.nth(1).click();
            await gmPage.waitForTimeout(2000);
            
            const text = await getBodyText(gmPage);
            expect(text).toContain('كل الفروع');
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// Branch Comparison Table
// ═══════════════════════════════════════════════════════════════
test.describe('GM Dashboard — Branch Comparison', () => {
    test('shows comparison table when viewing all branches', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const text = await getBodyText(gmPage);
        expect(text).toContain('مقارنة أداء الفروع');
    });

    test('comparison table has branch rows', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const comparison = gmPage.locator('#gm-branch-comparison');
        await expect(comparison).toBeVisible();
        // Should contain table headers
        const text = await comparison.textContent();
        expect(text).toContain('المشاريع');
        expect(text).toContain('الموظفون');
        expect(text).toContain('رصيد الخزنة');
    });

    test('comparison table shows totals row', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        const comparison = gmPage.locator('#gm-branch-comparison');
        const text = await comparison.textContent();
        expect(text).toContain('المجموع');
    });

    test('comparison hidden when branch selected', async ({ gmPage }) => {
        await loadDashboard(gmPage);
        
        // Select a specific branch
        const selector = gmPage.locator('#gm-branch-selector button').first();
        await selector.click();
        await gmPage.waitForTimeout(300);
        const branchButtons = gmPage.locator('#gm-branch-selector >> button');
        const count = await branchButtons.count();
        if (count > 2) {
            await branchButtons.nth(2).click();
            await gmPage.waitForTimeout(2000);
            
            // Comparison table should be hidden
            const comparison = gmPage.locator('#gm-branch-comparison');
            await expect(comparison).toBeHidden();
        }
    });
});

// ═══════════════════════════════════════════════════════════════
// Role Restrictions
// ═══════════════════════════════════════════════════════════════
test.describe('GM Dashboard — Role Restrictions', () => {
    test('PE does not see GM dashboard', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(1500);
        const text = await getBodyText(pePage);
        expect(text).not.toContain('لوحة المدير العام');
    });

    test('ADMIN does not see GM dashboard', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(1500);
        const text = await getBodyText(adminPage);
        expect(text).not.toContain('لوحة المدير العام');
    });

    test('ACCOUNTANT does not see GM dashboard', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(1500);
        const text = await getBodyText(accountantPage);
        expect(text).not.toContain('لوحة المدير العام');
    });
});
