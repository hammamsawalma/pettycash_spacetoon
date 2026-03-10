/**
 * Mobile Auth Fixtures — provides pre-authenticated Page objects with iPhone 14 viewport.
 *
 * Usage in mobile tests:
 *   import { test, expect } from '../fixtures/mobile-auth.fixture';
 *   test('bottom nav visible', async ({ adminPage }) => { ... });
 *
 * All pages are set to iPhone 14 viewport: 390×844, deviceScaleFactor: 3, isMobile: true.
 */
import { test as base, type Page, devices } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '..', '.auth');
const iPhone14 = devices['iPhone 14'];

type MobileAuthFixtures = {
    adminPage: Page;
    gmPage: Page;
    accountantPage: Page;
    pePage: Page;
    pmPage: Page;
    pepmPage: Page;
    outsiderPage: Page;
};

export const test = base.extend<MobileAuthFixtures>({
    adminPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'admin.json'), ...iPhone14 });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    gmPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'gm.json'), ...iPhone14 });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    accountantPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'accountant.json'), ...iPhone14 });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    pePage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'pe.json'), ...iPhone14 });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    pmPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'pm.json'), ...iPhone14 });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    pepmPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'pepm.json'), ...iPhone14 });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    outsiderPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'outsider.json'), ...iPhone14 });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
});

export { expect } from '@playwright/test';
