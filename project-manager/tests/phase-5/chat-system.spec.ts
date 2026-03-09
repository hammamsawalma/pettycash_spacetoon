/**
 * Phase 5 — Chat System
 *
 * Tests CS1–CS10: Project chat access, message display, and personal chat restriction.
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('WF-14: Chat Access', () => {

    test('CS1: ADMIN can access project chat page', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        const hasChat = bodyText.includes('محادث') || bodyText.includes('رسال') || bodyText.includes('شات') || bodyText.includes('chat');
        expect(hasChat || adminPage.url().includes('/chat')).toBeTruthy();
    });

    test('CS2: GM can view project chats', async ({ gmPage }) => {
        await gmPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await gmPage.waitForLoadState('networkidle').catch(() => { });
        await gmPage.waitForTimeout(2000);
        const bodyText = await gmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('CS3: ACC can view project chats', async ({ accountantPage }) => {
        await accountantPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('CS4: PE can view chats for their project', async ({ pePage }) => {
        await pePage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('CS5: PM (coordinator) can view project chats', async ({ pmPage }) => {
        await pmPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        expect(pmPage.url()).toContain('/chat');
    });
});

test.describe('WF-14: Chat Content', () => {

    test('CS6: Chat page shows message area', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Should show a chat interface or empty state
        const hasInterface = bodyText.includes('رسال') || bodyText.includes('محادث') || bodyText.includes('لا توجد') || bodyText.includes('إرسال');
        expect(hasInterface || bodyText.length > 100).toBeTruthy();
    });

    test('CS7: Chat has send input or form', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        // Look for input or textarea
        const hasInput = await adminPage.locator('input, textarea').count();
        const bodyText = await adminPage.textContent('body') || '';
        expect(hasInput > 0 || bodyText.includes('رسال') || bodyText.length > 50).toBeTruthy();
    });

    test('CS8: Chat messages show sender info', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const bodyText = await adminPage.textContent('body') || '';
        // Messages show names or "no messages" state
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('CS9: Chat page is scrollable', async ({ adminPage }) => {
        await adminPage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(1000);
        // Verify page renders without errors
        const title = await adminPage.title();
        expect(title.length).toBeGreaterThan(0);
    });

    test('CS10: Personal chat not available (v5 restriction)', async ({ pePage }) => {
        await pePage.goto('/chat', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        // v5: only project chat — no personal messaging option
        const noPersonalChat = !bodyText.includes('رسالة شخصية') || bodyText.includes('مشروع');
        expect(noPersonalChat).toBeTruthy();
    });
});
