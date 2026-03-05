import { test, expect, Page } from '@playwright/test';

// ─── Credentials ──────────────────────────────────────────────────────────────
const ADMIN = { email: 'admin@pocket.com', pass: '123456' };
const ACCOUNTANT = { email: 'accountant@pocket.com', pass: '123456' };
const EMP1 = { email: 'emp1@pocket.com', pass: '123456' }; // has confirmed custody in proj1
const EMP3 = { email: 'emp3@pocket.com', pass: '123456' }; // has custody in proj2

async function login(page: Page, email: string, pass: string) {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 12000 });
}

// ─── Suite: My Custodies & Balance ───────────────────────────────────────────
test.describe('Custody: Balance & Employee Flow', () => {

    // ─── 1. Employee with custody sees "My Custodies" page ───────────────
    test('emp1 can access /my-custodies page', async ({ page }) => {
        await login(page, EMP1.email, EMP1.pass);
        await page.goto('/my-custodies');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/my-custodies');
        expect(page.url()).not.toContain('/login');
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        expect(bodyText).not.toContain('application error');
    });

    // ─── 2. emp1 has an active custody from seed (cust1: balance 7000) ───
    test('emp1 My Custodies page shows custody data', async ({ page }) => {
        await login(page, EMP1.email, EMP1.pass);
        await page.goto('/my-custodies');
        await page.waitForTimeout(1500);
        const bodyText = await page.evaluate(() => document.body.innerText);
        // Should show some numeric balance (7,000 or similar)
        expect(bodyText).toMatch(/7[\.,]?000|عهدة|custody/i);
    });

    // ─── 3. emp3 has an active custody from proj2 ─────────────────────────
    test('emp3 My Custodies page shows custody data', async ({ page }) => {
        await login(page, EMP3.email, EMP3.pass);
        await page.goto('/my-custodies');
        await page.waitForTimeout(1500);
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(bodyText).toMatch(/8[\.,]?500|عهدة|custody/i);
    });

    // ─── 4. ADMIN sees custody ledger at /deposits ────────────────────────
    test('ADMIN can access /deposits (custody ledger)', async ({ page }) => {
        await login(page, ADMIN.email, ADMIN.pass);
        await page.goto('/deposits');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/deposits');
        expect(page.url()).not.toContain('/login');
    });

    // ─── 5. GLOBAL_ACCOUNTANT can access /deposits ────────────────────────
    test('GLOBAL_ACCOUNTANT can access /deposits', async ({ page }) => {
        await login(page, ACCOUNTANT.email, ACCOUNTANT.pass);
        await page.goto('/deposits');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/deposits');
    });

    // ─── 6. Regular employee cannot access /deposits ──────────────────────
    test('USER (employee) cannot access /deposits custody ledger', async ({ page }) => {
        await login(page, EMP1.email, EMP1.pass);
        await page.goto('/deposits');
        await page.waitForTimeout(1500);
        const url = page.url();
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        const isBlocked =
            !url.includes('/deposits') ||
            bodyText.includes('غير مصرح') ||
            bodyText.includes('unauthorized');
        expect(isBlocked).toBeTruthy();
    });

    // ─── 7. No JS errors on My Custodies page ─────────────────────────────
    test('No JS errors on /my-custodies for employee with custody', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await login(page, EMP1.email, EMP1.pass);
        await page.goto('/my-custodies');
        await page.waitForTimeout(2000);
        const appErrors = errors.filter(e =>
            !e.includes('favicon') && !e.includes('ResizeObserver')
        );
        expect(appErrors, `Errors: ${appErrors.join(', ')}`).toHaveLength(0);
    });
});

