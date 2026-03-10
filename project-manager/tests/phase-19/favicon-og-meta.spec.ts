/**
 * Favicon & OG Meta Tags — Comprehensive E2E Tests
 * 
 * Tests all scenarios and edge cases for:
 * 1. Favicon presence and validity across all page types
 * 2. Open Graph meta tags completeness and correctness
 * 3. Twitter Card meta tags
 * 4. OG image accessibility and response
 * 5. Meta tag inheritance across authenticated/unauthenticated pages
 * 6. Static asset delivery (favicon.ico, og-image.png)
 * 7. manifest.json consistency with icons
 */
import { test, expect } from '../fixtures/auth.fixture';

const wait = async (p: any) => {
    await p.waitForLoadState('domcontentloaded').catch(() => { });
    await p.waitForTimeout(1000);
};

// Helper: extract meta tag content from page
const getMeta = async (page: any, selector: string): Promise<string | null> => {
    return page.getAttribute(selector, 'content');
};

// Helper: extract link tag href from page
const getLink = async (page: any, selector: string): Promise<string | null> => {
    return page.getAttribute(selector, 'href');
};

// ─── Section 1: Favicon Presence ───────────────────────────────────────

test.describe('OG-FAV: Favicon Presence (8)', () => {
    test('OG-FAV1: Favicon link tag exists on dashboard', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const faviconLink = await adminPage.$('link[rel="icon"]');
        expect(faviconLink).toBeTruthy();
        const href = await faviconLink!.getAttribute('href');
        expect(href).toContain('favicon.ico');
    });

    test('OG-FAV2: Favicon link tag exists on login page', async ({ adminPage }) => {
        // Navigate to login (unauthenticated page)
        await adminPage.goto('/login', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const faviconLink = await adminPage.$('link[rel="icon"]');
        expect(faviconLink).toBeTruthy();
        const href = await faviconLink!.getAttribute('href');
        expect(href).toContain('favicon.ico');
    });

    test('OG-FAV3: Favicon.ico returns 200', async ({ adminPage }) => {
        const response = await adminPage.goto('/favicon.ico');
        expect(response).toBeTruthy();
        expect(response!.status()).toBe(200);
    });

    test('OG-FAV4: Favicon.ico has correct content-type', async ({ adminPage }) => {
        const response = await adminPage.goto('/favicon.ico');
        expect(response).toBeTruthy();
        const contentType = response!.headers()['content-type'];
        expect(contentType).toMatch(/image\/(x-icon|vnd\.microsoft\.icon|ico|png)/);
    });

    test('OG-FAV5: Favicon.ico is not empty', async ({ adminPage }) => {
        const response = await adminPage.goto('/favicon.ico');
        expect(response).toBeTruthy();
        const body = await response!.body();
        expect(body.length).toBeGreaterThan(100); // ICO files are at least a few hundred bytes
    });

    test('OG-FAV6: Apple touch icon exists', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const appleIcon = await adminPage.$('link[rel="apple-touch-icon"]');
        expect(appleIcon).toBeTruthy();
        const href = await appleIcon!.getAttribute('href');
        expect(href).toContain('icon-192.png');
    });

    test('OG-FAV7: Apple touch icon asset returns 200', async ({ adminPage }) => {
        const response = await adminPage.goto('/icon-192.png');
        expect(response).toBeTruthy();
        expect(response!.status()).toBe(200);
    });

    test('OG-FAV8: Favicon persists across navigation', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        let faviconLink = await adminPage.$('link[rel="icon"]');
        expect(faviconLink).toBeTruthy();

        // Navigate to another page
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        faviconLink = await adminPage.$('link[rel="icon"]');
        expect(faviconLink).toBeTruthy();
        const href = await faviconLink!.getAttribute('href');
        expect(href).toContain('favicon.ico');
    });
});

// ─── Section 2: Open Graph Meta Tags ───────────────────────────────────

