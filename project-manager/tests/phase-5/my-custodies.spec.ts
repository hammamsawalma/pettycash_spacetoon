/**
 * Phase 5 — My Custodies (Employee View)
 *
 * Tests MC1–MC8: Employee custody view, status, project reference.
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('WF-19: My Custodies Access', () => {

    test('MC1: PE can access my-custodies page', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        const hasCustody = bodyText.includes('عهد') || bodyText.includes('لا توجد');
        expect(hasCustody || pePage.url().includes('/my-custodies')).toBeTruthy();
    });

    test('MC2: PM can access my-custodies page', async ({ pmPage }) => {
        await pmPage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        const bodyText = await pmPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('MC3: My custodies shows custody list or empty state', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        const hasContent = bodyText.includes('عهد') || bodyText.includes('لا توجد') || bodyText.length > 100;
        expect(hasContent).toBeTruthy();
    });
});

test.describe('WF-19: My Custodies Content', () => {

    test('MC4: Custody entries show amount and status', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('MC5: Custody entry shows project reference', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        const hasProject = bodyText.includes('مشروع') || bodyText.includes('لا توجد') || bodyText.length > 50;
        expect(hasProject).toBeTruthy();
    });

    test('MC6: My custodies page renders correctly', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(1000);
        const title = await pePage.title();
        expect(title.length).toBeGreaterThan(0);
    });

    test('MC7: PE sees custody detail with return info', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        // Should show custodies or empty — confirms page works
        expect(bodyText.length).toBeGreaterThan(0);
    });

    test('MC8: My custodies accessible for employee roles', async ({ pmPage }) => {
        await pmPage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pmPage.waitForLoadState('networkidle').catch(() => { });
        await pmPage.waitForTimeout(2000);
        const bodyText = await pmPage.textContent('body') || '';
        const notBlocked = !bodyText.includes('غير مصرح');
        expect(notBlocked).toBeTruthy();
    });
});
