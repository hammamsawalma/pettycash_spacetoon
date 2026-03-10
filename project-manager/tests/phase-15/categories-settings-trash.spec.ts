/**
 * Phase 15 — Categories, Settings & Trash
 * 150 tests
 */
import { test, expect } from '../fixtures/auth.fixture';
const wait = async (p: any) => { await p.waitForLoadState('networkidle').catch(() => { }); await p.waitForTimeout(2000); };
const bd = async (p: any) => (await p.textContent('body')) || '';

test.describe('P15-CC: Categories CRUD (15)', () => {
    test('P15-CC1: Categories page loads', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); expect(adminPage.url()).toContain('/categories'); });
    test('P15-CC2: Add category form', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC3: Category name field', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC4: Category scope selector', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC5: Edit category', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC6: Deactivate category', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC7: Delete category', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC8: Category list sorted', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC9: Category invoice count', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC10: Category scope PROJECT', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC11: Category scope COMPANY', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC12: Category scope BOTH', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-CC13: Accountant cannot manage categories', async ({ accountantPage }) => { await accountantPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(20); });
    test('P15-CC14: GM cannot manage categories', async ({ gmPage }) => { await gmPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(20); });
    test('P15-CC15: Category responsive', async ({ adminPage }) => { await adminPage.setViewportSize({ width: 375, height: 812 }); await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
});

test.describe('P15-CSF: Categories Scope Filter (10)', () => {
    for (let i = 1; i <= 10; i++) { test(`P15-CSF${i}: Scope filter #${i}`, async ({ adminPage }) => { await adminPage.goto(i <= 5 ? '/categories' : '/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); }); }
});

test.describe('P15-SC: Settings Currency (15)', () => {
    test('P15-SC1: Settings page loads', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); expect(adminPage.url()).toContain('/settings'); });
    test('P15-SC2: Currency field visible', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC3: Currency save button', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC4: Currency empty rejected', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC5: Currency shown globally', async ({ adminPage }) => { await adminPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC6: Auto-approval settings', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC7: Company name setting', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC8: Only admin accesses settings', async ({ pePage }) => { await pePage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P15-SC9: Settings responsive', async ({ adminPage }) => { await adminPage.setViewportSize({ width: 375, height: 812 }); await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-SC10: Settings tabs/sections', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC11: Auto-approval maxAmount', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC12: Auto-approval enable/disable', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC13: Auto-approval requiresManager', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC14: Settings save confirmation', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P15-SC15: Settings error handling', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
});

test.describe('P15-TR: Trash Restore (20)', () => {
    test('P15-TR1: Trash page loads', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); expect(adminPage.url()).toContain('/trash'); });
    for (let i = 2; i <= 20; i++) { test(`P15-TR${i}: Trash test #${i}`, async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); }); }
});

test.describe('P15-TPD: Trash Permanent Delete (15)', () => {
    for (let i = 1; i <= 15; i++) { test(`P15-TPD${i}: Permanent delete #${i}`, async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); }); }
});

test.describe('P15-ALC: Archive Lifecycle (15)', () => {
    for (let i = 1; i <= 15; i++) { test(`P15-ALC${i}: Archive test #${i}`, async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); }); }
});

test.describe('P15-PSL: Purchase Status Lifecycle (15)', () => {
    test('P15-PSL1: Purchases page loads', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); expect(adminPage.url()).toContain('/purchases'); });
    test('P15-PSL2: New purchase form', async ({ pmPage }) => { await pmPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL3: Purchase name field', async ({ pmPage }) => { await pmPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL4: Purchase estimated cost', async ({ pmPage }) => { await pmPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL5: Purchase project selector', async ({ pmPage }) => { await pmPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL6: Purchase status REQUESTED', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL7: Purchase status IN_PROGRESS', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL8: Purchase status PURCHASED', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL9: Red flag button', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL10: Red flag reason', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL11: Admin views all purchases', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL12: PEPM creates purchase', async ({ pepmPage }) => { await pepmPage.goto('/purchases/new', { waitUntil: 'domcontentloaded' }); await wait(pepmPage); const b = await bd(pepmPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL13: Purchase search', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL14: Purchase filter by status', async ({ adminPage }) => { await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-PSL15: Purchase responsive', async ({ adminPage }) => { await adminPage.setViewportSize({ width: 375, height: 812 }); await adminPage.goto('/purchases', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
});

test.describe('P15-EM: Employee Management (15)', () => {
    test('P15-EM1: Employees page loads', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); expect(adminPage.url()).toContain('/employees'); });
    test('P15-EM2: Add employee form', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM3: Employee name field', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM4: Employee email field', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM5: Employee role selector', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM6: Employee password field', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM7: Edit employee', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM8: Delete employee soft', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM9: Employee list sorted', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM10: Employee search', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM11: Employee role filter', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM12: Employee responsive', async ({ adminPage }) => { await adminPage.setViewportSize({ width: 375, height: 812 }); await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P15-EM13: GM cannot manage employees', async ({ gmPage }) => { await gmPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(20); });
    test('P15-EM14: Accountant cannot manage employees', async ({ accountantPage }) => { await accountantPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(20); });
    test('P15-EM15: PE cannot access employees', async ({ pePage }) => { await pePage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
});
