/**
 * Phase 3: Employee CRUD Operations
 *
 * Tests E1–E6 from the test matrix.
 * Employee creation/edit: ADMIN only.
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// Employee Creation
// ═══════════════════════════════════════════════════════════════
test.describe('Employee — Creation', () => {

    test('E1: ADMIN can access employee creation form', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/employees/new');
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('موظف');
    });

    test('E1: ADMIN can fill employee creation form', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        // Wait for form to fully hydrate
        await adminPage.waitForTimeout(3000);

        // Fill name field
        const nameInput = adminPage.locator('input[name="name"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill('موظف اختباري');
        }

        // Fill email with unique value
        const uniqueEmail = `test-${Date.now()}@test.com`;
        const emailInput = adminPage.locator('input[name="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
            await emailInput.fill(uniqueEmail);
        }

        // Fill password
        const passInput = adminPage.locator('input[name="password"]').first();
        if (await passInput.isVisible().catch(() => false)) {
            await passInput.fill('123456');
        }

        // Fill phone with unique number
        const uniquePhone = `05${Date.now().toString().slice(-8)}`;
        const phoneInput = adminPage.locator('input[name="phone"]').first();
        if (await phoneInput.isVisible().catch(() => false)) {
            await phoneInput.fill(uniquePhone);
        }

        // Select role if visible
        const roleSelect = adminPage.locator('select[name="role"]').first();
        if (await roleSelect.isVisible().catch(() => false)) {
            await roleSelect.selectOption('USER');
        }

        // Submit with actual button text
        await adminPage.click('button:has-text("اضافة وحفظ"), button[type="submit"]');
        await adminPage.waitForTimeout(5000);

        // Should redirect to employees list or show success
        const url = adminPage.url();
        const bodyText = await adminPage.textContent('body') || '';
        const success = !url.includes('/employees/new') || bodyText.includes('تم');
        expect(success).toBeTruthy();
    });

    test('E5: Duplicate email shows error', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForSelector('input[name="name"]', { state: 'visible', timeout: 15_000 });

        // Use an existing email (admin@pocket.com)
        const nameInput = adminPage.locator('input[name="name"]').first();
        if (await nameInput.isVisible().catch(() => false)) {
            await nameInput.fill('موظف مكرر');
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

        // Should show error about duplicate email or stay on page
        const url = adminPage.url();
        const bodyText = await adminPage.textContent('body') || '';
        const hasError = url.includes('/employees/new') || bodyText.includes('مسجل') || bodyText.includes('موجود') || bodyText.includes('مكرر');
        expect(hasError).toBeTruthy();
    });

    test('E1-GM: GM cannot create employee', async ({ gmPage }) => {
        await gmPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = gmPage.url();
        expect(url).not.toContain('/employees/new');
    });

    test('E1-ACC: ACC cannot create employee', async ({ accountantPage }) => {
        await accountantPage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = accountantPage.url();
        expect(url).not.toContain('/employees/new');
    });

    test('E1-PE: PE cannot create employee', async ({ pePage }) => {
        await pePage.goto('/employees/new', { waitUntil: 'networkidle', timeout: 30_000 });
        const url = pePage.url();
        expect(url).not.toContain('/employees/new');
    });
});

// ═══════════════════════════════════════════════════════════════
// Employee List and Detail
// ═══════════════════════════════════════════════════════════════
test.describe('Employee — List & Detail', () => {

    test('E3: ADMIN sees employee list', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('الموظفين');
    });

    test('E3: GM sees employee list (view-only)', async ({ gmPage }) => {
        await gmPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText).toContain('الموظفين');
        // GM should NOT see "إضافة موظف" create button
        expect(bodyText).not.toContain('إضافة موظف جديد');
    });

    test('E3: ACC sees employee list (view-only)', async ({ accountantPage }) => {
        await accountantPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText).toContain('الموظفين');
    });

    test('E2: ADMIN sees edit button on employee detail', async ({ adminPage }) => {
        await adminPage.goto('/employees', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        // Click first employee "المزيد" button
        const moreBtn = adminPage.locator('button:has-text("المزيد")').first();
        const hasEmployee = await moreBtn.isVisible().catch(() => false);
        test.skip(!hasEmployee, 'No employees to check');

        await moreBtn.click();
        await adminPage.waitForURL((url) => url.pathname.includes('/employees/') && url.pathname !== '/employees/', { timeout: 15_000 });
        await adminPage.waitForTimeout(2000);

        // ADMIN should see edit button
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('تعديل');
    });
});
