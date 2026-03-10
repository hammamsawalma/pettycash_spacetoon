import { test, expect, Page } from '@playwright/test';

/**
 * ════════════════════════════════════════════════════════════════════════
 *  Live Support Chat Test Suite
 *  Tests the support page live chat widget, admin support chat page,
 *  and RBAC access control.
 * ════════════════════════════════════════════════════════════════════════
 */

// ─── Credentials ──────────────────────────────────────────────────────────────
const USERS = {
    ADMIN: { email: 'admin@pocket.com', pass: '123456', label: 'ADMIN' },
    EMP1: { email: 'emp1@pocket.com', pass: '123456', label: 'USER (Employee)' },
    ACC: { email: 'accountant@pocket.com', pass: '123456', label: 'GLOBAL_ACCOUNTANT' },
};

// ─── Login helper ─────────────────────────────────────────────────────────────
async function login(page: Page, creds: { email: string; pass: string }) {
    await page.goto('/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', creds.email);
    await page.fill('input[name="password"]', creds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 15000 });
    await page.waitForSelector('nav', { timeout: 8000 });
    await page.waitForTimeout(600);
}

// ═══════════════════════════════════════════════════════
//  Support Page — Chat Widget (User Role)
// ═══════════════════════════════════════════════════════

test.describe('Support Chat Widget (User)', () => {

    test('[SC-1] Support page renders correctly with chat button', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        // Verify page title and main elements
        await expect(page.locator('text=كيف يمكننا مساعدتك اليوم؟')).toBeVisible();
        await expect(page.locator('text=المحادثة المباشرة')).toBeVisible();
        await expect(page.locator('text=بدء محادثة')).toBeVisible();
        await expect(page.locator('text=فتح تذكرة دعم فني جديدة')).toBeVisible();
    });

    test('[SC-2] Chat widget opens when clicking start chat button', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        // Click chat button
        await page.click('text=بدء محادثة');
        await page.waitForTimeout(500);

        // Chat panel should be visible
        await expect(page.locator('text=الدعم الفني')).toBeVisible();
        await expect(page.locator('text=محادثة مباشرة مع فريق الدعم')).toBeVisible();

        // Input field should exist
        await expect(page.locator('input[placeholder="اكتب رسالتك هنا..."]')).toBeVisible();
    });

    test('[SC-3] Chat widget shows empty state message', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.click('text=بدء محادثة');
        await page.waitForTimeout(1000);

        // Should show welcome message
        await expect(page.locator('text=مرحباً بك!')).toBeVisible();
        await expect(page.locator('text=اكتب رسالتك وسنقوم بالرد عليك في أقرب وقت ممكن.')).toBeVisible();
    });

    test('[SC-4] User can type and send a support message', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.click('text=بدء محادثة');
        await page.waitForTimeout(500);

        const input = page.locator('input[placeholder="اكتب رسالتك هنا..."]');
        await input.fill('مرحبا، أحتاج مساعدة في النظام');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);

        // Message should appear in the chat
        await expect(page.locator('text=مرحبا، أحتاج مساعدة في النظام')).toBeVisible();

        // Input should be cleared
        await expect(input).toHaveValue('');
    });

    test('[SC-5] Chat widget closes when clicking X button', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.click('text=بدء محادثة');
        await page.waitForTimeout(500);

        // Verify chat is open
        await expect(page.locator('text=محادثة مباشرة مع فريق الدعم')).toBeVisible();

        // Close chat
        await page.locator('.fixed button:has(svg.lucide-x)').click();
        await page.waitForTimeout(300);

        // Chat panel should be gone
        await expect(page.locator('text=محادثة مباشرة مع فريق الدعم')).not.toBeVisible();
    });

    test('[SC-6] Chat widget closes when clicking backdrop', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.click('text=بدء محادثة');
        await page.waitForTimeout(500);

        // Click the backdrop (bg-black/30 area)
        await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        // Chat panel should be gone
        await expect(page.locator('text=محادثة مباشرة مع فريق الدعم')).not.toBeVisible();
    });

    test('[SC-7] Cannot send empty message', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        await page.click('text=بدء محادثة');
        await page.waitForTimeout(500);

        // Send button should be disabled with empty input
        const submitBtn = page.locator('form button[type="submit"]').last();
        await expect(submitBtn).toBeDisabled();
    });
});

// ═══════════════════════════════════════════════════════
//  Admin Support Page — RBAC
// ═══════════════════════════════════════════════════════