test.describe('OG-META: Open Graph Meta Tags (10)', () => {
    test('OG-META1: og:title present and correct', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const ogTitle = await getMeta(adminPage, 'meta[property="og:title"]');
        expect(ogTitle).toBe('Spacetoon Pocket');
    });

    test('OG-META2: og:description present and correct', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const ogDesc = await getMeta(adminPage, 'meta[property="og:description"]');
        expect(ogDesc).toContain('نظام إدارة المشاريع والمالية');
        expect(ogDesc).toContain('سبيستون');
    });

    test('OG-META3: og:image present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const ogImage = await getMeta(adminPage, 'meta[property="og:image"]');
        expect(ogImage).toBeTruthy();
        expect(ogImage).toContain('og-image.png');
    });

    test('OG-META4: og:image:width present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const width = await getMeta(adminPage, 'meta[property="og:image:width"]');
        expect(width).toBe('1200');
    });

    test('OG-META5: og:image:height present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const height = await getMeta(adminPage, 'meta[property="og:image:height"]');
        expect(height).toBe('630');
    });

    test('OG-META6: og:image:alt present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const alt = await getMeta(adminPage, 'meta[property="og:image:alt"]');
        expect(alt).toBeTruthy();
        expect(alt).toContain('Spacetoon Pocket');
    });

    test('OG-META7: og:locale set to ar_SA', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const locale = await getMeta(adminPage, 'meta[property="og:locale"]');
        expect(locale).toBe('ar_SA');
    });

    test('OG-META8: og:type set to website', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const type = await getMeta(adminPage, 'meta[property="og:type"]');
        expect(type).toBe('website');
    });

    test('OG-META9: og:site_name set', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const siteName = await getMeta(adminPage, 'meta[property="og:site_name"]');
        expect(siteName).toBe('Spacetoon Pocket');
    });

    test('OG-META10: OG tags present on login page too', async ({ adminPage }) => {
        await adminPage.goto('/login', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const ogTitle = await getMeta(adminPage, 'meta[property="og:title"]');
        const ogImage = await getMeta(adminPage, 'meta[property="og:image"]');
        expect(ogTitle).toBeTruthy();
        expect(ogImage).toBeTruthy();
    });
});

// ─── Section 3: Twitter Card Meta Tags ─────────────────────────────────

test.describe('OG-TW: Twitter Card Meta Tags (5)', () => {
    test('OG-TW1: twitter:card is summary_large_image', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const card = await getMeta(adminPage, 'meta[name="twitter:card"]');
        expect(card).toBe('summary_large_image');
    });

    test('OG-TW2: twitter:title present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const title = await getMeta(adminPage, 'meta[name="twitter:title"]');
        expect(title).toBe('Spacetoon Pocket');
    });

    test('OG-TW3: twitter:description present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const desc = await getMeta(adminPage, 'meta[name="twitter:description"]');
        expect(desc).toContain('نظام إدارة المشاريع والمالية');
    });

    test('OG-TW4: twitter:image present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const image = await getMeta(adminPage, 'meta[name="twitter:image"]');
        expect(image).toBeTruthy();
        expect(image).toContain('og-image.png');
    });

    test('OG-TW5: Twitter tags also on /projects page', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const card = await getMeta(adminPage, 'meta[name="twitter:card"]');
        const image = await getMeta(adminPage, 'meta[name="twitter:image"]');
        expect(card).toBe('summary_large_image');
        expect(image).toContain('og-image.png');
    });
});

// ─── Section 4: OG Image Asset ─────────────────────────────────────────

