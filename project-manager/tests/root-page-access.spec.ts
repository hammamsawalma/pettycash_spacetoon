/**
 * ROOT Page Access — Comprehensive test that ROOT can reach every page
 * This validates both proxy.ts route protection AND server-side rendering
 * for all pages that ROOT should have access to.
 */
import { test, expect } from './fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: navigate and wait for full render
async function loadPage(page: Page, path: string) {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1000);
}

// Helper: get body text
async function getBodyText(page: Page): Promise<string> {
    return (await page.textContent('body')) || '';
}

// ═══════════════════════════════════════════════════════════════
// ROOT can access ALL management pages
// ═══════════════════════════════════════════════════════════════
test.describe('ROOT Page Access', () => {
    test('can access / (dashboard)', async ({ rootPage }) => {
        await loadPage(rootPage, '/');
        const text = await getBodyText(rootPage);
        // Should see RootDashboard, not login
        expect(text).toContain('ROOT ACCESS');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /projects', async ({ rootPage }) => {
        await loadPage(rootPage, '/projects');
        const text = await getBodyText(rootPage);
        expect(text).toContain('المشاريع');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /employees', async ({ rootPage }) => {
        await loadPage(rootPage, '/employees');
        const text = await getBodyText(rootPage);
        expect(text).toContain('الموظفين');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /wallet', async ({ rootPage }) => {
        await loadPage(rootPage, '/wallet');
        const text = await getBodyText(rootPage);
        expect(text).toContain('خزنة');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /invoices', async ({ rootPage }) => {
        await loadPage(rootPage, '/invoices');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /purchases', async ({ rootPage }) => {
        await loadPage(rootPage, '/purchases');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /reports', async ({ rootPage }) => {
        await loadPage(rootPage, '/reports');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /archives', async ({ rootPage }) => {
        await loadPage(rootPage, '/archives');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /trash', async ({ rootPage }) => {
        await loadPage(rootPage, '/trash');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /debts', async ({ rootPage }) => {
        await loadPage(rootPage, '/debts');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /settings', async ({ rootPage }) => {
        await loadPage(rootPage, '/settings');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /settings/categories', async ({ rootPage }) => {
        await loadPage(rootPage, '/settings/categories');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /notifications/send', async ({ rootPage }) => {
        await loadPage(rootPage, '/notifications/send');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /branches', async ({ rootPage }) => {
        await loadPage(rootPage, '/branches');
        const text = await getBodyText(rootPage);
        expect(text).toContain('إدارة الفروع');
    });

    test('can access /custody', async ({ rootPage }) => {
        await loadPage(rootPage, '/custody');
        expect(rootPage.url()).not.toContain('/login');
    });

    test('can access /employees/new', async ({ rootPage }) => {
        await loadPage(rootPage, '/employees/new');
        expect(rootPage.url()).not.toContain('/login');
        const text = await getBodyText(rootPage);
        // Page should show employee creation form
        expect(text).toContain('موظف');
    });

    test('can access /projects/new', async ({ rootPage }) => {
        await loadPage(rootPage, '/projects/new');
        expect(rootPage.url()).not.toContain('/login');
    });
});

// ═══════════════════════════════════════════════════════════════
// ADMIN cannot access ROOT-only pages
// ═══════════════════════════════════════════════════════════════
test.describe('ADMIN Denied ROOT Pages', () => {
    test('ADMIN cannot access /branches', async ({ adminPage }) => {
        await adminPage.goto('/branches', { waitUntil: 'networkidle', timeout: 30_000 });
        // Should be redirected or denied
        const url = adminPage.url();
        expect(url).not.toMatch(/\/branches$/);
    });

    test('GM cannot access /branches', async ({ gmPage }) => {
        await gmPage.goto('/branches', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = gmPage.url();
        expect(url).not.toMatch(/\/branches$/);
    });
});

// ═══════════════════════════════════════════════════════════════
// USER cannot access admin pages (regression)
// ═══════════════════════════════════════════════════════════════
test.describe('USER Denied Admin Pages', () => {
    test('PE cannot access /wallet', async ({ pePage }) => {
        await pePage.goto('/wallet', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/wallet$/);
    });

    test('PE cannot access /trash', async ({ pePage }) => {
        await pePage.goto('/trash', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/trash$/);
    });

    test('PE cannot access /employees/new', async ({ pePage }) => {
        await pePage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/employees\/new$/);
    });

    test('PE cannot access /projects/new', async ({ pePage }) => {
        await pePage.goto('/projects/new', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/projects\/new$/);
    });

    test('PE cannot access /branches', async ({ pePage }) => {
        await pePage.goto('/branches', { waitUntil: 'networkidle', timeout: 30_000 });
        expect(pePage.url()).not.toMatch(/\/branches$/);
    });
});