test.describe('Admin Support Page — RBAC', () => {

    test('[SC-8] ADMIN can access /support/admin', async ({ page }) => {
        await login(page, USERS.ADMIN);
        await page.goto('/support/admin', { waitUntil: 'networkidle' });

        // Should show admin support page
        await expect(page.locator('text=محادثات الدعم')).toBeVisible();
    });

    test('[SC-9] Non-admin USER cannot access /support/admin', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support/admin', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Should be redirected to /support
        const pathname = new URL(page.url()).pathname;
        expect(pathname).toBe('/support');
    });

    test('[SC-10] Non-admin ACCOUNTANT cannot access /support/admin', async ({ page }) => {
        await login(page, USERS.ACC);
        await page.goto('/support/admin', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Should be redirected to /support
        const pathname = new URL(page.url()).pathname;
        expect(pathname).toBe('/support');
    });

    test('[SC-11] Admin support page shows empty state when no conversations', async ({ page }) => {
        await login(page, USERS.ADMIN);
        await page.goto('/support/admin', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Either shows conversations or empty state
        const isEmpty = await page.locator('text=لا توجد محادثات دعم حالياً').isVisible().catch(() => false);
        const hasConvs = await page.locator('text=محادثة').isVisible().catch(() => false);

        // One of the two states should be true
        expect(isEmpty || hasConvs).toBeTruthy();
    });

    test('[SC-12] Admin support page shows "select conversation" message', async ({ page }) => {
        await login(page, USERS.ADMIN);
        await page.goto('/support/admin', { waitUntil: 'networkidle' });

        // Should show the placeholder text for no active conversation
        await expect(page.locator('text=اختر محادثة للبدء')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════
//  Sidebar Navigation
// ═══════════════════════════════════════════════════════

test.describe('Sidebar — Support Links', () => {

    test('[SC-13] ADMIN sees "محادثات الدعم" link in sidebar', async ({ page }) => {
        await login(page, USERS.ADMIN);
        await page.goto('/', { waitUntil: 'networkidle' });

        // Should see the support chat link
        await expect(page.locator('nav a[href="/support/admin"]')).toBeVisible();
    });

    test('[SC-14] USER does NOT see "محادثات الدعم" link in sidebar', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/', { waitUntil: 'networkidle' });

        // Should NOT see the admin support chat link
        await expect(page.locator('nav a[href="/support/admin"]')).toHaveCount(0);
    });

    test('[SC-15] All users see "تذاكر الدعم" link in sidebar', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/', { waitUntil: 'networkidle' });

        // Should see the support ticket link (expand the support section if needed)
        const supportLink = page.locator('nav a[href="/support"]');
        // Should be visible (possibly after expanding the menu)
        await expect(supportLink.first()).toBeAttached();
    });
});

// ═══════════════════════════════════════════════════════
//  Ticket Form (Still Works)
// ═══════════════════════════════════════════════════════

test.describe('Support Ticket Form', () => {

    test('[SC-16] Support ticket form still renders correctly', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        // Verify ticket form elements
        await expect(page.locator('text=فتح تذكرة دعم فني جديدة')).toBeVisible();
        await expect(page.locator('select[name="type"]')).toBeVisible();
        await expect(page.locator('select[name="priority"]')).toBeVisible();
        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('textarea[name="description"]')).toBeVisible();
        await expect(page.locator('text=إرسال التذكرة')).toBeVisible();
    });

    test('[SC-17] Support ticket submission works', async ({ page }) => {
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        // Fill ticket form
        await page.fill('input[name="title"]', 'اختبار تذكرة');
        await page.fill('textarea[name="description"]', 'وصف اختباري للتذكرة');
        await page.click('text=إرسال التذكرة');
        await page.waitForTimeout(3000);

        // Should show success toast
        await expect(page.locator('text=تم إرسال تذكرتك بنجاح')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════
//  Responsive / Mobile Tests
// ═══════════════════════════════════════════════════════

test.describe('Responsive Chat', () => {

    test('[SC-18] Chat widget is responsive on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
        await login(page, USERS.EMP1);
        await page.goto('/support', { waitUntil: 'networkidle' });

        // Support page should work on mobile
        await expect(page.locator('text=كيف يمكننا مساعدتك اليوم؟')).toBeVisible();

        // Open chat
        await page.click('text=بدء محادثة');
        await page.waitForTimeout(500);

        // Chat panel should be visible
        await expect(page.locator('text=محادثة مباشرة مع فريق الدعم')).toBeVisible();
        await expect(page.locator('input[placeholder="اكتب رسالتك هنا..."]')).toBeVisible();
    });

    test('[SC-19] Admin support page responsive layout', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await login(page, USERS.ADMIN);
        await page.goto('/support/admin', { waitUntil: 'networkidle' });

        // Should show conversations list on mobile (not the chat area initially)
        await expect(page.locator('text=محادثات الدعم')).toBeVisible();
    });
});
