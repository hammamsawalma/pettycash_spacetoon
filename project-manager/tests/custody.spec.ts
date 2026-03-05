import { test, expect, Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'admin@pocket.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
}

test.describe('Custody (العهدة) Flow', () => {

    test('Custody ledger page (/deposits) loads for ADMIN', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/deposits');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/deposits');
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(bodyText).not.toContain('application error');
        expect(bodyText).not.toContain('client-side exception');
    });

    test('My Custodies page loads for employee with custody', async ({ page }) => {
        // Login directly as emp1 (has active custody from seed)
        await page.goto('/login');
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });
        await page.fill('input[name="email"]', 'emp1@pocket.com');
        await page.fill('input[name="password"]', '123456');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
        await page.goto('/my-custodies');
        await page.waitForTimeout(1500);
        expect(page.url()).toContain('/my-custodies');
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(bodyText).not.toContain('client-side exception');
    });

    test('Deposits ledger shows content for ADMIN', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/deposits');
        await page.waitForTimeout(2000);
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(bodyText.length).toBeGreaterThan(100);
    });
});
