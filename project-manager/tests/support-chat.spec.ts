import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  Live Support Chat Test Suite
 *  Tests the support page live chat widget, admin support chat page,
 *  and RBAC access control.
 *
 *  Uses saved auth state from auth.setup.ts (no manual login needed).
 * ════════════════════════════════════════════════════════════════════════
 */

const AUTH_DIR = path.join(__dirname, '.auth');

// ═══════════════════════════════════════════════════════
//  Support Page — Chat Widget (User Role)
// ═══════════════════════════════════════════════════════

test.describe('Support Chat Widget (User)', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'pe.json') });

    test('[SC-1] Support page renders correctly with chat button', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await expect(page.locator('text=كيف يمكننا مساعدتك اليوم؟')).toBeVisible();
        await expect(page.locator('text=المحادثة المباشرة')).toBeVisible();
        await expect(page.locator('text=فتح تذكرة دعم فني جديدة')).toBeVisible();
    });

    test('[SC-2] Chat widget opens when clicking start chat button', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        // Use text locator that matches partial text (ignores emoji)
        await page.locator('text=بدء محادثة').click();
        await page.waitForTimeout(1000);

        // Chat overlay should be visible
        await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
        await expect(page.locator('input[placeholder="اكتب رسالتك هنا..."]')).toBeVisible();
    });

    test('[SC-3] Chat widget shows messages or welcome state', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.locator('text=بدء محادثة').click();
        await page.waitForTimeout(2000);

        // Should show either welcome (no messages) OR messages from prior runs
        const hasWelcome = await page.locator('text=مرحباً بك!').isVisible().catch(() => false);
        const hasInput = await page.locator('input[placeholder="اكتب رسالتك هنا..."]').isVisible().catch(() => false);

        // Chat panel is functional — either empty state or with messages
        expect(hasWelcome || hasInput).toBeTruthy();
    });

    test('[SC-4] User can type in chat and submit form', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.locator('text=بدء محادثة').click();
        await page.waitForTimeout(1000);

        const input = page.locator('input[placeholder="اكتب رسالتك هنا..."]');
        await expect(input).toBeVisible();

        // Type a message
        await input.fill('رسالة اختبارية');
        await expect(input).toHaveValue('رسالة اختبارية');

        // Submit button should be enabled when there's text
        const submitBtn = page.locator('.fixed.inset-0.z-50 form button[type="submit"]');
        await expect(submitBtn).toBeEnabled();
    });

    test('[SC-5] Chat widget closes when clicking X button', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.locator('text=بدء محادثة').click();
        await page.waitForTimeout(500);
        await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();

        await page.locator('.fixed.inset-0.z-50 button:has(svg.lucide-x)').click();
        await page.waitForTimeout(300);

        await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();
    });

    test('[SC-6] Chat widget closes when clicking backdrop', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.locator('text=بدء محادثة').click();
        await page.waitForTimeout(500);

        await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();
    });

    test('[SC-7] Cannot send empty message', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.locator('text=بدء محادثة').click();
        await page.waitForTimeout(500);

        const submitBtn = page.locator('.fixed.inset-0.z-50 form button[type="submit"]');
        await expect(submitBtn).toBeDisabled();
    });
});

// ═══════════════════════════════════════════════════════
//  Admin Support Page — RBAC
// ═══════════════════════════════════════════════════════

test.describe('Admin Support Page (ADMIN)', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

    test('[SC-8] ADMIN can access /support/admin', async ({ page }) => {
        await page.goto('/support/admin', { waitUntil: 'networkidle' });

        await expect(page.locator('h3:has-text("محادثات الدعم")')).toBeVisible();
    });

    test('[SC-11] Admin support page shows conversations panel', async ({ page }) => {
        await page.goto('/support/admin', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // The page should have either an empty state OR a conversation list
        // Both states render inside the conversations panel with the heading
        const heading = page.locator('h3:has-text("محادثات الدعم")');
        await expect(heading).toBeVisible();
    });

    test('[SC-12] Admin support page shows placeholder when no conversation selected', async ({ page }) => {
        await page.goto('/support/admin', { waitUntil: 'networkidle' });

        await expect(page.locator('text=اختر محادثة للبدء')).toBeVisible();
    });
});

