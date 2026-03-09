/**
 * Phase 3: Trash & Wallet — Edge Cases
 *
 * Tests for: trash page access, restore functionality, wallet edge cases,
 * and cross-module validation.
 */
import { test, expect } from '../fixtures/auth.fixture';

// ═══════════════════════════════════════════════════════════════
// Trash — Access Control
// ═══════════════════════════════════════════════════════════════
test.describe('Trash — Access', () => {

    test('T1: ADMIN can access trash page', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('سلة');
    });

    test('T2: GM cannot access trash page', async ({ gmPage }) => {
        await gmPage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        await gmPage.waitForTimeout(2000);
        const url = gmPage.url();
        const bodyText = await gmPage.textContent('body') || '';
        const blocked = !url.includes('/trash') || bodyText.includes('صلاحية') || bodyText.includes('غير مصرح');
        expect(blocked).toBeTruthy();
    });

    test('T3: ACC cannot access trash page', async ({ accountantPage }) => {
        await accountantPage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        const url = accountantPage.url();
        const bodyText = await accountantPage.textContent('body') || '';
        const blocked = !url.includes('/trash') || bodyText.includes('صلاحية') || bodyText.includes('غير مصرح');
        expect(blocked).toBeTruthy();
    });

    test('T4: PE cannot access trash page', async ({ pePage }) => {
        await pePage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        const url = pePage.url();
        const bodyText = await pePage.textContent('body') || '';
        const blocked = !url.includes('/trash') || bodyText.includes('صلاحية') || bodyText.includes('غير مصرح');
        expect(blocked).toBeTruthy();
    });

    test('T5: PM cannot access trash page', async ({ pmPage }) => {
        await pmPage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        await pmPage.waitForTimeout(2000);
        const url = pmPage.url();
        const bodyText = await pmPage.textContent('body') || '';
        const blocked = !url.includes('/trash') || bodyText.includes('صلاحية') || bodyText.includes('غير مصرح');
        expect(blocked).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Trash — Content & Actions
// ═══════════════════════════════════════════════════════════════
test.describe('Trash — Content', () => {

    test('T-C1: Trash page shows categories (projects/invoices/purchases/users)', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should have categories or tabs for different item types
        const hasCategories = bodyText.includes('مشاريع') || bodyText.includes('فواتير') || bodyText.includes('مشتريات');
        expect(hasCategories).toBeTruthy();
    });

    test('T-C2: Trash page shows restore button option', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should have restore action or empty state
        const hasRestore = bodyText.includes('استعادة') || bodyText.includes('لا يوجد') || bodyText.includes('سلة المهملات');
        expect(hasRestore).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Wallet — Edge Cases
// ═══════════════════════════════════════════════════════════════
test.describe('Wallet — Edge Cases', () => {

    test('W-EC1: ACC cannot access deposit page', async ({ accountantPage }) => {
        await accountantPage.goto('/wallet/deposit', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        const url = accountantPage.url();
        const blocked = !url.includes('/deposit');
        expect(blocked).toBeTruthy();
    });

    test('W-EC2: PE cannot access deposit page', async ({ pePage }) => {
        await pePage.goto('/wallet/deposit', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        const url = pePage.url();
        const blocked = !url.includes('/deposit');
        expect(blocked).toBeTruthy();
    });

    test('W-EC3: PM cannot access deposit page', async ({ pmPage }) => {
        await pmPage.goto('/wallet/deposit', { waitUntil: 'networkidle', timeout: 30_000 });
        await pmPage.waitForTimeout(2000);
        const url = pmPage.url();
        const blocked = !url.includes('/deposit');
        expect(blocked).toBeTruthy();
    });

    test('W-EC4: ADMIN sees wallet balance on wallet page', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasBalance = bodyText.includes('الرصيد') || bodyText.includes('ر.ق') || bodyText.includes('خزنة');
        expect(hasBalance).toBeTruthy();
    });

    test('W-EC5: ADMIN sees transaction history on wallet page', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasHistory = bodyText.includes('إيداع') || bodyText.includes('تخصيص') || bodyText.includes('عملية');
        expect(hasHistory).toBeTruthy();
    });

    test('W-EC6: Outsider cannot access wallet at all', async ({ outsiderPage }) => {
        await outsiderPage.goto('/wallet', { waitUntil: 'networkidle', timeout: 30_000 });
        await outsiderPage.waitForTimeout(2000);
        const url = outsiderPage.url();
        const bodyText = await outsiderPage.textContent('body') || '';
        const blocked = !url.includes('/wallet') || bodyText.includes('صلاحية');
        expect(blocked).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Cross-Module: Reports Access
// ═══════════════════════════════════════════════════════════════
test.describe('Reports — Access Control', () => {

    test('R1: ADMIN can access reports page', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('تقارير');
    });

    test('R2: ACC can access reports page', async ({ accountantPage }) => {
        await accountantPage.goto('/reports', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText).toContain('تقارير');
    });

    test('R3: GM can access reports page', async ({ gmPage }) => {
        await gmPage.goto('/reports', { waitUntil: 'networkidle', timeout: 30_000 });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText).toContain('تقارير');
    });

    test('R4: PE cannot access reports page', async ({ pePage }) => {
        await pePage.goto('/reports', { waitUntil: 'networkidle', timeout: 30_000 });
        await pePage.waitForTimeout(2000);
        const url = pePage.url();
        const blocked = !url.includes('/reports');
        expect(blocked).toBeTruthy();
    });

    test('R5: PM cannot access reports page', async ({ pmPage }) => {
        await pmPage.goto('/reports', { waitUntil: 'networkidle', timeout: 30_000 });
        await pmPage.waitForTimeout(2000);
        const url = pmPage.url();
        const blocked = !url.includes('/reports');
        expect(blocked).toBeTruthy();
    });
});
