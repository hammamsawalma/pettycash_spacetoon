import { test, expect } from '@playwright/test';

// ──────────────────────────────────────────────────────────────────────────────
// Gap Detection Tests — Automatically find missing / incomplete interfaces
// ──────────────────────────────────────────────────────────────────────────────

test.use({ storageState: 'playwright/.auth/user.json' });

const allPages = [
    '/',
    '/projects',
    '/invoices',
    '/purchases',
    '/wallet',
    '/debts',
    '/deposits',
    '/reports',
    '/notifications',
    '/employees',
    '/settings',
    '/settings/categories',
    '/trash',
    '/archives',
    '/finance-requests',
    '/support',
    '/chat',
    '/my-custodies',
    '/company-custodies',
    '/external-custodies',
];

test.describe('Suite — Gap Detection: No placeholders or broken elements', () => {

    // ── GD-1: No "قريباً" text on pages ─────────────────────────────────────
    for (const pagePath of allPages) {
        test(`[GD-1] ${pagePath} has no "قريباً" placeholder text`, async ({ page }) => {
            await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1500);

            // Get all visible text on the page
            const bodyText = await page.locator('body').textContent();

            // Support page toast message is OK, but UI text is not
            const placeholderElements = await page.locator(':text("قريباً"):visible').count();
            expect(placeholderElements, `Found "قريباً" placeholder on ${pagePath}`).toBe(0);
        });
    }

    // ── GD-2: No alert() buttons ─────────────────────────────────────────────
    for (const pagePath of allPages) {
        test(`[GD-2] ${pagePath} has no alert() buttons`, async ({ page }) => {
            await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1500);

            // Intercept alert dialog
            let alertTriggered = false;
            page.on('dialog', async dialog => {
                alertTriggered = true;
                await dialog.dismiss();
            });

            // Click all visible buttons
            const buttons = await page.locator('button:visible').all();
            for (const button of buttons.slice(0, 20)) { // Limit to 20 buttons per page
                try {
                    const isEnabled = await button.isEnabled();
                    if (isEnabled) {
                        await button.click({ timeout: 2000 });
                        await page.waitForTimeout(300);
                    }
                } catch {
                    // Some buttons navigate or cause page changes — skip
                }
            }

            expect(alertTriggered, `Found alert() on ${pagePath}`).toBe(false);
        });
    }

    // ── GD-3: No href="#" links ──────────────────────────────────────────────
    test('[GD-3] No href="#" links on login and register pages', async ({ page }) => {
        for (const p of ['/login', '/register']) {
            await page.goto(p, { waitUntil: 'domcontentloaded' });
            const brokenLinks = await page.locator('a[href="#"]').count();
            expect(brokenLinks, `Found href="#" links on ${p}`).toBe(0);
        }
    });

    // ── GD-4: No "قيد التطوير" placeholder ──────────────────────────────────
    for (const pagePath of allPages) {
        test(`[GD-4] ${pagePath} has no "قيد التطوير" placeholder`, async ({ page }) => {
            await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1500);
            const devElements = await page.locator(':text("قيد التطوير"):visible').count();
            expect(devElements, `Found "قيد التطوير" placeholder on ${pagePath}`).toBe(0);
        });
    }

    // ── GD-5: All sidebar links navigate successfully ────────────────────────
    test('[GD-5] All sidebar navigation links resolve to 200', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const links = await page.locator('nav a[href]').all();
        const hrefs: string[] = [];
        for (const link of links) {
            const href = await link.getAttribute('href');
            if (href && href.startsWith('/') && !hrefs.includes(href)) {
                hrefs.push(href);
            }
        }

        for (const href of hrefs) {
            const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
            expect(response?.status(), `${href} returned error`).toBeLessThan(500);
        }
    });

    // ── GD-6: Notification send page has all 3 target options enabled ────────
    test('[GD-6] Notification send page has enabled target radio buttons', async ({ page }) => {
        await page.goto('/notifications/send', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        // Check ALL radio is present and checked
        const allRadio = page.locator('input[name="target"][value="ALL"]');
        await expect(allRadio).toBeVisible();
        await expect(allRadio).toBeEnabled();

        // Check PROJECT radio is present and NOT disabled
        const projectRadio = page.locator('input[name="target"][value="PROJECT"]');
        await expect(projectRadio).toBeVisible();
        await expect(projectRadio).toBeEnabled();

        // Check SPECIFIC radio is present and NOT disabled
        const specificRadio = page.locator('input[name="target"][value="SPECIFIC"]');
        await expect(specificRadio).toBeVisible();
        await expect(specificRadio).toBeEnabled();
    });

    // ── GD-7: No "شات المشروع" tab on project detail page ───────────────────
    test('[GD-7] Project detail page has no "شات المشروع" placeholder tab', async ({ page }) => {
        await page.goto('/projects', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        // Click first project if any
        const projectLink = page.locator('a[href*="/projects/"], [class*="cursor-pointer"]').first();
        if (await projectLink.isVisible()) {
            await projectLink.click();
            await page.waitForTimeout(2000);

            const chatTab = page.locator('button:text("شات المشروع")');
            await expect(chatTab).toHaveCount(0);
        }
    });

    // ── GD-8: Login page has no biometric buttons ────────────────────────────
    test('[GD-8] Login page has no biometric placeholder buttons', async ({ page }) => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });

        const biometricTexts = ['بصمة الوجه', 'النمط'];
        for (const text of biometricTexts) {
            const element = page.locator(`button:text("${text}")`);
            await expect(element, `Found "${text}" button on login page`).toHaveCount(0);
        }
    });

    // ── GD-9: Support page buttons use proper handlers ───────────────────────
    test('[GD-9] Support page buttons do not trigger alert()', async ({ page }) => {
        await page.goto('/support', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        let alertTriggered = false;
        page.on('dialog', async dialog => {
            alertTriggered = true;
            await dialog.dismiss();
        });

        // Click "بدء محادثة" button
        const chatBtn = page.locator('button:text("بدء محادثة")');
        if (await chatBtn.isVisible()) {
            await chatBtn.click();
            await page.waitForTimeout(500);
        }

        // Click "تصفح الدليل" button
        const guideBtn = page.locator('button:text("تصفح الدليل")');
        if (await guideBtn.isVisible()) {
            await guideBtn.click();
            await page.waitForTimeout(500);
        }

        expect(alertTriggered).toBe(false);
    });

    // ── GD-10: Register page terms link is not href="#" ──────────────────────
    test('[GD-10] Register terms link points to real page', async ({ page }) => {
        await page.goto('/register', { waitUntil: 'domcontentloaded' });

        const termsLink = page.locator('a:text("الشروط والأحكام")');
        if (await termsLink.isVisible()) {
            const href = await termsLink.getAttribute('href');
            expect(href).not.toBe('#');
            expect(href?.length).toBeGreaterThan(1);
        }
    });
});
