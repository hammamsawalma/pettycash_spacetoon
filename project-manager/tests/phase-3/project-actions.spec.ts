/**
 * Phase 3: Project Lifecycle & Edge Cases
 *
 * Tests for: updateProject, closeProject, reopenProject, softDeleteProject,
 * updateProjectStatus, project member management, and detail page actions.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Navigate to first project detail
async function navigateToFirstProject(page: Page): Promise<boolean> {
    await page.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    // Project cards have cursor-pointer class
    const card = page.locator('[class*="cursor-pointer"]').first();
    if (await card.isVisible().catch(() => false)) {
        await card.click();
        try {
            await page.waitForURL((url) => /\/projects\/[a-zA-Z0-9]/.test(url.pathname), { timeout: 20_000 });
            await page.waitForTimeout(2000);
            return true;
        } catch (_e) { return false; }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════
// Project — Detail Page Actions
// ═══════════════════════════════════════════════════════════════
test.describe('Project — Detail Actions', () => {

    test('PR-DA1: ADMIN sees edit button on project detail', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects');
        const bodyText = await adminPage.textContent('body') || '';
        const hasEdit = bodyText.includes('تعديل') || bodyText.includes('تحرير');
        expect(hasEdit).toBeTruthy();
    });

    test('PR-DA2: ADMIN sees delete/trash option on project detail', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects');
        const bodyText = await adminPage.textContent('body') || '';
        const hasDelete = bodyText.includes('حذف') || bodyText.includes('سلة') || bodyText.includes('نقل');
        expect(hasDelete).toBeTruthy();
    });

    test('PR-DA3: ADMIN sees close project button', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects');
        const bodyText = await adminPage.textContent('body') || '';
        const hasClose = bodyText.includes('إغلاق') || bodyText.includes('إنهاء');
        expect(hasClose).toBeTruthy();
    });

    test('PR-DA4: GM cannot see edit on project detail', async ({ gmPage }) => {
        const found = await navigateToFirstProject(gmPage);
        test.skip(!found, 'No projects for GM');
        const bodyText = await gmPage.textContent('body') || '';
        // GM should NOT see edit button (only ADMIN)
        expect(bodyText).not.toContain('تعديل المشروع');
    });

    test('PR-DA5: PM cannot see close/delete on project detail', async ({ pmPage }) => {
        const found = await navigateToFirstProject(pmPage);
        test.skip(!found, 'No projects for PM');
        const bodyText = await pmPage.textContent('body') || '';
        // PM should NOT see close or delete buttons
        expect(bodyText).not.toContain('إغلاق المشروع');
        expect(bodyText).not.toContain('نقل إلى السلة');
    });

    test('PR-DA6: PE cannot see edit/close/delete on project detail', async ({ pePage }) => {
        const found = await navigateToFirstProject(pePage);
        test.skip(!found, 'No projects for PE');
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText).not.toContain('تعديل المشروع');
        expect(bodyText).not.toContain('إغلاق المشروع');
        expect(bodyText).not.toContain('نقل إلى السلة');
    });
});

// ═══════════════════════════════════════════════════════════════
// Project — Detail Content
// ═══════════════════════════════════════════════════════════════
test.describe('Project — Detail Content', () => {

    test('PR-DC1: Project detail shows budget info', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects');
        const bodyText = await adminPage.textContent('body') || '';
        const hasBudget = bodyText.includes('الميزانية') || bodyText.includes('المصروف') || bodyText.includes('ر.ق');
        expect(hasBudget).toBeTruthy();
    });

    test('PR-DC2: Project detail shows team members', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects');
        const bodyText = await adminPage.textContent('body') || '';
        const hasMembers = bodyText.includes('الفريق') || bodyText.includes('أعضاء') || bodyText.includes('العضو');
        expect(hasMembers).toBeTruthy();
    });

    test('PR-DC3: Project detail has tabs (invoices/purchases/custody)', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects');
        const bodyText = await adminPage.textContent('body') || '';
        // Project detail should have tabs for related data
        const hasTabs = bodyText.includes('الفواتير') || bodyText.includes('المشتريات') || bodyText.includes('العهدة');
        expect(hasTabs).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Project — Edit Form
// ═══════════════════════════════════════════════════════════════
test.describe('Project — Edit', () => {

    test('PR-E1: ADMIN can access project edit page', async ({ adminPage }) => {
        const found = await navigateToFirstProject(adminPage);
        test.skip(!found, 'No projects');
        // Click edit button
        const editBtn = adminPage.locator('button:has-text("تعديل"), a:has-text("تعديل")').first();
        const hasEdit = await editBtn.isVisible().catch(() => false);
        test.skip(!hasEdit, 'Edit button not visible');
        await editBtn.click();
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should see editable form fields
        const hasForm = bodyText.includes('اسم المشروع') || bodyText.includes('الميزانية') || bodyText.includes('حفظ');
        expect(hasForm).toBeTruthy();
    });

    test('PR-E2: Non-ADMIN cannot access project edit', async ({ gmPage }) => {
        const found = await navigateToFirstProject(gmPage);
        test.skip(!found, 'No projects for GM');
        // GM should NOT have an edit button
        const editBtn = gmPage.locator('button:has-text("تعديل المشروع"), a:has-text("تعديل المشروع")').first();
        const hasEdit = await editBtn.isVisible().catch(() => false);
        expect(hasEdit).toBeFalsy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Project — Creation Edge Cases
// ═══════════════════════════════════════════════════════════════
test.describe('Project — Creation Edge Cases', () => {

    test('PR-EC1: Project creation requires name', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        // Try to submit empty form
        const submitBtn = adminPage.locator('button[type="submit"], button:has-text("إنشاء"), button:has-text("حفظ")').first();
        if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click();
            await adminPage.waitForTimeout(2000);
            // Should stay on creation page or show validation error
            const url = adminPage.url();
            expect(url).toContain('/projects/new');
        }
    });

    test('PR-EC2: ACC cannot access project creation', async ({ accountantPage }) => {
        await accountantPage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        // ACC should be redirected or see unauthorized
        const url = accountantPage.url();
        const bodyText = await accountantPage.textContent('body') || '';
        const blocked = !url.includes('/projects/new') || bodyText.includes('صلاحية') || bodyText.includes('غير مصرح');
        expect(blocked).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Project — Archived Projects
// ═══════════════════════════════════════════════════════════════
test.describe('Project — Archives', () => {

    test('PR-AR1: ADMIN can access archives page', async ({ adminPage }) => {
        await adminPage.goto('/archives', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('مؤرشف');
    });

    test('PR-AR2: PM cannot access archives', async ({ pmPage }) => {
        await pmPage.goto('/archives', { waitUntil: 'networkidle', timeout: 30_000 });
        await pmPage.waitForTimeout(2000);
        const url = pmPage.url();
        const bodyText = await pmPage.textContent('body') || '';
        // PM should be blocked or redirected
        const blocked = !url.includes('/archives') || bodyText.includes('صلاحية') || bodyText.includes('غير مصرح');
        expect(blocked).toBeTruthy();
    });
});
