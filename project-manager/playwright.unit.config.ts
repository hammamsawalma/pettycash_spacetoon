/**
 * Playwright config for UNIT TESTS only.
 * No browser launching — pure Node.js function tests.
 * No webServer needed.
 *
 * Usage: npx playwright test --config=playwright.unit.config.ts
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/unit',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: 'list',

    use: {
        // No browser, but playwright test runner still needs a baseURL placeholder
        baseURL: 'http://localhost:3000',
    },

    // No webServer — unit tests are pure function calls, no HTTP needed
    projects: [
        {
            name: 'unit',
            use: {},
        },
    ],
});
