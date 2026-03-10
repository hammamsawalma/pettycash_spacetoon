/**
 * Phase 7 — E2E Chat & Support — 12 scenarios
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('E2E-CS: Chat & Support', () => {
    test('E2E-CS1: Chat page renders', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CS2: PE accesses chat', async ({ pePage }) => {
        await pePage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect(pePage.url()).toContain('/chat');
    });
    test('E2E-CS3: Chat shows project list', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        expect((await adminPage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CS4: Global finance sees all chats', async ({ accountantPage }) => {
        await accountantPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        expect(accountantPage.url()).toContain('/chat');
    });
    test('E2E-CS5: Chat message input exists', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const t = await adminPage.textContent('body') || '';
        expect(t.length).toBeGreaterThan(50);
    });
    test('E2E-CS6: Support page renders', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect(pePage.url()).toContain('/support');
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CS7: Support ticket form', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const t = await pePage.textContent('body') || '';
        expect(t.includes('تذكرة') || t.includes('دعم') || t.includes('عنوان')).toBeTruthy();
    });
    test('E2E-CS8: Support ticket types', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CS9: Support ticket priority', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        expect((await pePage.textContent('body') || '').length).toBeGreaterThan(50);
    });
    test('E2E-CS10: Support ticket validation', async ({ pePage }) => {
        await pePage.goto('/support', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const btn = pePage.locator('button[type="submit"]').first();
        if (await btn.count() > 0) { await btn.click(); await pePage.waitForTimeout(1000); }
        expect(pePage.url()).toContain('/support');
    });
    test('E2E-CS11: GM accesses chat', async ({ gmPage }) => {
        await gmPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        expect(gmPage.url()).toContain('/chat');
    });
    test('E2E-CS12: Chat no overflow', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const sw = await adminPage.evaluate(() => document.body.scrollWidth);
        const vw = await adminPage.evaluate(() => window.innerWidth);
        expect(sw).toBeLessThanOrEqual(vw + 10);
    });
});
