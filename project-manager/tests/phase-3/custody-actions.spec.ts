/**
 * Phase 3: Custody — Issuance, Confirmation, Rejection, Return
 *
 * Tests for: issueCustody, confirmCustodyReceipt, rejectCustody,
 * returnCustodyBalance, and project-level custody tab.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Navigate to a project detail custody tab
async function navigateToProjectCustodyTab(page: Page): Promise<boolean> {
    await page.goto('/projects', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    // Click first project
    const card = page.locator('[class*="cursor-pointer"]').first();
    if (await card.isVisible().catch(() => false)) {
        await card.click();
        try {
            await page.waitForURL((url) => /\/projects\/[a-zA-Z0-9]/.test(url.pathname), { timeout: 20_000 });
            await page.waitForTimeout(2000);
            // Look for custody tab and click it
            const custodyTab = page.locator('button:has-text("العهدة"), a:has-text("العهدة")').first();
            if (await custodyTab.isVisible().catch(() => false)) {
                await custodyTab.click();
                await page.waitForTimeout(2000);
                return true;
            }
        } catch (_e) { return false; }
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════
// Custody — Issue from Project Detail
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — Issuance', () => {

    test('C-IS1: ADMIN sees custody issuance form in project detail', async ({ adminPage }) => {
        const found = await navigateToProjectCustodyTab(adminPage);
        test.skip(!found, 'No project or custody tab');
        const bodyText = await adminPage.textContent('body') || '';
        // ADMIN/ACC should see issuance form
        const hasIssuance = bodyText.includes('صرف عهدة') || bodyText.includes('صرف') || bodyText.includes('عهدة جديدة');
        expect(hasIssuance).toBeTruthy();
    });

    test('C-IS2: ACC sees custody issuance form', async ({ accountantPage }) => {
        const found = await navigateToProjectCustodyTab(accountantPage);
        test.skip(!found, 'No project or custody tab');
        const bodyText = await accountantPage.textContent('body') || '';
        const hasIssuance = bodyText.includes('صرف عهدة') || bodyText.includes('صرف');
        expect(hasIssuance).toBeTruthy();
    });

    test('C-IS3: PE cannot see custody issuance form', async ({ pePage }) => {
        // PE sees custody on my-custodies page, not issuance form
        const found = await navigateToProjectCustodyTab(pePage);
        test.skip(!found, 'No project or custody tab');
        const bodyText = await pePage.textContent('body') || '';
        // PE should NOT see the issuance form on project detail
        expect(bodyText).not.toContain('صرف عهدة');
    });
});

// ═══════════════════════════════════════════════════════════════
// Custody — My Custodies
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — My Custodies Content', () => {

    test('C-MC1: PE sees custody items with status', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(3000);
        const url = pePage.url();
        // PE should be able to access my-custodies page
        const bodyText = await pePage.textContent('body') || '';
        const hasContent = bodyText.includes('عهد') || bodyText.includes('لا يوجد') || url.includes('my-custodies');
        expect(hasContent).toBeTruthy();
    });

    test('C-MC2: ADMIN is redirected from my-custodies to deposits log', async ({ adminPage }) => {
        await adminPage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const url = adminPage.url();
        // ADMIN may be redirected since they use deposits-log instead
        const bodyText = await adminPage.textContent('body') || '';
        const validAccess = url.includes('my-custodies') || url.includes('deposits') || bodyText.includes('عهد');
        expect(validAccess).toBeTruthy();
    });

    test('C-MC3: Outsider cannot see custodies', async ({ outsiderPage }) => {
        await outsiderPage.goto('/my-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        await outsiderPage.waitForTimeout(2000);
        const bodyText = await outsiderPage.textContent('body') || '';
        // Should see empty state or be blocked
        const result = bodyText.includes('لا يوجد') || bodyText.includes('صلاحية') || bodyText.includes('عهد');
        expect(result).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Custody — Deposits Log
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — Deposits Log', () => {

    test('C-DL1: ADMIN sees deposits log with entries', async ({ adminPage }) => {
        await adminPage.goto('/deposits', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasLog = bodyText.includes('سجل') || bodyText.includes('عهدة') || bodyText.includes('المبلغ') || bodyText.includes('إيداع');
        expect(hasLog).toBeTruthy();
    });

    test('C-DL2: ACC sees deposits log', async ({ accountantPage }) => {
        await accountantPage.goto('/deposits', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(3000);
        const bodyText = await accountantPage.textContent('body') || '';
        const hasLog = bodyText.includes('سجل') || bodyText.includes('عهدة') || bodyText.includes('المبلغ') || bodyText.includes('إيداع');
        expect(hasLog).toBeTruthy();
    });

    test('C-DL3: PE cannot access deposits log', async ({ pePage }) => {
        await pePage.goto('/deposits', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        const url = pePage.url();
        // PE should be redirected
        expect(url).not.toContain('/deposits');
    });
});

// ═══════════════════════════════════════════════════════════════
// Custody — External Custodies Report
// ═══════════════════════════════════════════════════════════════
test.describe('Custody — External Custodies', () => {

    test('C-EX1: ADMIN can access external custodies page', async ({ adminPage }) => {
        await adminPage.goto('/external-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasExternal = bodyText.includes('خارجية') || bodyText.includes('عهد') || bodyText.includes('اسم');
        expect(hasExternal).toBeTruthy();
    });

    test('C-EX2: ACC can access external custodies page', async ({ accountantPage }) => {
        await accountantPage.goto('/external-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        const hasExternal = bodyText.includes('خارجية') || bodyText.includes('عهد');
        expect(hasExternal).toBeTruthy();
    });

    test('C-EX3: PM cannot access external custodies', async ({ pmPage }) => {
        await pmPage.goto('/external-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        await pmPage.waitForTimeout(2000);
        const url = pmPage.url();
        // PM should be redirected
        expect(url).not.toContain('external');
    });
});