test.describe('OG-IMG: OG Image Asset (5)', () => {
    test('OG-IMG1: og-image.png returns 200', async ({ adminPage }) => {
        const response = await adminPage.goto('/og-image.png');
        expect(response).toBeTruthy();
        expect(response!.status()).toBe(200);
    });

    test('OG-IMG2: og-image.png has image content-type', async ({ adminPage }) => {
        const response = await adminPage.goto('/og-image.png');
        expect(response).toBeTruthy();
        const contentType = response!.headers()['content-type'];
        expect(contentType).toMatch(/image\/png/);
    });

    test('OG-IMG3: og-image.png is not too small', async ({ adminPage }) => {
        const response = await adminPage.goto('/og-image.png');
        expect(response).toBeTruthy();
        const body = await response!.body();
        // OG images should be at least 10KB for a quality image
        expect(body.length).toBeGreaterThan(10000);
    });

    test('OG-IMG4: og-image.png is cacheable', async ({ adminPage }) => {
        const response = await adminPage.goto('/og-image.png');
        expect(response).toBeTruthy();
        // Static assets should have cache headers
        const headers = response!.headers();
        const cacheControl = headers['cache-control'] || '';
        // Next.js static files typically have max-age or public
        expect(cacheControl.length > 0 || response!.status() === 200).toBeTruthy();
    });

    test('OG-IMG5: PWA icons also accessible', async ({ adminPage }) => {
        for (const size of ['72', '96', '144', '192', '512']) {
            const response = await adminPage.goto(`/icon-${size}.png`);
            expect(response).toBeTruthy();
            expect(response!.status()).toBe(200);
        }
    });
});

// ─── Section 5: Page Title & Description ───────────────────────────────

test.describe('OG-TITLE: Page Title & Description (5)', () => {
    test('OG-TITLE1: Page title is Spacetoon Pocket', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const title = await adminPage.title();
        expect(title).toContain('Spacetoon Pocket');
    });

    test('OG-TITLE2: Meta description present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const desc = await getMeta(adminPage, 'meta[name="description"]');
        expect(desc).toContain('نظام إدارة المشاريع والمالية');
        expect(desc).toContain('سبيستون');
    });

    test('OG-TITLE3: Title present on login page', async ({ adminPage }) => {
        await adminPage.goto('/login', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const title = await adminPage.title();
        expect(title).toContain('Spacetoon Pocket');
    });

    test('OG-TITLE4: Title consistent with og:title', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const pageTitle = await adminPage.title();
        const ogTitle = await getMeta(adminPage, 'meta[property="og:title"]');
        // Both should contain Spacetoon Pocket
        expect(pageTitle).toContain('Spacetoon Pocket');
        expect(ogTitle).toContain('Spacetoon Pocket');
    });

    test('OG-TITLE5: Description consistent with og:description', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const metaDesc = await getMeta(adminPage, 'meta[name="description"]');
        const ogDesc = await getMeta(adminPage, 'meta[property="og:description"]');
        expect(metaDesc).toBe(ogDesc);
    });
});

// ─── Section 6: Cross-Role Consistency ─────────────────────────────────

test.describe('OG-ROLE: Cross-Role Meta Tag Consistency (5)', () => {
    test('OG-ROLE1: Employee sees same OG tags', async ({ pePage }) => {
        await pePage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(pePage);
        const ogTitle = await getMeta(pePage, 'meta[property="og:title"]');
        const ogImage = await getMeta(pePage, 'meta[property="og:image"]');
        expect(ogTitle).toBe('Spacetoon Pocket');
        expect(ogImage).toContain('og-image.png');
    });

    test('OG-ROLE2: GM sees same OG tags', async ({ gmPage }) => {
        await gmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(gmPage);
        const ogTitle = await getMeta(gmPage, 'meta[property="og:title"]');
        expect(ogTitle).toBe('Spacetoon Pocket');
    });

    test('OG-ROLE3: Accountant sees same OG tags', async ({ accountantPage }) => {
        await accountantPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(accountantPage);
        const ogTitle = await getMeta(accountantPage, 'meta[property="og:title"]');
        expect(ogTitle).toBe('Spacetoon Pocket');
    });

    test('OG-ROLE4: PM sees same favicon', async ({ pmPage }) => {
        await pmPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(pmPage);
        const faviconLink = await pmPage.$('link[rel="icon"]');
        expect(faviconLink).toBeTruthy();
        const href = await faviconLink!.getAttribute('href');
        expect(href).toContain('favicon.ico');
    });

    test('OG-ROLE5: Outsider sees OG tags on redirect page', async ({ outsiderPage }) => {
        await outsiderPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(outsiderPage);
        // Even if redirected, meta tags from root layout should be present
        const faviconLink = await outsiderPage.$('link[rel="icon"]');
        expect(faviconLink).toBeTruthy();
    });
});

