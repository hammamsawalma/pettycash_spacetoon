import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    const users = [
        { role: 'Admin', email: 'admin@pocket.com', password: '123456' },
        { role: 'Employee', email: 'emp1@pocket.com', password: '123456' },
        { role: 'Accountant', email: 'accountant@pocket.com', password: '123456' },
        { role: 'Coordinator', email: 'coordinator@pocket.com', password: '123456' },
    ];

    for (const user of users) {
        test(`Login as ${user.role}`, async ({ page }) => {
            await page.goto('/login');

            // Wait for login page to render
            await page.waitForSelector('input[name="email"]', { timeout: 10000 });

            await page.fill('input[name="email"]', user.email);
            await page.fill('input[name="password"]', user.password);
            await page.click('button[type="submit"]');

            // Wait for redirect to dashboard (allow up to 15s)
            await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
            await expect(page).toHaveURL('http://localhost:3000/');

            // Verify sidebar nav exists (use first() as page has sidebar + mobile nav)
            await expect(page.locator('nav').first()).toBeVisible({ timeout: 8000 });
        });
    }

    test('Login fails with invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });

        await page.fill('input[name="email"]', 'invalid@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should stay on login page and show an error toast or inline message
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
    });
});
