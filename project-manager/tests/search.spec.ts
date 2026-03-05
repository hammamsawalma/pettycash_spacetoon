import { test, expect } from '@playwright/test';

test.describe('Global Search', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => window.localStorage.clear());
        await page.goto('/login');
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await page.fill('input[name="email"]', 'admin@pocket.com');
        await page.fill('input[name="password"]', '123456');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
        // Wait for page to fully hydrate
        await page.waitForTimeout(1000);
    });

    test('should save and display Recent Searches successfully', async ({ page }) => {
        const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

        // Try opening search via keyboard shortcut
        await page.keyboard.press(`${modifier}+k`);
        await page.waitForTimeout(600);

        const searchInput = page.getByPlaceholder('ابحث عن صفحة، مشروع، مستخدم، أو فاتورة...');

        // If keyboard shortcut didn't open the modal, try clicking the search button
        if (!(await searchInput.isVisible())) {
            const searchBtn = page.locator('button[aria-label*="بحث"], button[title*="بحث"], button').filter({ hasText: /بحث|search/i }).first();
            if (await searchBtn.count() > 0) await searchBtn.click();
            await page.waitForTimeout(600);
        }

        await expect(searchInput).toBeVisible({ timeout: 5000 });

        // Search for projects and navigate
        await searchInput.fill('المشاريع');
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
        await page.waitForURL('**/projects', { timeout: 10000 });

        // Re-open Search
        await page.keyboard.press(`${modifier}+k`);
        await page.waitForTimeout(800);

        // Check that the search modal opened again
        const searchInput2 = page.getByPlaceholder('ابحث عن صفحة، مشروع، مستخدم، أو فاتورة...');
        await expect(searchInput2).toBeVisible({ timeout: 5000 });

        // Verify Recent Searches section
        const historyTitle = page.getByText('عمليات بحث سابقة');
        await expect(historyTitle).toBeVisible({ timeout: 5000 });

        // Use nth(1) — nth(0) is the sidebar '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639' nav button, nth(1) is the recent search tag
        const recentTag = page.getByRole('button', { name: 'المشاريع' }).nth(1);
        await expect(recentTag).toBeVisible();

        // Clear history
        await page.getByRole('button', { name: 'مسح' }).click();
        await expect(historyTitle).toBeHidden({ timeout: 3000 });
    });

    test('should normalize Arabic characters without throwing errors', async ({ page }) => {
        const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+k`);
        await page.waitForTimeout(600);

        const searchInput = page.getByPlaceholder('ابحث عن صفحة، مشروع، مستخدم، أو فاتورة...');
        if (!(await searchInput.isVisible())) {
            const searchBtn = page.locator('button').filter({ hasText: /بحث|search/i }).first();
            if (await searchBtn.count() > 0) await searchBtn.click();
            await page.waitForTimeout(600);
        }

        await expect(searchInput).toBeVisible({ timeout: 5000 });
        await searchInput.fill('اداره');
        await page.waitForTimeout(1500);

        // Just verify no error UI appeared
        const errorUI = page.getByText('خطأ في البحث');
        await expect(errorUI).toBeHidden({ timeout: 5000 });
    });
});