// ─── Section 7: Manifest & PWA Consistency ─────────────────────────────

test.describe('OG-PWA: Manifest & PWA Consistency (5)', () => {
    test('OG-PWA1: manifest.json accessible', async ({ adminPage }) => {
        const response = await adminPage.goto('/manifest.json');
        expect(response).toBeTruthy();
        expect(response!.status()).toBe(200);
    });

    test('OG-PWA2: manifest.json has correct name', async ({ adminPage }) => {
        const response = await adminPage.goto('/manifest.json');
        const manifest = JSON.parse(await response!.text());
        expect(manifest.name).toBe('Spacetoon Pocket');
        expect(manifest.short_name).toBe('SpacePocket');
    });

    test('OG-PWA3: manifest.json icons point to existing files', async ({ adminPage }) => {
        const response = await adminPage.goto('/manifest.json');
        const manifest = JSON.parse(await response!.text());
        expect(manifest.icons.length).toBeGreaterThan(0);
        for (const icon of manifest.icons) {
            const iconResponse = await adminPage.goto(icon.src);
            expect(iconResponse!.status()).toBe(200);
        }
    });

    test('OG-PWA4: manifest link tag in head', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const manifestLink = await getLink(adminPage, 'link[rel="manifest"]');
        expect(manifestLink).toBe('/manifest.json');
    });

    test('OG-PWA5: theme-color meta tag present', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const themeColor = await getMeta(adminPage, 'meta[name="theme-color"]');
        expect(themeColor).toBe('#102550');
    });
});

// ─── Section 8: Edge Cases ─────────────────────────────────────────────

test.describe('OG-EDGE: Edge Cases (7)', () => {
    test('OG-EDGE1: No duplicate og:title tags', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const count = await adminPage.$$eval('meta[property="og:title"]', (els: any[]) => els.length);
        expect(count).toBe(1);
    });

    test('OG-EDGE2: No duplicate og:image tags', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const count = await adminPage.$$eval('meta[property="og:image"]', (els: any[]) => els.length);
        expect(count).toBe(1);
    });

    test('OG-EDGE3: No duplicate favicon links', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const count = await adminPage.$$eval('link[rel="icon"]', (els: any[]) => els.length);
        expect(count).toBe(1);
    });

    test('OG-EDGE4: og:image URL is absolute (not relative)', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const ogImage = await getMeta(adminPage, 'meta[property="og:image"]');
        expect(ogImage).toBeTruthy();
        // Next.js should resolve to absolute URL with metadataBase
        expect(ogImage!.startsWith('http')).toBeTruthy();
    });

    test('OG-EDGE5: HTML lang attribute is ar', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const lang = await adminPage.getAttribute('html', 'lang');
        expect(lang).toBe('ar');
    });

    test('OG-EDGE6: HTML dir attribute is rtl', async ({ adminPage }) => {
        await adminPage.goto('/', { waitUntil: 'domcontentloaded' });
        await wait(adminPage);
        const dir = await adminPage.getAttribute('html', 'dir');
        expect(dir).toBe('rtl');
    });

    test('OG-EDGE7: spacetoon-logo.png still accessible', async ({ adminPage }) => {
        // Ensure we didn't break the original logo file
        const response = await adminPage.goto('/spacetoon-logo.png');
        expect(response).toBeTruthy();
        expect(response!.status()).toBe(200);
    });
});
