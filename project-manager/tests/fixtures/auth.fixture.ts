/**
 * Auth Fixtures — provides pre-authenticated Page objects for each role.
 *
 * Usage in tests:
 *   import { test, expect } from '../fixtures/auth.fixture';
 *   test('admin can access wallet', async ({ adminPage }) => { ... });
 *
 * Layer 0 (Super Admin):
 *   rootPage    → ROOT: manage all branches
 *
 * Layer 1 (System Roles):
 *   adminPage, gmPage, accountantPage
 *
 * Layer 2 (Project Roles — all are USER at system level):
 *   pePage      → PROJECT_EMPLOYEE only (invoices)
 *   pmPage      → PROJECT_MANAGER only (purchases)
 *   pepmPage    → PE+PM (both invoices & purchases)
 *   outsiderPage → No membership in Project 1
 */
import { test as base, type Page } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '..', '.auth');

type AuthFixtures = {
    rootPage: Page;
    adminPage: Page;
    gmPage: Page;
    accountantPage: Page;
    pePage: Page;
    pmPage: Page;
    pepmPage: Page;
    outsiderPage: Page;
};

export const test = base.extend<AuthFixtures>({
    rootPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'root.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    adminPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'admin.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    gmPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'gm.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    accountantPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'accountant.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    pePage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'pe.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    pmPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'pm.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    pepmPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'pepm.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
    outsiderPage: async ({ browser }, use) => {
        const ctx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'outsider.json') });
        const page = await ctx.newPage();
        await use(page);
        await ctx.close();
    },
});

export { expect } from '@playwright/test';
