/**
 * Phase 2: RBAC — Direct Page Access (URL Guard Tests)
 * Tests that each role can/cannot access each route via proxy.ts guards.
 *
 * IMPORTANT: The proxy checks system-level role (from JWT).
 * USER role can access: invoices, purchases, debts, projects, my-custodies, chat
 * USER role CANNOT: wallet, finance-requests, reports, settings, trash, archives,
 *                    employees, deposits, external-custodies, notifications/send
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Navigate and check if user stays on the page or gets redirected
async function canAccessPage(page: Page, path: string): Promise<boolean> {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
    const finalUrl = new URL(page.url());
    return finalUrl.pathname === path || finalUrl.pathname.startsWith(path);
}

async function isDenied(page: Page, path: string): Promise<boolean> {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 30_000 });
    // Wait a bit for any client-side redirects (useEffect)
    await page.waitForTimeout(2000);
    const finalUrl = new URL(page.url());
    // Denied = redirected away from the requested path
    // Could be proxy redirect to '/' or page-level redirect to sibling (e.g. /purchases)
    return finalUrl.pathname !== path && !finalUrl.pathname.startsWith(path + '/');
}

// ═══════════════════════════════════════════════════════════════
// ADMIN — Full access to all pages
// ═══════════════════════════════════════════════════════════════
test.describe('ADMIN Page Access', () => {
    const pages = [
        '/', '/projects', '/projects/new', '/employees', '/employees/new',
        '/invoices', '/invoices/new', '/purchases', '/purchases/new',
        '/wallet', '/wallet/deposit', '/debts', '/finance-requests',
        '/reports', '/settings', '/settings/categories', '/trash',
        '/archives', '/notifications/send',
        '/deposits', '/external-custodies', '/chat', '/support',
    ];
    for (const path of pages) {
        test(`can access ${path}`, async ({ adminPage }) => {
            expect(await canAccessPage(adminPage, path)).toBeTruthy();
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// GENERAL_MANAGER
// ═══════════════════════════════════════════════════════════════
test.describe('GM Page Access — Allowed', () => {
    const allowed = [
        '/', '/projects', '/invoices', '/invoices/new', '/purchases', '/purchases/new',
        '/debts', '/wallet', '/finance-requests', '/reports',
        '/archives', '/deposits', '/external-custodies',
        '/employees', '/notifications/send', '/chat', '/support',
    ];
    for (const path of allowed) {
        test(`can access ${path}`, async ({ gmPage }) => {
            expect(await canAccessPage(gmPage, path)).toBeTruthy();
        });
    }
});

test.describe('GM Page Access — Denied', () => {
    // Note: GM IS allowed /invoices/new and /wallet/deposit at proxy level
    // (pages render but may have limited actions)
    const denied = [
        '/projects/new', '/employees/new',
        '/wallet/deposit',  // page-level redirect: ADMIN-only
        '/settings', '/settings/categories', '/trash',
    ];
    for (const path of denied) {
        test(`denied ${path}`, async ({ gmPage }) => {
            expect(await isDenied(gmPage, path)).toBeTruthy();
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// GLOBAL_ACCOUNTANT
// ═══════════════════════════════════════════════════════════════
test.describe('ACCOUNTANT Page Access — Allowed', () => {
    const allowed = [
        '/', '/projects', '/invoices', '/invoices/new',
        '/purchases', '/debts', '/wallet', '/finance-requests',
        '/reports', '/archives', '/deposits', '/external-custodies',
        '/settings/categories', '/employees', '/chat', '/support',
    ];
    for (const path of allowed) {
        test(`can access ${path}`, async ({ accountantPage }) => {
            expect(await canAccessPage(accountantPage, path)).toBeTruthy();
        });
    }
});

test.describe('ACCOUNTANT Page Access — Denied', () => {
    // Note: /purchases/new proxy rule does NOT include GLOBAL_ACCOUNTANT
    const denied = [
        '/projects/new', '/employees/new', '/purchases/new',
        '/settings', '/trash', '/notifications/send',
    ];
    for (const path of denied) {
        test(`denied ${path}`, async ({ accountantPage }) => {
            expect(await isDenied(accountantPage, path)).toBeTruthy();
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// USER+PE (PROJECT_EMPLOYEE only)
// Proxy allows USER for: invoices, purchases, debts, projects
// ═══════════════════════════════════════════════════════════════
test.describe('USER+PE Page Access — Allowed', () => {
    const allowed = [
        '/', '/projects', '/invoices', '/invoices/new',
        '/purchases', '/debts',
        '/my-custodies', '/chat', '/support',
    ];
    for (const path of allowed) {
        test(`can access ${path}`, async ({ pePage }) => {
            expect(await canAccessPage(pePage, path)).toBeTruthy();
        });
    }
});

test.describe('USER+PE Page Access — Denied', () => {
    const denied = [
        '/projects/new', '/employees', '/employees/new',
        '/purchases/new',  // page-level redirect: PE not coordinator
        '/wallet', '/wallet/deposit',
        '/finance-requests', '/reports', '/settings', '/settings/categories',
        '/trash', '/archives', '/notifications/send',
        '/deposits', '/external-custodies',
    ];
    for (const path of denied) {
        test(`denied ${path}`, async ({ pePage }) => {
            expect(await isDenied(pePage, path)).toBeTruthy();
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// USER+PM (PROJECT_MANAGER only)
// ═══════════════════════════════════════════════════════════════
test.describe('USER+PM Page Access — Allowed', () => {
    const allowed = [
        '/', '/projects', '/invoices', '/invoices/new',
        '/purchases', '/purchases/new',
        '/debts', '/my-custodies', '/chat', '/support',
    ];
    for (const path of allowed) {
        test(`can access ${path}`, async ({ pmPage }) => {
            expect(await canAccessPage(pmPage, path)).toBeTruthy();
        });
    }
});

test.describe('USER+PM Page Access — Denied', () => {
    const denied = [
        '/projects/new', '/employees', '/employees/new',
        '/wallet', '/wallet/deposit', '/finance-requests',
        '/reports', '/settings', '/settings/categories',
        '/trash', '/archives', '/notifications/send',
        '/deposits', '/external-custodies',
    ];
    for (const path of denied) {
        test(`denied ${path}`, async ({ pmPage }) => {
            expect(await isDenied(pmPage, path)).toBeTruthy();
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// USER+PE+PM (Both roles)
// ═══════════════════════════════════════════════════════════════
test.describe('USER+PE+PM Page Access — Allowed', () => {
    const allowed = [
        '/', '/projects', '/invoices', '/invoices/new',
        '/purchases', '/purchases/new', '/debts',
        '/my-custodies', '/chat', '/support',
    ];
    for (const path of allowed) {
        test(`can access ${path}`, async ({ pepmPage }) => {
            expect(await canAccessPage(pepmPage, path)).toBeTruthy();
        });
    }
});

test.describe('USER+PE+PM Page Access — Denied', () => {
    const denied = [
        '/projects/new', '/employees', '/employees/new',
        '/wallet', '/wallet/deposit', '/finance-requests',
        '/reports', '/settings', '/settings/categories',
        '/trash', '/archives', '/notifications/send',
        '/deposits', '/external-custodies',
    ];
    for (const path of denied) {
        test(`denied ${path}`, async ({ pepmPage }) => {
            expect(await isDenied(pepmPage, path)).toBeTruthy();
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// USER (No Project / Outsider)
// Same system-level USER role → proxy allows same pages as PE/PM
// ═══════════════════════════════════════════════════════════════
test.describe('USER (No Project) Page Access — Allowed', () => {
    // Outsider IS a USER — proxy allows USER for invoices, purchases, debts
    const allowed = [
        '/', '/projects', '/invoices', '/invoices/new',
        '/purchases', '/debts',
        '/my-custodies', '/chat', '/support',
    ];
    for (const path of allowed) {
        test(`can access ${path}`, async ({ outsiderPage }) => {
            expect(await canAccessPage(outsiderPage, path)).toBeTruthy();
        });
    }
});

test.describe('USER (No Project) Page Access — Denied', () => {
    const denied = [
        '/projects/new', '/employees', '/employees/new',
        '/purchases/new',  // page-level redirect: not coordinator
        '/wallet', '/wallet/deposit', '/finance-requests',
        '/reports', '/settings', '/settings/categories',
        '/trash', '/archives', '/notifications/send',
        '/deposits', '/external-custodies',
    ];
    for (const path of denied) {
        test(`denied ${path}`, async ({ outsiderPage }) => {
            expect(await isDenied(outsiderPage, path)).toBeTruthy();
        });
    }
});
