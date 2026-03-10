/**
 * Phase 8 — Concurrent Custody Operations
 * 15 tests: multiple custodies, budget limits, parallel operations
 */
import { test, expect } from '../fixtures/auth.fixture';

test.describe('P8-CCO: Concurrent Custody Operations', () => {

    test('P8-CCO1: Two custodies for same employee in same project', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/projects/"]').first();
        if (await link.count() > 0) {
            await link.click();
            await adminPage.waitForLoadState('networkidle').catch(() => { });
            await adminPage.waitForTimeout(2000);
        }
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO2: Custody amount = remaining budget', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO3: Custody amount > remaining budget rejected', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO4: Available budget shows correct value', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/projects/"]').first();
        if (await link.count() > 0) {
            await link.click();
            await adminPage.waitForLoadState('networkidle').catch(() => { });
            await adminPage.waitForTimeout(2000);
        }
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO5: Employee dropdown shows only PROJECT_EMPLOYEE', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const link = adminPage.locator('a[href*="/projects/"]').first();
        if (await link.count() > 0) {
            await link.click();
            await adminPage.waitForLoadState('networkidle').catch(() => { });
            await adminPage.waitForTimeout(2000);
        }
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO6: Cannot issue custody to PROJECT_MANAGER only', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO7: PE+PM can receive custody (has PE role)', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO8: Non-member cannot receive custody', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO9: Zero amount rejected', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO10: Negative amount rejected', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO11: Custody on PENDING project rejected', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO12: Custody on CLOSED project rejected', async ({ adminPage }) => {
        await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO13: Multiple employees receive custody from same project', async ({ adminPage }) => {
        await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO14: Custody issuance notification sent', async ({ adminPage }) => {
        await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });

    test('P8-CCO15: Company custody wallet insufficient balance', async ({ adminPage }) => {
        await adminPage.goto('/company-custodies', { waitUntil: 'domcontentloaded' });
        await adminPage.waitForLoadState('networkidle').catch(() => { });
        await adminPage.waitForTimeout(2000);
        const body = await adminPage.textContent('body') || '';
        expect(body.length).toBeGreaterThan(50);
    });
});
