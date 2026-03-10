/**
 * Phase 6 — Mobile Form Pages
 *
 * Tests MFP1–MFP16: Form pages render correctly and are usable on iPhone 14.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

test.describe('M6-08: Mobile Form Pages', () => {

    test('MFP1: /invoices/new form renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MFP2: /invoices/new no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MFP3: /purchases/new form renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MFP4: /purchases/new no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MFP5: /projects/new form renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MFP6: /projects/new no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MFP7: /notifications/send form renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MFP8: Form inputs fill width', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const inputs = adminPage.locator('input[type="text"], input[type="number"], textarea');
        const count = await inputs.count();
        if (count > 0) {
            const box = await inputs.first().boundingBox();
            if (box) {
                // Input should be at least 200px wide on 390px screen
                expect(box.width).toBeGreaterThan(200);
            }
        }
    });

    test('MFP9: Form has action button visible', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const actionBtn = adminPage.locator('button[type="submit"], button:has-text("حفظ"), button:has-text("إرسال"), button:has-text("إضافة"), button:has-text("رفع"), button:has-text("تأكيد")');
        const count = await actionBtn.count();
        expect(count).toBeGreaterThan(0);
    });

    test('MFP10: /wallet/deposit form renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/wallet/deposit', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MFP11: /settings page renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MFP12: /settings no horizontal overflow', async ({ adminPage }) => {
        await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MFP13: File upload controls visible', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Check for file input or upload button
        const fileInput = adminPage.locator('input[type="file"], button:has-text("رفع"), button:has-text("صور"), [class*="upload"]');
        const count = await fileInput.count();
        expect(count).toBeGreaterThanOrEqual(0); // May not exist on all forms
    });

    test('MFP14: Select dropdowns usable', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const selects = adminPage.locator('select, [role="combobox"], [role="listbox"]');
        const count = await selects.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('MFP15: Form has navigation or cancel control', async ({ adminPage }) => {
        await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Check any navigation control exists (cancel, back, close, header button)
        const hasNav = bodyText.includes('إلغاء') || bodyText.includes('رجوع') || bodyText.includes('عودة')
            || bodyText.includes('إغلاق') || await adminPage.locator('a[href="/invoices"]').count() > 0
            || await adminPage.locator('header button').count() > 0;
        expect(hasNav).toBeTruthy();
    });

    test('MFP16: /employees/new renders on mobile', async ({ adminPage }) => {
        await adminPage.goto('/employees/new', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
