/**
 * Auth Setup — logs in all 8 test accounts and saves sessions.
 * Uses existing seed data from `npx prisma db seed`.
 * Password for all: 123456
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');

const ACCOUNTS = {
    root: 'root@pocket.com',
    admin: 'admin@pocket.com',
    gm: 'gm@pocket.com',
    accountant: 'accountant@pocket.com',
    pe: 'emp1@pocket.com',
    pm: 'coordinator@pocket.com',
    pepm: 'emp2@pocket.com',
    outsider: 'emp3@pocket.com',
} as const;

const PASSWORD = '123456';

for (const [roleKey, email] of Object.entries(ACCOUNTS)) {
    setup(`authenticate as ${roleKey} (${email})`, async ({ page }) => {
        // Give extra time for first-run compilation
        setup.setTimeout(60_000);

        // Navigate to login and wait for full hydration
        await page.goto('/login', { waitUntil: 'networkidle' });

        // Wait for the form to be interactive (hydrated)
        await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 30_000 });

        // Clear and fill email
        const emailInput = page.locator('input[name="email"]');
        await emailInput.click();
        await emailInput.fill(email);

        // Clear and fill password
        const passInput = page.locator('input[name="password"]');
        await passInput.click();
        await passInput.fill(PASSWORD);

        // Click login button and wait for navigation
        await page.locator('button[type="submit"]').click();

        // Wait for redirect — use a broader match since the URL could be exactly '/' or '/dashboard'
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });

        // Verify we're logged in
        await expect(page).not.toHaveURL(/\/login/);

        // Save storage state
        await page.context().storageState({
            path: path.join(AUTH_DIR, `${roleKey}.json`),
        });
    });
}
