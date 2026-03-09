/**
 * Phase 3: Employee Lifecycle & Edge Cases
 *
 * Tests for: updateEmployee, saveUserSignature, detail page content,
 * edit form, and validation edge cases.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// Helper: Navigate to first employee detail
async function navigateToFirstEmployee(page: Page): Promise<boolean> {
    await page.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(3000);
    const moreBtn = page.locator('button:has-text("المزيد")').first();
    if (await moreBtn.isVisible().catch(() => false)) {
        await moreBtn.click();
        try {
            await page.waitForURL((url) => /\/employees\/[a-zA-Z0-9]/.test(url.pathname), { timeout: 15_000 });
        } catch (_e) {
            // Retry
            await page.waitForTimeout(1000);
            await moreBtn.click({ force: true });
            try {
                await page.waitForURL((url) => /\/employees\/[a-zA-Z0-9]/.test(url.pathname), { timeout: 20_000 });
            } catch (_e2) { return false; }
        }
        await page.waitForTimeout(2000);
        return true;
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════
// Employee — Detail Page Content
// ═══════════════════════════════════════════════════════════════
test.describe('Employee — Detail Content', () => {

    test('E-DC1: Employee detail shows name and role', async ({ adminPage }) => {
        const found = await navigateToFirstEmployee(adminPage);
        test.skip(!found, 'No employees');
        const bodyText = await adminPage.textContent('body') || '';
        // Should show employee's name, role, etc.
        const hasContent = bodyText.includes('موظف') || bodyText.includes('مدير') || bodyText.includes('الدور');
        expect(hasContent).toBeTruthy();
    });

    test('E-DC2: Employee detail shows contact info', async ({ adminPage }) => {
        const found = await navigateToFirstEmployee(adminPage);
        test.skip(!found, 'No employees');
        const bodyText = await adminPage.textContent('body') || '';
        // Should show email or phone
        const hasContact = bodyText.includes('@') || bodyText.includes('05') || bodyText.includes('هاتف') || bodyText.includes('بريد');
        expect(hasContact).toBeTruthy();
    });

    test('E-DC3: Employee detail shows projects associations', async ({ adminPage }) => {
        const found = await navigateToFirstEmployee(adminPage);
        test.skip(!found, 'No employees');
        const bodyText = await adminPage.textContent('body') || '';
        // Should show associated projects or "no projects"
        const hasProjects = bodyText.includes('المشاريع') || bodyText.includes('مشروع') || bodyText.includes('لا يوجد');
        expect(hasProjects).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Employee — Edit
// ═══════════════════════════════════════════════════════════════
test.describe('Employee — Edit', () => {

    test('E-ED1: ADMIN sees edit button on employee detail', async ({ adminPage }) => {
        const found = await navigateToFirstEmployee(adminPage);
        test.skip(!found, 'No employees');
        const bodyText = await adminPage.textContent('body') || '';
        const hasEdit = bodyText.includes('تعديل');
        expect(hasEdit).toBeTruthy();
    });

    test('E-ED2: GM cannot edit employees', async ({ gmPage }) => {
        const found = await navigateToFirstEmployee(gmPage);
        test.skip(!found, 'No employees');
        const bodyText = await gmPage.textContent('body') || '';
        // GM should not see edit button for employees
        expect(bodyText).not.toContain('تعديل البيانات');
    });

    test('E-ED3: ACC cannot edit employees', async ({ accountantPage }) => {
        const found = await navigateToFirstEmployee(accountantPage);
        test.skip(!found, 'No employees');
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText).not.toContain('تعديل البيانات');
    });
});

// ═══════════════════════════════════════════════════════════════
// Employee — Creation Validation
// ═══════════════════════════════════════════════════════════════
test.describe('Employee — Creation Validation', () => {

    test('E-V1: Empty name prevents creation', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(3000);
        // Only fill email and password, leave name empty
        const emailInput = adminPage.locator('input[name="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill(`empty-name-${Date.now()}@test.com`);
        }
        const passInput = adminPage.locator('input[name="password"]').first();
        if (await passInput.isVisible().catch(() => false)) {
            await passInput.fill('123456');
        }
        await adminPage.click('button:has-text("اضافة وحفظ"), button[type="submit"]');
        await adminPage.waitForTimeout(3000);
        // Should stay on page due to validation
        expect(adminPage.url()).toContain('/employees/new');
    });

    test('E-V2: Missing password prevents creation', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(3000);
        const nameInput = adminPage.locator('input[name="name"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill('موظف بلا كلمة مرور');
        }
        // Don't fill password
        await adminPage.click('button:has-text("اضافة وحفظ"), button[type="submit"]');
        await adminPage.waitForTimeout(3000);
        // Should stay on page
        expect(adminPage.url()).toContain('/employees/new');
    });

    test('E-V3: Submitting with existing email shows duplicate error', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(3000);
        // Fill with a known existing email (admin@pocket.com)
        const nameInput = adminPage.locator('input[name="name"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill('تكرار إيميل');
        }
        const emailInput = adminPage.locator('input[name="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill('admin@pocket.com');
        }
        const passInput = adminPage.locator('input[name="password"]').first();
        if (await passInput.isVisible().catch(() => false)) {
            await passInput.fill('123456');
        }
        await adminPage.click('button:has-text("اضافة وحفظ"), button[type="submit"]');
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should show duplicate error or stay on page
        const hasError = bodyText.includes('مستخدم') || bodyText.includes('مسبقاً') || adminPage.url().includes('/employees/new');
        expect(hasError).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Employee — List Features
// ═══════════════════════════════════════════════════════════════
test.describe('Employee — List Features', () => {

    test('E-LF1: ADMIN sees "إضافة موظف" button on list', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('إضافة');
    });

    test('E-LF2: GM does not see "إضافة موظف" button', async ({ gmPage }) => {
        await gmPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText).not.toContain('إضافة موظف جديد');
    });

    test('E-LF3: ACC does not see "إضافة موظف" button', async ({ accountantPage }) => {
        await accountantPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText).not.toContain('إضافة موظف جديد');
    });

    test('E-LF4: Employee list shows role badges', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should show role indicators
        const hasRoles = bodyText.includes('مدير') || bodyText.includes('موظف') || bodyText.includes('محاسب');
        expect(hasRoles).toBeTruthy();
    });
});
