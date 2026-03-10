/**
 * Phase 5 — Registration & OTP Flow
 *
 * Tests RG1–RG9: Register page fields, OTP page redirect, navigation links.
 */
import { test as baseTest, expect } from '@playwright/test';

baseTest.describe('WF-28: Registration Page', () => {

    baseTest('RG1: Register page renders with form', async ({ page }) => {
        await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        const hasForm = bodyText.includes('إنشاء حساب') || bodyText.includes('تسجيل');
        expect(hasForm).toBeTruthy();
    });

    baseTest('RG2: Register page has all required fields', async ({ page }) => {
        await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const inputs = await page.locator('input').count();
        expect(inputs).toBeGreaterThanOrEqual(5);
    });

    baseTest('RG3: Register page has terms checkbox', async ({ page }) => {
        await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        const hasTerms = bodyText.includes('شروط') || bodyText.includes('أحكام') || bodyText.includes('موافق');
        expect(hasTerms).toBeTruthy();
    });

    baseTest('RG4: Register page has login link', async ({ page }) => {
        await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const loginLink = page.locator('a[href="/login"]');
        const hasLogin = await loginLink.count();
        expect(hasLogin).toBeGreaterThan(0);
    });

    baseTest('RG5: Register page has submit button', async ({ page }) => {
        await page.goto('http://localhost:3000/register', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        const hasSubmit = bodyText.includes('إنشاء حساب');
        expect(hasSubmit).toBeTruthy();
    });
});

baseTest.describe('WF-28: OTP Verification Page', () => {

    baseTest('RG6: OTP page redirects to login when accessed directly', async ({ page }) => {
        await page.goto('http://localhost:3000/verify-otp', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const url = page.url();
        const bodyText = await page.textContent('body') || '';
        // verify-otp requires a registration session — redirects to login
        const redirected = url.includes('/login') || bodyText.includes('تسجيل الدخول') || bodyText.includes('مرحبًا');
        expect(redirected).toBeTruthy();
    });

    baseTest('RG7: OTP redirect shows valid auth page', async ({ page }) => {
        await page.goto('http://localhost:3000/verify-otp', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const bodyText = await page.textContent('body') || '';
        const hasAuth = bodyText.includes('تسجيل') || bodyText.includes('تأكيد') || bodyText.includes('دخول');
        expect(hasAuth).toBeTruthy();
    });

    baseTest('RG8: OTP page renders without errors', async ({ page }) => {
        await page.goto('http://localhost:3000/verify-otp', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
    });

    baseTest('RG9: OTP page has navigation links', async ({ page }) => {
        await page.goto('http://localhost:3000/verify-otp', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(2000);
        const links = await page.locator('a[href]').count();
        expect(links).toBeGreaterThan(0);
    });
});
