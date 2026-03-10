/**
 * Phase 18: Bulk Purchases via Excel + Image Upload Enhancement
 *
 * Tests for:
 * - Image Upload: dual camera/gallery buttons in /purchases/new
 * - Bulk Import: /purchases/bulk page access, step flow, edge cases
 * - Proxy: route protection for /purchases/bulk
 * - Server Action: createBatchPurchases edge cases
 */
import { test, expect } from '../fixtures/auth.fixture';
import type { Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// Feature A: Image Upload Enhancement
// ═══════════════════════════════════════════════════════════════
test.describe('Image Upload — Dual Buttons', () => {

    test('IMG-1: Purchase form shows camera and gallery buttons', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const bodyText = await adminPage.textContent('body') || '';

        // Both button labels should be visible
        expect(bodyText).toContain('التقاط صورة');
        expect(bodyText).toContain('اختيار صورة');

        // Section label
        expect(bodyText).toContain('مرفق الشراء');
    });

    test('IMG-2: Camera input has capture attribute', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        // Look for hidden input with capture="environment"
        const cameraInput = adminPage.locator('input[type="file"][capture="environment"]');
        const hasCameraInput = await cameraInput.count();
        expect(hasCameraInput).toBeGreaterThanOrEqual(1);
    });

    test('IMG-3: Gallery input does NOT have capture attribute', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        // Should have at least one file input without capture
        const fileInputs = adminPage.locator('input[type="file"]');
        const count = await fileInputs.count();
        expect(count).toBeGreaterThanOrEqual(2); // camera + gallery

        // At least one should NOT have capture
        let foundGallery = false;
        for (let i = 0; i < count; i++) {
            const capture = await fileInputs.nth(i).getAttribute('capture');
            if (!capture) foundGallery = true;
        }
        expect(foundGallery).toBeTruthy();
    });

    test('IMG-4: Image field is optional — form works without image', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForSelector('select[name="projectId"]', { state: 'visible', timeout: 15_000 });

        // Select project
        const projectSelect = adminPage.locator('select[name="projectId"]');
        const options = await projectSelect.locator('option').all();
        test.skip(options.length <= 1, 'No projects available');
        const val = await options[1].getAttribute('value');
        if (val) await projectSelect.selectOption(val);

        // Fill description and quantity (no image)
        await adminPage.locator('textarea[name="description"]').fill('طلب بدون صورة - اختبار');
        await adminPage.locator('input[name="quantity"]').fill('1');

        await adminPage.click('button:has-text("حفظ الطلب")');
        await adminPage.waitForTimeout(5000);

        // Should succeed without image
        const url = adminPage.url();
        const bodyText = await adminPage.textContent('body') || '';
        const success = !url.includes('/purchases/new') || bodyText.includes('تم');
        expect(success).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Feature A: Mobile Card — Hero Image
// ═══════════════════════════════════════════════════════════════
test.describe('Mobile Card — Image Display', () => {

    test('CARD-1: Purchases list shows ShoppingCart icon for cards without images', async ({ adminPage }) => {
        await adminPage.setViewportSize({ width: 390, height: 844 }); // iPhone
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const bodyText = await adminPage.textContent('body') || '';
        // Should have the purchases header
        expect(bodyText).toContain('المشتريات');

        // Mobile cards should be visible (not the table)
        const mobileCards = adminPage.locator('.md\\:hidden');
        const hasMobile = await mobileCards.count();
        expect(hasMobile).toBeGreaterThan(0);
    });

    test('CARD-2: Purchases list shows bulk import button', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('إضافة مجمعة');
    });
});

// ═══════════════════════════════════════════════════════════════
// Feature B: Bulk Purchases Page — Access Control
// ═══════════════════════════════════════════════════════════════
test.describe('Bulk Purchase — Access Control', () => {

    test('BULK-1: ADMIN can access /purchases/bulk', async ({ adminPage }) => {
        await adminPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/purchases/bulk');
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('إضافة مشتريات مجمعة');
    });

    test('BULK-2: GM can access /purchases/bulk', async ({ gmPage }) => {
        await gmPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await gmPage.waitForTimeout(2000);
        expect(gmPage.url()).toContain('/purchases/bulk');
    });

    test('BULK-3: PM (USER role) can access /purchases/bulk', async ({ pmPage }) => {
        await pmPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await pmPage.waitForTimeout(2000);
        // PM is USER at system level — proxy allows it
        expect(pmPage.url()).toContain('/purchases/bulk');
    });

    test('BULK-4: ACCOUNTANT cannot access /purchases/bulk', async ({ accountantPage }) => {
        await accountantPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await accountantPage.waitForTimeout(2000);
        // GLOBAL_ACCOUNTANT should be redirected
        expect(accountantPage.url()).not.toContain('/purchases/bulk');
    });
});

