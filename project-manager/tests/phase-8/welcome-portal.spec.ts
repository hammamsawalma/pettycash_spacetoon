import { test, expect } from '@playwright/test';

test.describe('Welcome Portal & Branch Selection Flow (Phase 8)', () => {

    test.beforeEach(async ({ context, page }) => {
        // Clear cookies and local storage to ensure a completely clean unauthenticated state
        await context.clearCookies();
        await page.goto('/login');
        await page.evaluate(() => localStorage.clear());
    });

    test('should render the Welcome Portal with correct translations and switch to English', async ({ page }) => {
        await page.goto('/welcome');
        
        // Wait for the main wrapper of WelcomeClient to ensure it's fully hydratated and streaming is done
        await page.waitForSelector('text=Spacetoon Pocket', { state: 'visible', timeout: 10000 });
        await page.waitForTimeout(1000); // Give it a brief moment to finish animations
        await page.screenshot({ path: 'welcome-debug-after-load.png' });

        // Check Arabic default text
        await expect(page.locator('text=/النظام الأذكى لإدارة مشاريعك/')).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: /الدخول لبوابة الفروع/ })).toBeVisible();

        // Switch to English
        await page.getByRole('button', { name: 'EN' }).click();

        // Check English text
        await expect(page.locator('text=/smartest system for managing/i')).toBeVisible();
        await expect(page.getByRole('button', { name: /Enter Branch Portal/i })).toBeVisible();

        // Check language switch persistence
        await page.reload();
        await expect(page.locator('text=/smartest system for managing/i')).toBeVisible();

        // Click "Access Branch Portal"
        await page.getByRole('button', { name: 'الدخول لبوابة الفروع' }).click();

        // Ensure branches list is shown
        await expect(page.getByText('اختر الفرع الإقليمي')).toBeVisible();
        await expect(page.getByText('دخول مدير النظام المركزي')).toBeVisible();

        // Select Qatar branch
        await page.getByRole('button', { name: /قطر/ }).click();

        // Verify the "Connecting" animation state
        await expect(page.locator('text=/جاري الاتصال بخوادم/')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('تأسيس قناة آمنة ومستقلة')).toBeVisible();

        // Should automatically redirect to /login after 1.5 seconds
        await page.waitForURL('**/login?branch=QA', { timeout: 3000 });

        // Verify personalized login screen
        await expect(page.getByText('مرحباً بك في فرع قطر')).toBeVisible();
        await expect(page.getByText('بوابة الأعمال الرسمية — قطر')).toBeVisible();
    });

    test('should progress through branch selection and redirect to personalized login page', async ({ page }) => {
        await page.goto('/welcome');

        // Click "Access Branch Portal"
        await page.getByRole('button', { name: 'الدخول لبوابة الفروع' }).click();

        // Ensure branches list is shown
        await expect(page.getByText('اختر الفرع الإقليمي')).toBeVisible();
        await expect(page.getByText('دخول مدير النظام المركزي')).toBeVisible();

        // Select Qatar branch
        await page.getByRole('button', { name: /قطر/ }).click();

        // Verify the "Connecting" animation state
        await expect(page.locator('text=/جاري الاتصال بخوادم/')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('تأسيس قناة آمنة ومستقلة')).toBeVisible();

        // Should automatically redirect to /login after 1.5 seconds
        await page.waitForURL('**/login?branch=QA', { timeout: 3000 });

        // Verify personalized login screen
        await expect(page.getByText('مرحباً بك في فرع قطر')).toBeVisible();
        await expect(page.getByText('بوابة الأعمال الرسمية — قطر')).toBeVisible();
    });

    test('should allow central admin to access ROOT login', async ({ page }) => {
        await page.goto('/welcome');

        // Click "Access Branch Portal"
        await page.getByRole('button', { name: 'الدخول لبوابة الفروع' }).click();

        // Click HQ Admin
        await page.screenshot({ path: 'welcome-admin-debug.png' });
        await page.getByRole('button', { name: 'دخول مدير النظام المركزي' }).click();

        // Should go directly to /login?branch=ROOT without delay
        await expect(page).toHaveURL(/.*\/login\?branch=ROOT/);

        // Verify personalized login screen for HQ (Optional: only if WelcomeClient injects it)
        // Note: WelcomeClient doesn't inject it to localStorage, so we just make sure we reached the login page
        await expect(page.getByRole('button', { name: 'دخول', exact: true })).toBeVisible();
    });

});