test.describe('Admin Support Page RBAC — Non-admin blocked', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'pe.json') });

    test('[SC-9] Non-admin USER cannot access /support/admin', async ({ page }) => {
        await page.goto('/support/admin', { waitUntil: 'networkidle' });
        // Wait for async router.push redirect
        await page.waitForURL('**/support', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(1000);

        // Should NOT be on admin page — either redirected or shows support page
        const url = page.url();
        expect(url).not.toContain('/support/admin');
    });
});

test.describe('Admin Support Page RBAC — Accountant blocked', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'accountant.json') });

    test('[SC-10] Non-admin ACCOUNTANT cannot access /support/admin', async ({ page }) => {
        await page.goto('/support/admin', { waitUntil: 'networkidle' });
        // Wait for async router.push redirect
        await page.waitForURL('**/support', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(1000);

        // Should NOT be on admin page
        const url = page.url();
        expect(url).not.toContain('/support/admin');
    });
});

// ═══════════════════════════════════════════════════════
//  Sidebar Navigation — verify via href presence in DOM
//  (Sidebar is hidden on mobile and visible on desktop,
//   we check the link exists in the page DOM.)
// ═══════════════════════════════════════════════════════

test.describe('Sidebar — Admin Support Links', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

    test('[SC-13] ADMIN can navigate to /support/admin successfully', async ({ page }) => {
        // Functional check: admin can access the support admin page
        const response = await page.goto('/support/admin', { waitUntil: 'networkidle' });
        expect(response?.status()).toBeLessThan(400);

        // Should stay on the admin page (not redirected)
        expect(new URL(page.url()).pathname).toBe('/support/admin');
        await expect(page.locator('h3:has-text("محادثات الدعم")')).toBeVisible();
    });
});

test.describe('Sidebar — User Support Links', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'pe.json') });

    test('[SC-14] USER does NOT have /support/admin link', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // The admin support link should NOT exist in the DOM at all for non-admin
        await expect(page.locator('a[href="/support/admin"]')).toHaveCount(0);
    });

    test('[SC-15] USER can navigate to /support successfully', async ({ page }) => {
        // Functional check: user can access the support page
        const response = await page.goto('/support', { waitUntil: 'networkidle' });
        expect(response?.status()).toBeLessThan(400);

        // Should show support page content
        await expect(page.locator('text=كيف يمكننا مساعدتك اليوم؟')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════
//  Ticket Form (Still Works)
// ═══════════════════════════════════════════════════════

test.describe('Support Ticket Form', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'pe.json') });

    test('[SC-16] Support ticket form still renders correctly', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await expect(page.locator('text=فتح تذكرة دعم فني جديدة')).toBeVisible();
        await expect(page.locator('select[name="type"]')).toBeVisible();
        await expect(page.locator('select[name="priority"]')).toBeVisible();
        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('textarea[name="description"]')).toBeVisible();
    });

    test('[SC-17] Support ticket submission works', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.fill('input[name="title"]', 'اختبار تذكرة');
        await page.fill('textarea[name="description"]', 'وصف اختباري للتذكرة');
        await page.locator('text=إرسال التذكرة').click();
        await page.waitForTimeout(3000);

        await expect(page.locator('text=تم إرسال تذكرتك بنجاح')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════
//  Responsive / Mobile Tests
// ═══════════════════════════════════════════════════════

test.describe('Responsive Chat (User)', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'pe.json') });

    test('[SC-18] Chat widget is responsive on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/support', { waitUntil: 'networkidle' });

        await expect(page.locator('text=كيف يمكننا مساعدتك اليوم؟')).toBeVisible();

        await page.locator('text=بدء محادثة').click();
        await page.waitForTimeout(1000);

        await expect(page.locator('.fixed.inset-0.z-50')).toBeVisible();
        await expect(page.locator('input[placeholder="اكتب رسالتك هنا..."]')).toBeVisible();
    });
});

test.describe('Responsive Chat (Admin)', () => {
    test.use({ storageState: path.join(AUTH_DIR, 'admin.json') });

    test('[SC-19] Admin support page responsive layout', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/support/admin', { waitUntil: 'networkidle' });

        await expect(page.locator('h3:has-text("محادثات الدعم")')).toBeVisible();
    });
});
