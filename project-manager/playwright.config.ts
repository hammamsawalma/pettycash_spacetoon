import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    /* 2 workers everywhere — sharding handles CI load distribution */
    workers: 2,

    reporter: [['html'], ['list']],

    /* CI runners are slower — give extra time */
    timeout: isCI ? 90_000 : isDev ? 60_000 : 45_000,

    use: {
        baseURL: 'http://localhost:3000',
        screenshot: 'only-on-failure',
        video: isCI ? 'off' : 'retain-on-failure',
        trace: isCI ? 'off' : 'retain-on-failure',

        /* Navigation & action timeouts */
        navigationTimeout: isCI ? 45_000 : 30_000,
        actionTimeout: isCI ? 20_000 : 15_000,
    },

    expect: {
        timeout: isCI ? 20_000 : 15_000,
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
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