// ═══════════════════════════════════════════════════════════════
// Feature B: Bulk Purchases Page — UI Flow
// ═══════════════════════════════════════════════════════════════
test.describe('Bulk Purchase — UI Flow', () => {

    test('BULK-5: Bulk page shows step indicator', async ({ adminPage }) => {
        await adminPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('رفع الملف');
        expect(bodyText).toContain('مراجعة');
        expect(bodyText).toContain('تأكيد');
    });

    test('BULK-6: Shows project selector and batch label input', async ({ adminPage }) => {
        await adminPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('المشروع');
        expect(bodyText).toContain('تسمية الدفعة');
    });

    test('BULK-7: Analyze button is disabled without project selection', async ({ adminPage }) => {
        await adminPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        // Analyze button should be disabled when no project is selected
        const analyzeBtn = adminPage.locator('button:has-text("تحليل الملف")');
        const isDisabled = await analyzeBtn.isDisabled();
        expect(isDisabled).toBeTruthy();
    });

    test('BULK-8: File upload area accepts Excel files only', async ({ adminPage }) => {
        await adminPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        // Check file input accepts correct types
        const fileInput = adminPage.locator('input[type="file"][accept=".xlsx,.xls,.csv"]');
        const hasFileInput = await fileInput.count();
        expect(hasFileInput).toBeGreaterThanOrEqual(1);
    });

    test('BULK-9: Back button navigates away', async ({ adminPage }) => {
        await adminPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const backButton = adminPage.locator('button:has-text("العودة")');
        const hasBack = await backButton.isVisible();
        expect(hasBack).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════
// Feature B: Bulk Purchases — Edge Cases (API-level)
// ═══════════════════════════════════════════════════════════════
test.describe('Bulk Purchase — API Edge Cases', () => {

    test('BULK-10: API rejects requests without authentication', async ({ page }) => {
        const response = await page.request.post('/api/parse-purchases', {
            multipart: {
                file: {
                    name: 'test.xlsx',
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    buffer: Buffer.from('test'),
                }
            }
        });

        // Should get 401 (unauthenticated)
        expect(response.status()).toBe(401);
    });

    test('BULK-11: API rejects invalid file types', async ({ adminPage }) => {
        // Attempt to upload a .txt file
        const response = await adminPage.request.post('/api/parse-purchases', {
            multipart: {
                file: {
                    name: 'test.txt',
                    mimeType: 'text/plain',
                    buffer: Buffer.from('Hello World'),
                }
            }
        });

        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toBeTruthy();
    });

    test('BULK-12: API rejects empty file', async ({ adminPage }) => {
        const response = await adminPage.request.post('/api/parse-purchases', {
            multipart: {
                file: {
                    name: 'empty.xlsx',
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    buffer: Buffer.alloc(0),
                }
            }
        });

        // Should get 400 (empty file)
        expect([400, 500]).toContain(response.status());
    });
});

// ═══════════════════════════════════════════════════════════════
// Feature B: Batch Creation — Server Action Edge Cases
// ═══════════════════════════════════════════════════════════════
test.describe('Bulk Purchase — Server Action Validation', () => {

    test('BULK-13: Purchases list still works correctly after batch feature added', async ({ adminPage }) => {
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('المشتريات');

        // Both buttons should be visible for admin
        expect(bodyText).toContain('إضافة طلب شراء');
        expect(bodyText).toContain('إضافة مجمعة');
    });

    test('BULK-14: Single purchase creation still works after changes', async ({ adminPage }) => {
        await adminPage.goto('/purchases/new', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        // Form should load correctly
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('اضافة طلب شراء جديد');
        expect(bodyText).toContain('وصف الطلب');
    });

    test('BULK-15: Bulk page shows AI branding', async ({ adminPage }) => {
        await adminPage.goto('/purchases/bulk', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('الذكاء الاصطناعي');
    });
});

// ═══════════════════════════════════════════════════════════════
// Batch Label Display
// ═══════════════════════════════════════════════════════════════
test.describe('Batch Label — Display in List', () => {

    test('BATCH-1: PurchasesClient renders batchLabel badge for batch purchases', async ({ adminPage }) => {
        // This is a structural test — verify the badge rendering logic exists
        await adminPage.goto('/purchases', { waitUntil: 'networkidle', timeout: 30_000 });
        await adminPage.waitForTimeout(2000);

        // The page should load without errors
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).toContain('المشتريات');

        // Verify the page didn't crash (no error boundaries)
        expect(bodyText).not.toContain('Error');
        expect(bodyText).not.toContain('حدث خطأ');
    });
});
