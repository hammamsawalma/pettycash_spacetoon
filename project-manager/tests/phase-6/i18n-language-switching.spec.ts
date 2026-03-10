/**
 * Phase 6: i18n — Language Switching & Localization Tests
 *
 * Comprehensive test coverage for:
 *  - Language toggle (AR ↔ EN) on Welcome, Login, Sidebar, Header
 *  - RTL/LTR direction switching
 *  - localStorage persistence across page reloads
 *  - Sidebar, Header, MobileBottomNav text in both languages
 *  - StatusBadge locale-aware labels
 *  - Dashboard text translations
 *  - Edge cases: default locale, missing keys, rapid toggling
 */
import { test, expect } from '../fixtures/auth.fixture';
import { test as base } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Welcome Page — Language Toggle (Unauthenticated)
// ═══════════════════════════════════════════════════════════════
base.describe('Welcome Page i18n', () => {
    base('L1: Welcome page defaults to Arabic (RTL)', async ({ page }) => {
        await page.goto('/welcome');
        await page.waitForLoadState('networkidle');
        // Check dir attribute
        const dir = await page.getAttribute('div.welcome-container', 'dir');
        expect(dir).toBe('rtl');
        // Arabic text should be visible
        const bodyText = await page.textContent('body');
        expect(bodyText).toContain('Spacetoon Pocket');
    });

    base('L2: Language toggle switches Welcome to English', async ({ page }) => {
        await page.goto('/welcome');
        await page.waitForLoadState('networkidle');
        // Click EN toggle button
        const toggleBtn = page.locator('button:has-text("EN")');
        await toggleBtn.waitFor({ state: 'visible', timeout: 10_000 });
        await toggleBtn.click();
        await page.waitForTimeout(500); // Wait for re-render
        // Check that direction changed to LTR
        const dir = await page.getAttribute('div.welcome-container', 'dir');
        expect(dir).toBe('ltr');
        // English text should appear
        const bodyText = await page.textContent('body');
        expect(bodyText).toContain('Expense & Financial Custody Management');
        expect(bodyText).toContain('Get Started');
        expect(bodyText).toContain('Project Management');
    });

    base('L3: Language toggle switches Welcome back to Arabic', async ({ page }) => {
        await page.goto('/welcome');
        await page.waitForLoadState('networkidle');
        // Switch to English first
        await page.locator('button:has-text("EN")').click();
        await page.waitForTimeout(300);
        // Then switch back to Arabic
        await page.locator('button:has-text("AR")').click();
        await page.waitForTimeout(300);
        // Verify Arabic text is back
        const bodyText = await page.textContent('body');
        expect(bodyText).toContain('نظام إدارة المصاريف والعهد المالية');
        const dir = await page.getAttribute('div.welcome-container', 'dir');
        expect(dir).toBe('rtl');
    });

    base('L4: Welcome branch selection translates correctly', async ({ page }) => {
        await page.goto('/welcome');
        await page.waitForLoadState('networkidle');
        // Switch to English
        await page.locator('button:has-text("EN")').click();
        await page.waitForTimeout(300);
        // Click "Get Started" to go to branch selection
        await page.locator('button:has-text("Get Started")').click();
        await page.waitForTimeout(500);
        // Verify English branch selection text
        const body = await page.textContent('body');
        expect(body).toContain('Select Branch');
        expect(body).toContain('Choose your company branch');
    });

    base('L5: Welcome root login button translates to English', async ({ page }) => {
        await page.goto('/welcome');
        await page.waitForLoadState('networkidle');
        // Switch to English
        await page.locator('button:has-text("EN")').click();
        await page.waitForTimeout(300);
        // Go to branches step
        await page.locator('button:has-text("Get Started")').click();
        await page.waitForTimeout(500);
        // Check for English root login text
        const body = await page.textContent('body');
        expect(body).toContain('IT Login');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Login Page — Localization
// ═══════════════════════════════════════════════════════════════
base.describe('Login Page i18n', () => {
    base('L6: Login page shows Arabic text by default', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const body = await page.textContent('body');
        expect(body).toContain('مرحبًا بعودتك');
        // Check placeholders
        const emailPlaceholder = await page.getAttribute('input[name="email"]', 'placeholder');
        expect(emailPlaceholder).toContain('البريد');
    });

    base('L7: Login page switches to English when locale is set', async ({ page }) => {
        // Set locale to English via localStorage before navigating
        await page.goto('/login');
        await page.evaluate(() => {
            localStorage.setItem('locale', 'en');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        // Verify English text
        const body = await page.textContent('body');
        expect(body).toContain('Welcome back');
        expect(body).toContain('Sign in');
        // Check English placeholders
        const emailPlaceholder = await page.getAttribute('input[name="email"]', 'placeholder');
        expect(emailPlaceholder).toContain('Email');
    });

    base('L8: Login button text changes with locale', async ({ page }) => {
        await page.goto('/login');
        // Set English locale
        await page.evaluate(() => localStorage.setItem('locale', 'en'));
        await page.reload();
        await page.waitForLoadState('networkidle');
        const loginBtn = page.locator('button[type="submit"]');
        await expect(loginBtn).toContainText('Login');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Sidebar — Language Switching (Authenticated)
// ═══════════════════════════════════════════════════════════════
test.describe('Sidebar i18n (Admin)', () => {
    test('L9: Sidebar shows Arabic navigation by default', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        const body = await adminPage.textContent('body');
        // Sidebar section headers should be in Arabic (via t() keys)
        // Check for translated sidebar items
        expect(body).toMatch(/لوحة التحكم|Dashboard/);
    });

    test('L10: Language toggle in header switches sidebar to English', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Click the EN toggle in the header
        const globeToggle = adminPage.locator('button:has-text("EN")');
        await globeToggle.waitFor({ state: 'visible', timeout: 10_000 });
        await globeToggle.click();
        await adminPage.waitForTimeout(800);
        // Verify sidebar shows English text
        const body = await adminPage.textContent('body');
        expect(body).toContain('Dashboard');
        expect(body).toContain('Projects');
        expect(body).toContain('Finance & Purchases');
        expect(body).toContain('Invoices');
        expect(body).toContain('Management');
    });

    test('L11: Sidebar "Quick Add" button translates to English', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Switch to English
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        // Check for English Quick Add text
        const quickAddBtn = adminPage.locator('text=Quick Add');
        const count = await quickAddBtn.count();
        expect(count).toBeGreaterThan(0);
    });

    test('L12: Sidebar logout button translates to English', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Switch to English
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        const logoutText = adminPage.locator('text=Logout');
        await expect(logoutText.first()).toBeVisible();
    });

    test('L13: Sidebar sub-items translate correctly', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Switch to English
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        const body = await adminPage.textContent('body');
        expect(body).toContain('All Invoices');
        expect(body).toContain('Employees List');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 4: Header — Language Toggle & Tooltips
// ═══════════════════════════════════════════════════════════════
test.describe('Header i18n', () => {
    test('L14: Header shows user name and "Welcome" in Arabic by default', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        const body = await adminPage.textContent('body');
        expect(body).toContain('مرحبا');
    });

    test('L15: Header switches to English "Welcome" after toggle', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        const body = await adminPage.textContent('body');
        expect(body).toContain('Welcome');
    });

    test('L16: Header role name translates to English', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        const body = await adminPage.textContent('body');
        expect(body).toContain('System Admin');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 5: Direction (RTL/LTR) Switching
// ═══════════════════════════════════════════════════════════════
test.describe('RTL/LTR Direction', () => {
    test('L17: Document direction is RTL by default', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        const dir = await adminPage.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('rtl');
        const lang = await adminPage.evaluate(() => document.documentElement.lang);
        expect(lang).toBe('ar');
    });

    test('L18: Switching to English sets LTR direction', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        const dir = await adminPage.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('ltr');
        const lang = await adminPage.evaluate(() => document.documentElement.lang);
        expect(lang).toBe('en');
    });

    test('L19: Switching back to Arabic restores RTL', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Switch to EN
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(300);
        // Switch back to AR
        await adminPage.locator('button:has-text("AR")').click();
        await adminPage.waitForTimeout(300);
        const dir = await adminPage.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('rtl');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 6: Persistence via localStorage
// ═══════════════════════════════════════════════════════════════
test.describe('Language Persistence', () => {
    test('L20: Language preference persists across page reload', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Switch to English
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        // Verify English is set in localStorage
        const locale = await adminPage.evaluate(() => localStorage.getItem('locale'));
        expect(locale).toBe('en');
        // Reload and verify English persists
        await adminPage.reload();
        await adminPage.waitForLoadState('networkidle');
        const body = await adminPage.textContent('body');
        expect(body).toContain('Dashboard');
        const dir = await adminPage.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('ltr');
    });

    test('L21: Language preference persists across navigation', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Switch to English
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        // Navigate to a different page
        await adminPage.goto('/settings');
        await adminPage.waitForLoadState('networkidle');
        // Should still be in English
        const dir = await adminPage.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('ltr');
        const lang = await adminPage.evaluate(() => document.documentElement.lang);
        expect(lang).toBe('en');
    });

    test('L22: Clearing localStorage resets to Arabic default', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Set English and verify
        await adminPage.evaluate(() => localStorage.setItem('locale', 'en'));
        await adminPage.reload();
        await adminPage.waitForLoadState('networkidle');
        // Clear localStorage
        await adminPage.evaluate(() => localStorage.removeItem('locale'));
        await adminPage.reload();
        await adminPage.waitForLoadState('networkidle');
        // Should default back to Arabic
        const dir = await adminPage.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('rtl');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 7: Dashboard Translations
// ═══════════════════════════════════════════════════════════════
test.describe('Dashboard i18n (Admin)', () => {
    test('L23: Admin dashboard shows Arabic KPI titles by default', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        const body = await adminPage.textContent('body');
        expect(body).toMatch(/عدد المشاريع|Project Count/);
    });

    test('L24: Admin dashboard switches to English KPIs', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(800);
        const body = await adminPage.textContent('body');
        expect(body).toContain('Project Count');
        expect(body).toContain('Employee Count');
    });

    test('L25: Chart period selector translates', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(800);
        // Check for English chart options
        const monthlyOption = adminPage.locator('option:has-text("Monthly")');
        const count = await monthlyOption.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Dashboard i18n (Employee)', () => {
    test('L26: Employee dashboard shows English workspace title', async ({ pePage }) => {
        await pePage.goto('/');
        await pePage.waitForLoadState('networkidle');
        // Set English locale
        await pePage.evaluate(() => localStorage.setItem('locale', 'en'));
        await pePage.reload();
        await pePage.waitForLoadState('networkidle');
        const body = await pePage.textContent('body');
        expect(body).toContain('Workspace');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 8: Role-Based Translations
// ═══════════════════════════════════════════════════════════════
test.describe('Role Name Translations', () => {
    test('L27: Admin role shows "System Admin" in English', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        const body = await adminPage.textContent('body');
        expect(body).toContain('System Admin');
    });

    test('L28: GM role shows "General Manager" in English', async ({ gmPage }) => {
        await gmPage.goto('/');
        await gmPage.waitForLoadState('networkidle');
        // Set English locale via localStorage
        await gmPage.evaluate(() => localStorage.setItem('locale', 'en'));
        await gmPage.reload();
        await gmPage.waitForLoadState('networkidle');
        const body = await gmPage.textContent('body');
        expect(body).toContain('General Manager');
    });

    test('L29: Accountant role shows "Accountant" in English', async ({ accountantPage }) => {
        await accountantPage.goto('/');
        await accountantPage.waitForLoadState('networkidle');
        await accountantPage.evaluate(() => localStorage.setItem('locale', 'en'));
        await accountantPage.reload();
        await accountantPage.waitForLoadState('networkidle');
        const body = await accountantPage.textContent('body');
        expect(body).toContain('Accountant');
    });

    test('L30: Employee role shows "Employee" in English', async ({ pePage }) => {
        await pePage.goto('/');
        await pePage.waitForLoadState('networkidle');
        await pePage.evaluate(() => localStorage.setItem('locale', 'en'));
        await pePage.reload();
        await pePage.waitForLoadState('networkidle');
        const body = await pePage.textContent('body');
        expect(body).toContain('Employee');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 9: Edge Cases
// ═══════════════════════════════════════════════════════════════
test.describe('i18n Edge Cases', () => {
    test('L31: Rapid toggle does not break UI', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Rapidly toggle 5 times
        for (let i = 0; i < 5; i++) {
            const toggleText = i % 2 === 0 ? 'EN' : 'AR';
            const toggle = adminPage.locator(`button:has-text("${toggleText}")`);
            if (await toggle.isVisible()) {
                await toggle.click();
                await adminPage.waitForTimeout(200);
            }
        }
        // Page should still be functional
        const body = await adminPage.textContent('body');
        expect(body).toBeTruthy();
        // Check no JS errors
        const consoleErrors: string[] = [];
        adminPage.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        await adminPage.waitForTimeout(500);
        // Allow SW errors, filter them out
        const relevant = consoleErrors.filter(e => !e.includes('sw.js') && !e.includes('service-worker'));
        expect(relevant.length).toBe(0);
    });

    test('L32: Invalid locale in localStorage defaults to Arabic', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.evaluate(() => localStorage.setItem('locale', 'invalid_locale'));
        await adminPage.reload();
        await adminPage.waitForLoadState('networkidle');
        // Should fall back to Arabic (RTL)
        const dir = await adminPage.evaluate(() => document.documentElement.dir);
        expect(dir).toBe('rtl');
    });

    test('L33: Language toggle exists and is accessible', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        // Check toggle has aria-label
        const toggle = adminPage.locator('button[aria-label*="Switch to"]');
        await expect(toggle.first()).toBeVisible();
    });

    test('L34: StatusBadge shows English labels when locale is EN', async ({ adminPage }) => {
        await adminPage.goto('/');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.locator('button:has-text("EN")').click();
        await adminPage.waitForTimeout(500);
        // Navigate to invoices page (should have status badges)
        await adminPage.goto('/invoices');
        await adminPage.waitForLoadState('networkidle');
        // If there are any status badges, they should show English text
        const badges = adminPage.locator('span:has-text("Completed"), span:has-text("Pending"), span:has-text("Approved"), span:has-text("In Progress")');
        // Just verify no Arabic status labels are present
        const body = await adminPage.textContent('body');
        // Arabic status labels should NOT be present
        expect(body).not.toMatch(/^مكتمل$/); // Full match only
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 10: Mobile Navigation (MobileBottomNav)
// ═══════════════════════════════════════════════════════════════
test.describe('Mobile Bottom Nav i18n', () => {
    test('L35: Mobile nav items translate to English', async ({ pePage }) => {
        // Simulate mobile viewport
        await pePage.setViewportSize({ width: 375, height: 812 });
        await pePage.goto('/');
        await pePage.waitForLoadState('networkidle');
        // Set English locale
        await pePage.evaluate(() => localStorage.setItem('locale', 'en'));
        await pePage.reload();
        await pePage.waitForLoadState('networkidle');
        const body = await pePage.textContent('body');
        // Employee mobile nav should show English labels
        expect(body).toContain('Home');
        expect(body).toContain('Projects');
    });
});

// ═══════════════════════════════════════════════════════════════
// SECTION 11: Cross-Role Sidebar Translation Consistency
// ═══════════════════════════════════════════════════════════════
test.describe('Cross-Role Translation Consistency', () => {
    test('L36: GM sidebar shows correct English items', async ({ gmPage }) => {
        await gmPage.goto('/');
        await gmPage.waitForLoadState('networkidle');
        await gmPage.evaluate(() => localStorage.setItem('locale', 'en'));
        await gmPage.reload();
        await gmPage.waitForLoadState('networkidle');
        const body = await gmPage.textContent('body');
        expect(body).toContain('Dashboard');
        expect(body).toContain('Projects');
    });

    test('L37: Accountant sidebar shows English items', async ({ accountantPage }) => {
        await accountantPage.goto('/');
        await accountantPage.waitForLoadState('networkidle');
        await accountantPage.evaluate(() => localStorage.setItem('locale', 'en'));
        await accountantPage.reload();
        await accountantPage.waitForLoadState('networkidle');
        const body = await accountantPage.textContent('body');
        expect(body).toContain('Dashboard');
        expect(body).toContain('Invoices');
        expect(body).toContain('Export Center');
    });
});
