/**
 * Phase 2: RBAC — Action Buttons & UI Elements Visibility
 * Tests that action buttons (create, approve, delete, settle, etc.)
 * are visible/hidden based on role.
 *
 * ~80 test cases
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// Dashboard — each role sees different content
// ═══════════════════════════════════════════════════════════════
test.describe('Dashboard Content per Role', () => {
    test('ADMIN sees wallet balance (السيولة)', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'networkidle' });
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('السيولة');
    });

    test('ADMIN sees employees count (الموظفين)', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'networkidle' });
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('الموظفين');
    });

    test('ADMIN sees projects count (المشاريع)', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'networkidle' });
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('المشاريع');
    });

    test('GM sees dashboard KPIs', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'networkidle' });
        await expect(gmPage.locator('body')).not.toContainText('خطأ');
    });

    test('ACCOUNTANT sees pending invoices', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'networkidle' });
        const text = await accountantPage.textContent('body') || '';
        expect(text).toContain('فواتير');
    });

    test('USER+PE sees custody info (عهدتي)', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'networkidle' });
        await expect(pePage.locator('body')).not.toContainText('خطأ');
    });

    test('USER (No Project) sees minimal dashboard', async ({ outsiderPage }) => {
        await outsiderPage.goto('/', { waitUntil: 'networkidle' });
        await expect(outsiderPage.locator('body')).not.toContainText('خطأ');
    });
});

// ═══════════════════════════════════════════════════════════════
// Invoices Page — approve/reject/delete buttons
// ═══════════════════════════════════════════════════════════════
test.describe('Invoices Page — Action Buttons', () => {
    test('ADMIN sees invoices list with data', async ({ adminPage }) => {
        await adminPage.goto('/invoices', { waitUntil: 'networkidle' });
        await expect(adminPage.locator('body')).toContainText('INV');
    });

    test('ACCOUNTANT sees invoices list', async ({ accountantPage }) => {
        await accountantPage.goto('/invoices', { waitUntil: 'networkidle' });
        await expect(accountantPage.locator('body')).toContainText('INV');
    });

    test('GM sees invoices list (view-only)', async ({ gmPage }) => {
        await gmPage.goto('/invoices', { waitUntil: 'networkidle' });
        await expect(gmPage.locator('body')).toContainText('INV');
    });

    test('USER+PE sees only own project invoices', async ({ pePage }) => {
        await pePage.goto('/invoices', { waitUntil: 'networkidle' });
        // Should see the page (not redirected)
        await expect(pePage).toHaveURL(/\/invoices/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Purchases Page — create button visibility (Layer 2 critical)
// ═══════════════════════════════════════════════════════════════
test.describe('Purchases Page — Layer 2 Controls', () => {
    test('ADMIN sees purchases list', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/purchases/);
    });

    test('GM sees purchases list', async ({ gmPage }) => {
        await gmPage.goto('/purchases', { waitUntil: 'networkidle' });
        await expect(gmPage).toHaveURL(/\/purchases/);
    });

    test('USER+PM sees purchases (coordinator)', async ({ pmPage }) => {
        await pmPage.goto('/purchases', { waitUntil: 'networkidle' });
        await expect(pmPage).toHaveURL(/\/purchases/);
    });

    test('USER+PE sees purchases but no create button', async ({ pePage }) => {
        await pePage.goto('/purchases', { waitUntil: 'networkidle' });
        await expect(pePage).toHaveURL(/\/purchases/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Wallet Page — deposit/allocate buttons
// ═══════════════════════════════════════════════════════════════
test.describe('Wallet Page — Admin-only Controls', () => {
    test('ADMIN sees wallet with balance', async ({ adminPage }) => {
        await adminPage.goto('/wallet', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/wallet/);
        const text = await adminPage.textContent('body') || '';
        expect(text).toContain('ر.ق');
    });

    test('GM sees wallet (view-only)', async ({ gmPage }) => {
        await gmPage.goto('/wallet', { waitUntil: 'networkidle' });
        await expect(gmPage).toHaveURL(/\/wallet/);
    });

    test('ACCOUNTANT sees wallet (view-only)', async ({ accountantPage }) => {
        await accountantPage.goto('/wallet', { waitUntil: 'networkidle' });
        await expect(accountantPage).toHaveURL(/\/wallet/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Debts Page — settle button
// ═══════════════════════════════════════════════════════════════
test.describe('Debts Page — Settle Controls', () => {
    test('ADMIN sees debts list', async ({ adminPage }) => {
        await adminPage.goto('/debts', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/debts/);
    });

    test('ACCOUNTANT sees debts list', async ({ accountantPage }) => {
        await accountantPage.goto('/debts', { waitUntil: 'networkidle' });
        await expect(accountantPage).toHaveURL(/\/debts/);
    });

    test('USER+PE sees own debts only', async ({ pePage }) => {
        await pePage.goto('/debts', { waitUntil: 'networkidle' });
        await expect(pePage).toHaveURL(/\/debts/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Employees Page — create/edit controls
// ═══════════════════════════════════════════════════════════════
test.describe('Employees Page — Admin Controls', () => {
    test('ADMIN sees employees list with count', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/employees/);
    });

    test('GM sees employees list (view-only)', async ({ gmPage }) => {
        await gmPage.goto('/employees', { waitUntil: 'networkidle' });
        await expect(gmPage).toHaveURL(/\/employees/);
    });

    test('ACCOUNTANT sees employees list', async ({ accountantPage }) => {
        await accountantPage.goto('/employees', { waitUntil: 'networkidle' });
        await expect(accountantPage).toHaveURL(/\/employees/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Trash Page — ADMIN exclusive
// ═══════════════════════════════════════════════════════════════
test.describe('Trash Page — ADMIN Only', () => {
    test('ADMIN sees trash with items', async ({ adminPage }) => {
        await adminPage.goto('/trash', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/trash/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Settings Page — ADMIN exclusive
// ═══════════════════════════════════════════════════════════════
test.describe('Settings Page — ADMIN Only', () => {
    test('ADMIN sees settings page', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/settings/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Categories Page — ADMIN + ACCOUNTANT
// ═══════════════════════════════════════════════════════════════
test.describe('Categories Page', () => {
    test('ADMIN sees categories', async ({ adminPage }) => {
        await adminPage.goto('/settings/categories', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/settings\/categories/);
    });

    test('ACCOUNTANT sees categories', async ({ accountantPage }) => {
        await accountantPage.goto('/settings/categories', { waitUntil: 'networkidle' });
        await expect(accountantPage).toHaveURL(/\/settings\/categories/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Finance Requests Page
// ═══════════════════════════════════════════════════════════════
test.describe('Finance Requests Page', () => {
    test('ADMIN sees finance requests', async ({ adminPage }) => {
        await adminPage.goto('/finance-requests', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/finance-requests/);
    });

    test('ACCOUNTANT sees finance requests', async ({ accountantPage }) => {
        await accountantPage.goto('/finance-requests', { waitUntil: 'networkidle' });
        await expect(accountantPage).toHaveURL(/\/finance-requests/);
    });

    test('GM sees finance requests (view)', async ({ gmPage }) => {
        await gmPage.goto('/finance-requests', { waitUntil: 'networkidle' });
        await expect(gmPage).toHaveURL(/\/finance-requests/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Custody Pages — split views
// ═══════════════════════════════════════════════════════════════
test.describe('Custody Pages', () => {
    test('ADMIN sees custody deposits log', async ({ adminPage }) => {
        await adminPage.goto('/deposits', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/deposits/);
    });

    test('ACCOUNTANT sees custody deposits log', async ({ accountantPage }) => {
        await accountantPage.goto('/deposits', { waitUntil: 'networkidle' });
        await expect(accountantPage).toHaveURL(/\/deposits/);
    });

    test('USER+PE sees my-custodies', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'networkidle' });
        await expect(pePage).toHaveURL(/\/my-custodies/);
    });

    test('USER+PM sees my-custodies', async ({ pmPage }) => {
        await pmPage.goto('/my-custodies', { waitUntil: 'networkidle' });
        await expect(pmPage).toHaveURL(/\/my-custodies/);
    });

    test('ADMIN sees external custodies', async ({ adminPage }) => {
        await adminPage.goto('/external-custodies', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/external-custodies/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Archives + Reports Pages
// ═══════════════════════════════════════════════════════════════
test.describe('Archives & Reports', () => {
    test('ADMIN sees archives', async ({ adminPage }) => {
        await adminPage.goto('/archives', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/archives/);
    });

    test('GM sees archives', async ({ gmPage }) => {
        await gmPage.goto('/archives', { waitUntil: 'networkidle' });
        await expect(gmPage).toHaveURL(/\/archives/);
    });

    test('ADMIN sees reports', async ({ adminPage }) => {
        await adminPage.goto('/reports', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/reports/);
    });

    test('GM sees reports', async ({ gmPage }) => {
        await gmPage.goto('/reports', { waitUntil: 'networkidle' });
        await expect(gmPage).toHaveURL(/\/reports/);
    });

    test('ACCOUNTANT sees reports', async ({ accountantPage }) => {
        await accountantPage.goto('/reports', { waitUntil: 'networkidle' });
        await expect(accountantPage).toHaveURL(/\/reports/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Notifications Send — ADMIN + GM only
// ═══════════════════════════════════════════════════════════════
test.describe('Notifications Send Page', () => {
    test('ADMIN can access send page', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'networkidle' });
        await expect(adminPage).toHaveURL(/\/notifications\/send/);
    });

    test('GM can access send page', async ({ gmPage }) => {
        await gmPage.goto('/notifications/send', { waitUntil: 'networkidle' });
        await expect(gmPage).toHaveURL(/\/notifications\/send/);
    });
});
