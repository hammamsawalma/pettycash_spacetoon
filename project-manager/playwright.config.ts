import { defineConfig, devices } from '@playwright/test';

const AUTH_DIR = './tests/.auth';

/**
 * Production build is the DEFAULT (much faster, no compilation overhead).
 * Set TEST_DEV=1 to use the dev server instead.
 *
 * Production mode: 0ms compile, 5-10x faster page loads.
 * Dev mode: 10-75s compile on first load, useful for debugging.
 */
const isDev = process.env.TEST_DEV === '1';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,

    /* Retry once locally to handle intermittent timeouts, twice in CI */
    retries: process.env.CI ? 2 : 1,

    /* 2 workers optimal for 16GB RAM; 1 in CI for stability */
    workers: process.env.CI ? 1 : 2,

    reporter: [['html'], ['list']],

    /* 45s default — prod build is fast, dev may need more */
    timeout: isDev ? 60_000 : 45_000,

    use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',

        /* Navigation & action timeouts */
        navigationTimeout: 30_000,
        actionTimeout: 15_000,
    },

    expect: {
        timeout: 15_000,
    },

    projects: [
        // ── Setup: login all 7 accounts and save sessions ──
        { name: 'setup', testMatch: /auth\.setup\.ts/ },

        // ── Main test suite (depends on setup) ──
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
        },

        // ── Mobile tests ──
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 14'] },
            dependencies: ['setup'],
            testMatch: /phase-6\/.*/,
        },
    ],

    webServer: {
        command: isDev ? 'npm run dev' : 'npm run start',
        url: 'http://localhost:3000',
        /* In prod mode, don't reuse — kill any existing dev server */
        reuseExistingServer: isDev,
        timeout: 120_000,
    },
});
