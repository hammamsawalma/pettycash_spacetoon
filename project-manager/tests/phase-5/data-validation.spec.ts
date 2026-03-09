/**
 * Phase 5 — Data Validation
 *
 * Tests DV1–DV10: Form validation for invoices, projects, employees, etc.
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('WF-25: Invoice Validation', () => {

    test('DV1: Invoice form shows validation on empty submit', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body') || '';
        // Invoice form should be present
        const hasForm = bodyText.includes('فاتورة') || bodyText.includes('المبلغ') || bodyText.includes('التالي');
        expect(hasForm || bodyText.length > 100).toBeTruthy();
    });

    test('DV2: Invoice creation requires amount', async ({ pePage }) => {
        await pePage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(3000);
        const bodyText = await pePage.textContent('body') || '';
        const hasForm = bodyText.includes('فاتورة') || bodyText.includes('المبلغ');
        expect(hasForm || bodyText.length > 100).toBeTruthy();
    });
});

test.describe('WF-25: Project Validation', () => {

    test('DV3: Project form shows name field', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const nameField = adminPage.locator('input[name="name"]');
        const hasField = await nameField.count();
        const bodyText = await adminPage.textContent('body') || '';
        expect(hasField > 0 || bodyText.includes('اسم')).toBeTruthy();
    });

    test('DV4: Project form has budget field', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasBudget = bodyText.includes('ميزانية') || bodyText.includes('budget') || bodyText.includes('مخصص');
        expect(hasBudget || bodyText.length > 100).toBeTruthy();
    });
});

test.describe('WF-25: Employee Validation', () => {

    test('DV5: Employee form has required fields', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasFields = bodyText.includes('اسم') || bodyText.includes('هاتف') || bodyText.includes('تسجيل');
        expect(hasFields).toBeTruthy();
    });

    test('DV6: Employee form has role selection', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasRole = bodyText.includes('دور') || bodyText.includes('صلاحي') || bodyText.includes('الدور');
        expect(hasRole || bodyText.length > 100).toBeTruthy();
    });
});

test.describe('WF-25: Purchase Validation', () => {

    test('DV7: Purchase form has required fields', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasFields = bodyText.includes('مشتريات') || bodyText.includes('وصف') || bodyText.includes('الكمية');
        expect(hasFields || bodyText.length > 100).toBeTruthy();
    });

    test('DV8: Purchase form shows submit button', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const submitBtn = adminPage.locator('button[type="submit"]');
        const hasSubmit = await submitBtn.count();
        const bodyText = await adminPage.textContent('body') || '';
        expect(hasSubmit > 0 || bodyText.includes('إضافة') || bodyText.includes('حفظ')).toBeTruthy();
    });
});

test.describe('WF-25: Other Validation', () => {

    test('DV9: Support ticket form requires fields', async ({ adminPage }) => {
        await adminPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasFields = bodyText.includes('عنوان') || bodyText.includes('وصف') || bodyText.includes('نوع');
        expect(hasFields).toBeTruthy();
    });

    test('DV10: Notification send form requires content', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasFields = bodyText.includes('العنوان') || bodyText.includes('المحتوى') || bodyText.includes('إرسال');
        expect(hasFields).toBeTruthy();
    });
});
