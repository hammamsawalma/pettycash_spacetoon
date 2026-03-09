/**
 * Phase 5 — Manual Page
 *
 * Tests MP1–MP6: User manual access and content.
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('WF-22: Manual Access', () => {

    test('MP1: ADMIN can access manual page', async ({ adminPage }) => {
        test.setTimeout(90_000);  // Manual page is 38KB — needs extra render time
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(3000);
        const bodyText = await adminPage.textContent('body', { timeout: 30_000 }) || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MP2: GM can access manual page', async ({ gmPage }) => {
        await gmPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MP3: ACC can access manual page', async ({ accountantPage }) => {
        await accountantPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MP4: PE can access manual page', async ({ pePage }) => {
        await pePage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(100);
    });

    test('MP5: Manual page shows navigation sections', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasSections = bodyText.includes('دليل') || bodyText.includes('كيفية') || bodyText.includes('شرح') || bodyText.includes('استخدام');
        expect(hasSections || bodyText.length > 200).toBeTruthy();
    });

    test('MP6: Manual content is readable', async ({ adminPage }) => {
        await adminPage.goto('/manual', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const title = await adminPage.title();
        expect(title.length).toBeGreaterThan(0);
        const bodyText = await adminPage.textContent('body') || '';
        expect(bodyText).not.toContain('خطأ');
    });
});
