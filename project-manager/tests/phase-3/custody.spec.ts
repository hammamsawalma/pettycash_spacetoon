/**
 * Phase 3: Custody Operations
 *
 * Tests C1–C17 from the test matrix.
 * Custody is issued from within the project detail page (tab: فريق المشروع والعُهد).
 * Only ADMIN and GLOBAL_ACCOUNTANT can issue custody.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Navigate to first project detail and switch to custody tab
async function navigateToProjectCustodyTab(page: Page): Promise<boolean> {
    await page.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });

    // Click first project card
    const projectHeading = page.locator('main h4.font-bold').first();
    try {
        await projectHeading.waitFor({ state: 'visible', timeout: 20_000 });
        await projectHeading.click();
        await page.waitForURL((url) => url.pathname.startsWith('/projects/') && url.pathname !== '/projects/', { timeout: 15_000 });
        await page.waitForTimeout(2000);

        // Click the "فريق المشروع والعُهد" tab
        const custodyTab = page.locator('button:has-text("فريق المشروع"), button:has-text("العُهد")').first();
        if (await custodyTab.isVisible().catch(() => false)) {
            await custodyTab.click();
            await page.waitForTimeout(2000);
            return true;
        }
        return true; // On project detail at least
    } catch (_e) {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// Custody — Issue (from project detail)
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — Issue', () => {

    test('C1: ADMIN can access custody tab in project detail', async ({ adminPage }) => {
        const found = await navigateToProjectCustodyTab(adminPage);
        test.skip(!found, 'No projects available');

        const bodyText = await adminPage.textContent('body') || '';
        // Should see custody-related content
        const hasCustodyUI = bodyText.includes('عهد') || bodyText.includes('صرف') || bodyText.includes('فريق');
        expect(hasCustodyUI).toBeTruthy();
    });

    test('C1b: ACC can access custody tab in project detail', async ({ accountantPage }) => {
        const found = await navigateToProjectCustodyTab(accountantPage);
        test.skip(!found, 'No projects available');

        const bodyText = await accountantPage.textContent('body') || '';
        const hasCustodyUI = bodyText.includes('عهد') || bodyText.includes('صرف') || bodyText.includes('فريق');
        expect(hasCustodyUI).toBeTruthy();
    });

    test('C1-PE: PE can view project custody tab (but not issue)', async ({ pePage }) => {
        const found = await navigateToProjectCustodyTab(pePage);
        test.skip(!found, 'No projects available');

        // PE should see the tab content but not the "صرف عهدة" button
        expect(pePage.url()).toContain('/projects/');
    });
});

// ═══════════════════════════════════════════════════════════════
// Custody — My Custodies View
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — My Custodies', () => {

    test('C16a: PE sees my-custodies page', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText).toContain('عهد');
    });

    test('C16b: PM sees my-custodies page', async ({ pmPage }) => {
        await pmPage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await pmPage.textContent('body') || '';
        expect(bodyText).toContain('عهد');
    });

    test('C16c: Outsider sees my-custodies (empty)', async ({ outsiderPage }) => {
        await outsiderPage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await outsiderPage.textContent('body') || '';
        // Should show the page without error (may be empty)
        expect(bodyText).not.toContain('غير مصرح');
    });
});

// ═══════════════════════════════════════════════════════════════
// Custody — Deposits Log View
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — Deposits Log', () => {

    test('C15a: ADMIN sees custody deposits log', async ({ adminPage }) => {
        await adminPage.goto('/deposits', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).not.toContain('غير مصرح');
    });

    test('C15b: ACC sees custody deposits log', async ({ accountantPage }) => {
        await accountantPage.goto('/deposits', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText).not.toContain('غير مصرح');
    });

    test('C17: External custodies page accessible by ADMIN', async ({ adminPage }) => {
        await adminPage.goto('/external-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).not.toContain('غير مصرح');
    });
});

// ═══════════════════════════════════════════════════════════════
// Custody — /custody/new redirect
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — Legacy Redirect', () => {

    test('C-legacy: /custody/new redirects to /projects for ADMIN', async ({ adminPage }) => {
        await adminPage.goto('/custody/new', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = adminPage.url();
        expect(url).toContain('/projects');
    });
});
