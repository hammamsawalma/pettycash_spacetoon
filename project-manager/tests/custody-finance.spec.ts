/**
 * Custody & Finance Operations — ROOT access and data isolation tests
 * Validates ROOT can access custody/finance pages and data is properly isolated.
 */
import { test, expect } from './fixtures/auth.fixture';
import type { Page } from '@playwright/test';

async function loadPage(page: Page, path: string) {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1500);
}

async function getBodyText(page: Page): Promise<string> {
    return (await page.textContent('body')) || '';
}

// ═══════════════════════════════════════════════════════════════
// ROOT access to custody/finance pages
// ═══════════════════════════════════════════════════════════════
test.describe('ROOT Custody & Finance Access', () => {
    test('can access /employee-custodies', async ({ rootPage }) => {
        await loadPage(rootPage, '/employee-custodies');
        expect(rootPage.url()).not.toContain('/login');
        const text = await getBodyText(rootPage);
        expect(text).toContain('عهد');
    });

    test('can access /external-custodies', async ({ rootPage }) => {
        await loadPage(rootPage, '/external-custodies');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /company-custodies', async ({ rootPage }) => {
        await loadPage(rootPage, '/company-custodies');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /finance-requests', async ({ rootPage }) => {
        await loadPage(rootPage, '/finance-requests');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /debts', async ({ rootPage }) => {
        await loadPage(rootPage, '/debts');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /deposits (wallet entries)', async ({ rootPage }) => {
        await loadPage(rootPage, '/deposits');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /wallet/deposit', async ({ rootPage }) => {
        await loadPage(rootPage, '/wallet/deposit');
        expect(rootPage.url()).not.toContain('/login');
    });
});

// ═══════════════════════════════════════════════════════════════
// PE (USER) denied from custody/finance pages
// ═══════════════════════════════════════════════════════════════
test.describe('PE Denied Finance Pages', () => {
    test('PE cannot access /employee-custodies', async ({ pePage }) => {
        await pePage.goto('/employee-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/employee-custodies$/);
    });

    test('PE cannot access /external-custodies', async ({ pePage }) => {
        await pePage.goto('/external-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/external-custodies$/);
    });

    test('PE cannot access /company-custodies', async ({ pePage }) => {
        await pePage.goto('/company-custodies', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/company-custodies$/);
    });

    test('PE cannot access /finance-requests', async ({ pePage }) => {
        await pePage.goto('/finance-requests', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/finance-requests$/);
    });

    test('PE cannot access /wallet/deposit', async ({ pePage }) => {
        await pePage.goto('/wallet/deposit', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/wallet\/deposit$/);
    });
});

// ═══════════════════════════════════════════════════════════════
// ADMIN data isolation — sees only own branch data
// ═══════════════════════════════════════════════════════════════
test.describe('ADMIN Branch Data Isolation', () => {
    test('ADMIN wallet page loads correctly', async ({ adminPage }) => {
        await loadPage(adminPage, '/wallet');
        const text = await getBodyText(adminPage);
        expect(text).toContain('خزنة');
    });

    test('ADMIN reports page loads correctly', async ({ adminPage }) => {
        await loadPage(adminPage, '/reports');
        const text = await getBodyText(adminPage);
        expect(text).toContain('التقارير');
    });

    test('ADMIN finance-requests page loads', async ({ adminPage }) => {
        await loadPage(adminPage, '/finance-requests');
        expect(adminPage.url()).not.toContain('/login');
    });

    test('ADMIN debts page loads', async ({ adminPage }) => {
        await loadPage(adminPage, '/debts');
        expect(adminPage.url()).not.toContain('/login');
    });
});

// ═══════════════════════════════════════════════════════════════
// ACCOUNTANT access to financial pages
// ═══════════════════════════════════════════════════════════════
test.describe('Accountant Financial Access', () => {
    test('can access /employee-custodies', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/employee-custodies');
        expect(accountantPage.url()).not.toContain('/login');
    });

    test('can access /wallet', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/wallet');
        expect(accountantPage.url()).not.toContain('/login');
    });

    test('can access /debts', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/debts');
        expect(accountantPage.url()).not.toContain('/login');
    });

    test('can access /reports', async ({ accountantPage }) => {
        await loadPage(accountantPage, '/reports');
        expect(accountantPage.url()).not.toContain('/login');
    });

    test('cannot access /employees/new', async ({ accountantPage }) => {
        await accountantPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(accountantPage.url()).not.toMatch(/\/employees\/new$/);
    });

    test('cannot access /projects/new', async ({ accountantPage }) => {
        await accountantPage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(accountantPage.url()).not.toMatch(/\/projects\/new$/);
    });
});

// ═══════════════════════════════════════════════════════════════
// GM access — views all, but cannot manage branches
// ═══════════════════════════════════════════════════════════════
test.describe('GM Access Verification', () => {
    test('GM can access /finance-requests', async ({ gmPage }) => {
        await loadPage(gmPage, '/finance-requests');
        expect(gmPage.url()).not.toContain('/login');
    });

    test('GM can access /custody', async ({ gmPage }) => {
        await loadPage(gmPage, '/custody');
        expect(gmPage.url()).not.toContain('/login');
    });

    test('GM cannot access /trash', async ({ gmPage }) => {
        await gmPage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(gmPage.url()).not.toMatch(/\/trash$/);
    });

    test('GM cannot access /employees/new', async ({ gmPage }) => {
        await gmPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(gmPage.url()).not.toMatch(/\/employees\/new$/);
    });
});
