/**
 * Phase 6 — Mobile List Pages
 *
 * Tests MLP1–MLP18: All list pages render correctly on iPhone 14.
 */
import { test, expect } from '../fixtures/mobile-auth.fixture';

const listPages = [
    { path: '/projects', name: 'Projects', id: 'MLP1' },
    { path: '/invoices', name: 'Invoices', id: 'MLP3' },
    { path: '/purchases', name: 'Purchases', id: 'MLP5' },
    { path: '/employees', name: 'Employees', id: 'MLP7' },
    { path: '/deposits', name: 'Deposits', id: 'MLP9' },
    { path: '/external-custodies', name: 'External Custodies', id: 'MLP10' },
    { path: '/debts', name: 'Debts', id: 'MLP12' },
    { path: '/archives', name: 'Archives', id: 'MLP13' },
    { path: '/trash', name: 'Trash', id: 'MLP15' },
    { path: '/notifications', name: 'Notifications', id: 'MLP16' },
];

test.describe('M6-07: Mobile List Pages — Rendering', () => {

    for (const { path, name, id } of listPages) {
        test(`${id}: ${name} list renders on mobile`, async ({ adminPage }) => {
            await adminPage.goto(path, { waitUntil: 'domcontentloaded' });
            await adminPage.waitForLoadState('networkidle').catch(() => { });
            await adminPage.waitForTimeout(2000);
            const bodyText = await adminPage.textContent('body') || '';
            expect(bodyText.length).toBeGreaterThan(50);
        });
    }
});

test.describe('M6-07: Mobile List Pages — No Overflow', () => {

    for (const { path, name } of listPages) {
        test(`${name} no horizontal overflow`, async ({ adminPage }) => {
            await adminPage.goto(path, { waitUntil: 'domcontentloaded' });
            await adminPage.waitForLoadState('networkidle').catch(() => { });
            await adminPage.waitForTimeout(2000);
            const scrollWidth = await adminPage.evaluate(() => document.body.scrollWidth);
            const viewportWidth = await adminPage.evaluate(() => window.innerWidth);
            expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
        });
    }
});

test.describe('M6-07: Mobile List Pages — Employee', () => {

    test('MLP-PE1: /my-custodies renders on mobile', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const bodyText = await pePage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });

    test('MLP-PE2: my-custodies no horizontal overflow', async ({ pePage }) => {
        await pePage.goto('/my-custodies', { waitUntil: 'domcontentloaded' });
        await pePage.waitForLoadState('networkidle').catch(() => { });
        await pePage.waitForTimeout(2000);
        const scrollWidth = await pePage.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await pePage.evaluate(() => window.innerWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 10);
    });

    test('MLP-PE3: /finance-requests renders on mobile', async ({ accountantPage }) => {
        await accountantPage.goto('/finance-requests', { waitUntil: 'domcontentloaded' });
        await accountantPage.waitForLoadState('networkidle').catch(() => { });
        await accountantPage.waitForTimeout(2000);
        const bodyText = await accountantPage.textContent('body') || '';
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
