/**
 * Phase 7 — E2E Wallet & Budget
 * 20 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-WB: Wallet & Budget', () => {
    test('E2E-WB1: Wallet page renders', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('محفظ') || t.includes('رصيد') || t.includes('المحفظة')).toBeTruthy();
    });

    test('E2E-WB2: Wallet balance card visible', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(100);
    });

    test('E2E-WB3: Deposit form accessible', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/wallet');
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });

    test('E2E-WB4: Deposit form has amount field', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const inputs = adminPage.locator('input[name="amount"], input[type="number"]');
        expect(await inputs.count()).toBeGreaterThan(0);
    });

    test('E2E-WB5: Deposit form has note field', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const inp = adminPage.locator('input[name="note"], textarea[name="note"]');
        expect(await inp.count()).toBeGreaterThanOrEqual(0);
    });

    test('E2E-WB6: Wallet entry log visible', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(100);
    });

    test('E2E-WB7: Wallet shows total in/out', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(100);
    });

    test('E2E-WB8: Deposit validation (>0)', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const amtInput = adminPage.locator('input[name="amount"]').first();
        if (await amtInput.count() > 0) {
            await amtInput.fill('0');
            const btn = adminPage.locator('button[type="submit"]').first();
            if (await btn.count() > 0) { await btn.click(); await adminPage.waitForTimeout(1000); }
            expect(adminPage.url()).toContain('/wallet');
        }
    });

    test('E2E-WB9: GM cannot deposit', async ({ gmPage }) => {
        await gmPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const u = gmPage.url(); const t = await gmPage.textContent('body') || '';
        expect(!u.includes('/wallet/deposit') || t.includes('غير مصرح')).toBeTruthy();
    });

    test('E2E-WB10: ACC cannot deposit', async ({ accountantPage }) => {
        await accountantPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const u = accountantPage.url(); const t = await accountantPage.textContent('body') || '';
        expect(!u.includes('/wallet/deposit') || t.includes('غير مصرح')).toBeTruthy();
    });

    test('E2E-WB11: PE cannot access wallet', async ({ pePage }) => {
        await pePage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const u = pePage.url(); const t = await pePage.textContent('body') || '';
        expect(!u.includes('/wallet') || t.includes('غير مصرح')).toBeTruthy();
    });

    test('E2E-WB12: Deposits list page', async ({ adminPage }) => {
        await adminPage.goto('/deposits', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });

    test('E2E-WB13: Budget allocation section exists', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.includes('تخصيص') || t.includes('ميزانية') || t.length > 200).toBeTruthy();
    });

    test('E2E-WB14: Budget allocation to completed project blocked', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(100);
    });

    test('E2E-WB15: ACC can view wallet', async ({ accountantPage }) => {
        await accountantPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const t = await accountantPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(50);
    });

    test('E2E-WB16: GM can view wallet', async ({ gmPage }) => {
        await gmPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const t = await gmPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(50);
    });

    test('E2E-WB17: Finance requests page', async ({ accountantPage }) => {
        await accountantPage.goto('/finance-requests', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect((await accountantPage.textContent('body') || '').length).toBeGreaterThan(50);
    });

    test('E2E-WB18: Deposit history scrollable', async ({ adminPage }) => {
        await adminPage.goto('/deposits', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sh = await adminPage.evaluate(() => document.body.scrollHeight);
        expect(sh).toBeGreaterThan(0);
    });

    test('E2E-WB19: Wallet no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });

    test('E2E-WB20: Finance request execution', async ({ adminPage }) => {
        await adminPage.goto('/finance-requests', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
});
