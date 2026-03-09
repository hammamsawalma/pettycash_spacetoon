import { defineConfig, devices } from '@playwright/test';

const AUTH_DIR = './tests/.auth';

/**
 * Use production server when TEST_PROD=1 is set.
 * Production mode eliminates on-the-fly compilation (0ms compile vs 10-75s in dev).
 */
const isProd = process.env.TEST_PROD === '1';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,

    /* Retry once locally to handle intermittent timeouts, twice in CI */
    retries: process.env.CI ? 2 : 1,

    /* 2 workers optimal for 16GB RAM; 1 in CI for stability */
    workers: process.env.CI ? 1 : 2,

    reporter: [['html'], ['list']],

    /* 60s default timeout — generous enough for slow dev server */
    timeout: 60_000,

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
        command: isProd ? 'npm run start' : 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
