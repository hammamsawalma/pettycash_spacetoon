import { test, expect } from '@playwright/test';

test.describe('Welcome Page — First Visit Flow', () => {
    // Should show PWA install prompt / flow if it's not installed
    test('unauthenticated user is redirected to /welcome', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.waitForURL(/\/welcome/);
        expect(page.url()).toContain('/welcome');
    });

    test('welcome page shows logo, title, and description', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const body = await page.textContent('body');
        expect(body).toContain('Spacetoon Pocket');
        // Description
        expect(body).toContain('النظام الأذكى لإدارة مشاريعك وفريق عملك بكفاءة عالية');
        // Logo should be visible
        const logo = page.locator('img[alt="Spacetoon Pocket"]');
        await expect(logo).toBeVisible();
    });

    test('welcome page has CTA "الدخول لبوابة الفروع" button', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        const cta = page.getByRole('button', { name: /الدخول لبوابة الفروع/ });
        await expect(cta).toBeVisible();
    });

    test('clicking CTA shows branch selection', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.getByRole('button', { name: /الدخول لبوابة الفروع/ }).click();
        await page.waitForTimeout(500);
        const body = await page.textContent('body');
        expect(body).toContain('اختر الفرع الإقليمي');
    });

    test('branch selection shows available branches', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.getByRole('button', { name: /الدخول لبوابة الفروع/ }).click();
        await page.waitForTimeout(500);
        // Should show branch cards (which are buttons with text)
        const branchCards = page.locator('button').filter({ has: page.locator('h3') });
        const count = await branchCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('branch selection has ROOT login link', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.getByRole('button', { name: /الدخول لبوابة الفروع/ }).click();
        await page.waitForTimeout(500);
        const rootBtn = page.getByRole('button', { name: /دخول مدير النظام المركزي/ });
        await expect(rootBtn).toBeVisible();
    });

    test('selecting a branch navigates to login', async ({ page }) => {
        await page.goto('/welcome', { waitUntil: 'networkidle', timeout: 30_000 });
        await page.getByRole('button', { name: /الدخول لبوابة الفروع/ }).click();
        await page.waitForTimeout(500);
        // Click first branch
        const firstBranch = page.locator('button').filter({ has: page.locator('h3') }).first();
        await firstBranch.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/login');
        expect(page.url()).toContain('branch=');
    });
});