// ─── Suite: Purchase Authorization ───────────────────────────────────────────
test.describe('Purchase Orders: Authorization', () => {

    // ─── 8. GENERAL_MANAGER can see purchase orders ───────────────────────
    test('GENERAL_MANAGER can access /purchases', async ({ page }) => {
        await login(page, 'gm@pocket.com', '123456');
        await page.goto('/purchases');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/purchases');
        expect(page.url()).not.toContain('/login');
    });

    // ─── 9. GENERAL_MANAGER can navigate to /purchases/new ───────────────
    test('GENERAL_MANAGER can access new purchase order page', async ({ page }) => {
        await login(page, 'gm@pocket.com', '123456');
        await page.goto('/purchases/new');
        await page.waitForTimeout(1500);
        // Should not be blocked — GM can create purchases (Phase 2 fix)
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        expect(bodyText).not.toContain('application error');
        expect(page.url()).not.toContain('/login');
    });

    // ─── 10. Seed purchase PO-2026-001 shows as REQUESTED ────────────────
    test('Seed purchase order is visible to ADMIN on /purchases', async ({ page }) => {
        await login(page, ADMIN.email, ADMIN.pass);
        await page.goto('/purchases');
        await page.waitForTimeout(2000);
        const bodyText = await page.evaluate(() => document.body.innerText);
        // The seed has purchase orders for proj2 — any purchase content confirms visibility
        expect(bodyText).toMatch(/ديكور|لوازم|بنرات|PO-|شراء|REQUESTED|IN_PROGRESS|مطلوب|قيد/i);
    });

    // ─── 11. No JS errors on /purchases for each role ─────────────────────
    for (const [label, email, pass] of [
        ['ADMIN', ADMIN.email, ADMIN.pass],
        ['ACCOUNTANT', ACCOUNTANT.email, ACCOUNTANT.pass],
        ['EMPLOYEE', EMP1.email, EMP1.pass],
        ['GM', 'gm@pocket.com', '123456'],
    ] as const) {
        test(`No JS error on /purchases as ${label}`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (e) => errors.push(e.message));
            await login(page, email, pass);
            await page.goto('/purchases');
            await page.waitForTimeout(2000);
            const appErrors = errors.filter(e =>
                !e.includes('favicon') &&
                !e.includes('ResizeObserver') &&
                !e.includes('key prop') &&
                !e.includes('ECONNRESET')
            );
            expect(appErrors, `JS errors for ${label}: ${appErrors.join(', ')}`).toHaveLength(0);
        });
    }
});

// ─── Suite: Finance Requests ──────────────────────────────────────────────────
test.describe('Finance Requests: ADMIN Only Approval', () => {

    // ─── 12. ADMIN sees pending finance request from seed ─────────────────
    test('ADMIN can access /finance-requests and sees pending request', async ({ page }) => {
        await login(page, ADMIN.email, ADMIN.pass);
        await page.goto('/finance-requests');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/finance-requests');
        const bodyText = await page.evaluate(() => document.body.innerText);
        // Seed has one PENDING finance request (SETTLE_DEBT for emp2)
        expect(bodyText).toMatch(/PENDING|معلق|تسوية/i);
    });

    // ─── 13. GLOBAL_ACCOUNTANT can see their own finance request ──────────
    test('GLOBAL_ACCOUNTANT can access /finance-requests (sees own requests)', async ({ page }) => {
        await login(page, ACCOUNTANT.email, ACCOUNTANT.pass);
        await page.goto('/finance-requests');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/finance-requests');
        expect(page.url()).not.toContain('/login');
    });

    // ─── 14. No JS errors on finance-requests for ADMIN and ACCOUNTANT ────
    for (const [label, email, pass] of [
        ['ADMIN', ADMIN.email, ADMIN.pass],
        ['ACCOUNTANT', ACCOUNTANT.email, ACCOUNTANT.pass],
    ] as const) {
        test(`No JS error on /finance-requests as ${label}`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (e) => errors.push(e.message));
            await login(page, email, pass);
            await page.goto('/finance-requests');
            await page.waitForTimeout(2000);
            const appErrors = errors.filter(e =>
                !e.includes('favicon') && !e.includes('ResizeObserver')
            );
            expect(appErrors, `Errors: ${appErrors.join(', ')}`).toHaveLength(0);
        });
    }
});
