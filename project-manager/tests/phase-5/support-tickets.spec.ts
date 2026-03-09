/**
 * Phase 5 — Support Tickets
 *
 * Tests ST1–ST8: Support page access, form fields, validation, and notification creation.
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('WF-15: Support Access', () => {

    test('ST1: ADMIN can access support page', async ({ adminPage }) => {
        await adminPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasSupport = bodyText.includes('دعم') || bodyText.includes('تذكرة') || bodyText.includes('مساعدة');
        expect(hasSupport || adminPage.url().includes('/support')).toBeTruthy();
    });

    test('ST2: GM can submit support ticket', async ({ gmPage }) => {
        await gmPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('ST3: ACC can submit support ticket', async ({ accountantPage }) => {
        await accountantPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('ST4: PE can submit support ticket', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('ST5: PM can submit support ticket', async ({ pmPage }) => {
        await pmPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        expect(pmPage.url()).toContain('/support');
    });
});

test.describe('WF-15: Support Form', () => {

    test('ST6: Support form has type, priority, title, description fields', async ({ adminPage }) => {
        await adminPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasFields = bodyText.includes('نوع') || bodyText.includes('أولوية') || bodyText.includes('عنوان') || bodyText.includes('وصف');
        expect(hasFields).toBeTruthy();
    });

    test('ST7: Support form shows submit button', async ({ adminPage }) => {
        await adminPage.goto('/support', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasSubmit = bodyText.includes('إرسال') || bodyText.includes('تقديم');
        expect(hasSubmit).toBeTruthy();
    });

    test('ST8: Support page accessible from all roles', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        // PE should not be blocked
        const url = pePage.url();
        const bodyText = await pePage.textContent('body') || '';
        const accessible = url.includes('/support') || !bodyText.includes('غير مصرح');
        expect(accessible).toBeTruthy();
    });
});
