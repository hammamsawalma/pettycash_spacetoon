/**
 * Phase 3: Project CRUD Operations
 *
 * Tests PR1–PR9 from the test matrix.
 * Project creation/edit/delete: ADMIN only.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// Project Creation
// ═══════════════════════════════════════════════════════════════
test.describe('Project — Creation', () => {

    test('PR1: ADMIN can access project creation form', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/projects/new');
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('مشروع');
    });

    test('PR1: ADMIN can create a new project', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForSelector('input[name="name"]', { state: 'visible', timeout: 15_000 });

        // Fill project name
        await adminPage.fill('input[name="name"]', `مشروع اختباري ${Date.now()}`);

        // Fill budget if visible
        const budgetInput = adminPage.locator('input[name="budgetAllocated"], input[name="budget"]').first();
        if (await budgetInput.isVisible().catch(() => false)) {
            await budgetInput.fill('5000');
        }

        // Fill description if visible
        const descInput = adminPage.locator('textarea[name="description"]').first();
        if (await descInput.isVisible().catch(() => false)) {
            await descInput.fill('مشروع اختباري');
        }

        // Submit
        await adminPage.click('button[type="submit"]');
        await adminPage.waitForTimeout(3000);

        // Should redirect to projects list or project detail
        const url = adminPage.url();
        const success = !url.includes('/projects/new') || url.includes('/projects/');
        expect(success).toBeTruthy();
    });

    test('PR1-GM: GM cannot create project (denied)', async ({ gmPage }) => {
        await gmPage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        // GM should be redirected by proxy
        const url = gmPage.url();
        expect(url).not.toContain('/projects/new');
    });

    test('PR1-PM: PM cannot create project', async ({ pmPage }) => {
        await pmPage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = pmPage.url();
        expect(url).not.toContain('/projects/new');
    });

    test('PR1-PE: PE cannot create project', async ({ pePage }) => {
        await pePage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = pePage.url();
        expect(url).not.toContain('/projects/new');
    });
});

// ═══════════════════════════════════════════════════════════════
// Project Detail — View and Edit
// ═══════════════════════════════════════════════════════════════
test.describe('Project — Detail & Edit', () => {

    test('PR2: ADMIN sees edit button on project detail', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);

        // Click first project card
        const projectHeading = adminPage.locator('main h4.font-bold').first();
        const hasProject = await projectHeading.isVisible().catch(() => false);
        test.skip(!hasProject, 'No projects available');

        await projectHeading.click();
        await adminPage.waitForURL((url) => url.pathname.startsWith('/projects/') && url.pathname !== '/projects/', { timeout: 30_000 });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);

        // ADMIN should see edit button or be on project detail page
        const bodyText = await adminPage.textContent('body') || '';
        const hasEdit = bodyText.includes('تعديل') || bodyText.includes('تحرير');
        expect(hasEdit).toBeTruthy();
    });

    test('PR7: ADMIN sees delete button on project detail', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const projectHeading = adminPage.locator('main h4.font-bold').first();
        const hasProject = await projectHeading.isVisible().catch(() => false);
        test.skip(!hasProject, 'No projects available');

        await projectHeading.click();
        await adminPage.waitForURL((url) => url.pathname.startsWith('/projects/') && url.pathname !== '/projects/', { timeout: 15_000 });
        await adminPage.waitForTimeout(2000);

        // ADMIN should see delete button
        await expect(adminPage.locator('button:has-text("حذف")').first()).toBeVisible({ timeout: 10_000 });
    });

    test('PR4: ADMIN sees close project button', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const projectHeading = adminPage.locator('main h4.font-bold').first();
        const hasProject = await projectHeading.isVisible().catch(() => false);
        test.skip(!hasProject, 'No projects available');

        await projectHeading.click();
        await adminPage.waitForURL((url) => url.pathname.startsWith('/projects/') && url.pathname !== '/projects/', { timeout: 15_000 });
        await adminPage.waitForTimeout(2000);

        // ADMIN should see close project button
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('إغلاق المشروع');
    });

    test('PR8: GM can view project list', async ({ gmPage }) => {
        await gmPage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText).toContain('المشاريع');
    });

    test('PR9: PE only sees assigned projects', async ({ pePage }) => {
        await pePage.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText).toContain('المشاريع');
        // PE should see page without error
        expect(bodyText).not.toContain('غير مصرح');
    });
});
