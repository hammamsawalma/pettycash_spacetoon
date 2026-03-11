import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Excel AI Bulk Import (ArrayBuffer Fix)', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('should successfully upload an Excel file via application/octet-stream and receive AI analysis', async ({ page }) => {
        // Intercept the API call to ensure it sends application/octet-stream
        await page.route('/api/parse-purchases', async route => {
            const request = route.request();
            expect(request.method()).toBe('POST');
            expect(request.headers()['content-type']).toBe('application/octet-stream');
            
            // Mock a successful AI response to avoid burning tokens on every test run
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    items: [
                        { itemName: 'Test AI Purchase', price: 50, currency: 'USD', date: '2026-03-11', reason: 'Office Supplies' }
                    ]
                })
            });
        });

        // Go to the bulk upload page
        await page.goto('/purchases/new');

        // Wait for the UI to load
        await expect(page.locator('text=Import Purchases via Smart Excel').or(page.locator('text=إضافة مشتريات عبر Excel الذكي'))).toBeVisible();

        // Select a project
        const projectSelect = page.locator('select');
        await expect(projectSelect).toBeVisible();
        await projectSelect.selectOption({ index: 1 }); // Select the first available project

        // Prepare a dummy Excel file
        const dummyExcelPath = path.join(__dirname, '..', '..', 'test-upload.xlsx');
        
        // Upload the file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(dummyExcelPath);

        // Click Analyze
        const analyzeButton = page.locator('button:has-text("Analyze File"), button:has-text("تحليل الملف")');
        await analyzeButton.click();

        // Wait for step 2 (review step) to appear, which verifies the API call succeeded natively
        await expect(page.locator('text=Analysis Results').or(page.locator('text=نتائج التحليل'))).toBeVisible({ timeout: 10000 });
        
        // Verify the mocked data is displayed
        await expect(page.locator('input[value="Test AI Purchase"]')).toBeVisible();
        await expect(page.locator('input[value="50"]')).toBeVisible();
    });
});
