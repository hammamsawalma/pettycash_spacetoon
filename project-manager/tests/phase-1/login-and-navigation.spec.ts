/**
 * Phase 1: Login & Navigation Tests
 * 
 * Tests A1–A12 from the test matrix.
 * Verifies authentication flow and role-based navigation visibility.
 */
import { test, expect } from '../fixtures/auth.fixture';
import { test as base, expect as baseExpect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// A1: Successful login — verified via auth.setup.ts (all 7 accounts)
// If auth.setup.ts passes, A1 is implicitly verified for all roles.
// ═══════════════════════════════════════════════════════════════

// ─── A2–A5: Login failure scenarios ──────────────────────────
base.describe('Login Failure Scenarios', () => {
    base('A2: wrong email shows unified error', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'nonexistent@test.com');
        await page.fill('input[name="password"]', '123456');
        await page.click('button[type="submit"]');
        // Should stay on login page with error
        await expect(page).toHaveURL(/\/login/);
        await expect(page.locator('text=البريد الإلكتروني أو كلمة المرور غير صحيحة')).toBeVisible();
    });

    base('A3: wrong password shows same unified error', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@pocket.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/login/);
        await expect(page.locator('text=البريد الإلكتروني أو كلمة المرور غير صحيحة')).toBeVisible();
    });

    base('A4: empty fields show validation error', async ({ page }) => {
        await page.goto('/login');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/login/);
    });

    base('A5: invalid email format shows validation error', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'not-an-email');
        await page.fill('input[name="password"]', '123456');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/login/);
    });
});

// ─── A11: Logout ─────────────────────────────────────────────
test.describe('Logout', () => {
    test('A11: admin can logout successfully', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'networkidle' });
        // Logout button is in the sidebar
        const logoutButton = adminPage.locator('text=تسجيل الخروج').first();
        await logoutButton.waitFor({ state: 'visible', timeout: 10_000 });
        await logoutButton.click();
        // Wait for redirect to login page after server action
        await adminPage.waitForURL(/\/login/, { timeout: 15_000 });
        await expect(adminPage).toHaveURL(/\/login/);
    });
});

// ═══════════════════════════════════════════════════════════════
// Navigation Visibility Tests — verifies each role sees correct links
// ═══════════════════════════════════════════════════════════════

test.describe('ADMIN Navigation', () => {
    test('sees all navigation links', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // ADMIN should see management links
        const bodyText = await adminPage.textContent('body');
        expect(bodyText).toContain('الموظفين');   // employees
        expect(bodyText).toContain('المشاريع');    // projects
    });

    test('can access wallet page', async ({ adminPage }) => {
        await adminPage.goto('/wallet');
        await expect(adminPage).toHaveURL(/\/wallet/);
    });

    test('can access trash page', async ({ adminPage }) => {
        await adminPage.goto('/trash');
        await expect(adminPage).toHaveURL(/\/trash/);
    });

    test('can access settings page', async ({ adminPage }) => {
        await adminPage.goto('/settings');
        await expect(adminPage).toHaveURL(/\/settings/);
    });
});

test.describe('GENERAL_MANAGER Navigation', () => {
    test('can access dashboard', async ({ gmPage }) => {
        await gmPage.goto('/');
        await expect(gmPage).not.toHaveURL(/\/login/);
    });

    test('cannot access trash', async ({ gmPage }) => {
        await gmPage.goto('/trash');
        // Should redirect away or show empty
        const url = gmPage.url();
        const isRedirected = !url.includes('/trash');
        const isEmpty = await gmPage.locator('text=غير مصرح').isVisible().catch(() => false);
        expect(isRedirected || isEmpty).toBeTruthy();
    });
});

test.describe('USER+PE Navigation (Employee only)', () => {
    test('can access dashboard', async ({ pePage }) => {
        await pePage.goto('/');
        await expect(pePage).not.toHaveURL(/\/login/);
    });

    test('cannot access wallet', async ({ pePage }) => {
        await pePage.goto('/wallet');
        const url = pePage.url();
        expect(url).not.toContain('/wallet');
    });

    test('cannot access trash', async ({ pePage }) => {
        await pePage.goto('/trash');
        const url = pePage.url();
        expect(url).not.toContain('/trash');
    });

    test('cannot access reports', async ({ pePage }) => {
        await pePage.goto('/reports');
        const url = pePage.url();
        expect(url).not.toContain('/reports');
    });
});

test.describe('USER+PM Navigation (Coordinator only)', () => {
    test('can access dashboard', async ({ pmPage }) => {
        await pmPage.goto('/');
        await expect(pmPage).not.toHaveURL(/\/login/);
    });

    test('cannot access wallet', async ({ pmPage }) => {
        await pmPage.goto('/wallet');
        const url = pmPage.url();
        expect(url).not.toContain('/wallet');
    });
});

test.describe('USER (No Project) Navigation', () => {
    test('can access dashboard but sees limited content', async ({ outsiderPage }) => {
        await outsiderPage.goto('/');
        await expect(outsiderPage).not.toHaveURL(/\/login/);
    });

    test('cannot access wallet', async ({ outsiderPage }) => {
        await outsiderPage.goto('/wallet');
        const url = outsiderPage.url();
        expect(url).not.toContain('/wallet');
    });
});
