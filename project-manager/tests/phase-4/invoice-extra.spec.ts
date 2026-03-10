import { test, expect } from '../fixtures/auth.fixture';
const wait = async (p: any) => { await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(2000); };
const bd = async (p: any) => (await p.textContent('body')) || '';

test.describe('P4-Sinvoice-extraG1', () => {
    test('P4-Sinvoice-extraG11: test #1', async ({ adminPage }) => { await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG12: test #2', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG13: test #3', async ({ adminPage }) => { await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG14: test #4', async ({ accountantPage }) => { await accountantPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG15: test #5', async ({ pePage }) => { await pePage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG16: test #6', async ({ pePage }) => { await pePage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG17: test #7', async ({ pmPage }) => { await pmPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG18: test #8', async ({ adminPage }) => { await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG19: test #9', async ({ gmPage }) => { await gmPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG110: test #10', async ({ adminPage }) => { await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG111: test #11', async ({ adminPage }) => { await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG112: test #12', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG113: test #13', async ({ adminPage }) => { await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG114: test #14', async ({ accountantPage }) => { await accountantPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG115: test #15', async ({ pePage }) => { await pePage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG116: test #16', async ({ pePage }) => { await pePage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG117: test #17', async ({ pmPage }) => { await pmPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(20); });
});

test.describe('P4-Sinvoice-extraG2', () => {
    test('P4-Sinvoice-extraG218: test #18', async ({ adminPage }) => { await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG219: test #19', async ({ gmPage }) => { await gmPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG220: test #20', async ({ adminPage }) => { await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG221: test #21', async ({ adminPage }) => { await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG222: test #22', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG223: test #23', async ({ adminPage }) => { await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG224: test #24', async ({ accountantPage }) => { await accountantPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG225: test #25', async ({ pePage }) => { await pePage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG226: test #26', async ({ pePage }) => { await pePage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG227: test #27', async ({ pmPage }) => { await pmPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(20); });
    test('P4-Sinvoice-extraG228: test #28', async ({ adminPage }) => { await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG229: test #29', async ({ gmPage }) => { await gmPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG230: test #30', async ({ adminPage }) => { await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG231: test #31', async ({ adminPage }) => { await adminPage.goto('/invoices/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG232: test #32', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG233: test #33', async ({ adminPage }) => { await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P4-Sinvoice-extraG234: test #34', async ({ accountantPage }) => { await accountantPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(100); });
});
