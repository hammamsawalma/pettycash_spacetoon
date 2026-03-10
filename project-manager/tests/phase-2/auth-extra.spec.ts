import { test, expect } from '../fixtures/auth.fixture';
const wait = async (p: any) => { await p.waitForLoadState('networkidle').catch(() => {}); await p.waitForTimeout(2000); };
const bd = async (p: any) => (await p.textContent('body')) || '';

test.describe('P2-Sauth-extraG1', () => {
    test('P2-Sauth-extraG11: test #1', async ({ adminPage }) => { await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG12: test #2', async ({ adminPage }) => { await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG13: test #3', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG14: test #4', async ({ adminPage }) => { await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG15: test #5', async ({ adminPage }) => { await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG16: test #6', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG17: test #7', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG18: test #8', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG19: test #9', async ({ gmPage }) => { await gmPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG110: test #10', async ({ accountantPage }) => { await accountantPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(100); });
});

test.describe('P2-Sauth-extraG2', () => {
    test('P2-Sauth-extraG211: test #11', async ({ pePage }) => { await pePage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG212: test #12', async ({ pmPage }) => { await pmPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG213: test #13', async ({ pepmPage }) => { await pepmPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(pepmPage); const b = await bd(pepmPage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG214: test #14', async ({ outsiderPage }) => { await outsiderPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(outsiderPage); const b = await bd(outsiderPage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG215: test #15', async ({ adminPage }) => { await adminPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG216: test #16', async ({ adminPage }) => { await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG217: test #17', async ({ adminPage }) => { await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG218: test #18', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG219: test #19', async ({ adminPage }) => { await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG220: test #20', async ({ adminPage }) => { await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
});

test.describe('P2-Sauth-extraG3', () => {
    test('P2-Sauth-extraG321: test #21', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG322: test #22', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG323: test #23', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG324: test #24', async ({ gmPage }) => { await gmPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG325: test #25', async ({ accountantPage }) => { await accountantPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG326: test #26', async ({ pePage }) => { await pePage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG327: test #27', async ({ pmPage }) => { await pmPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(pmPage); const b = await bd(pmPage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG328: test #28', async ({ pepmPage }) => { await pepmPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(pepmPage); const b = await bd(pepmPage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG329: test #29', async ({ outsiderPage }) => { await outsiderPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(outsiderPage); const b = await bd(outsiderPage); expect(b.length).toBeGreaterThan(20); });
    test('P2-Sauth-extraG330: test #30', async ({ adminPage }) => { await adminPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
});

test.describe('P2-Sauth-extraG4', () => {
    test('P2-Sauth-extraG431: test #31', async ({ adminPage }) => { await adminPage.goto('/projects', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG432: test #32', async ({ adminPage }) => { await adminPage.goto('/invoices', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG433: test #33', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG434: test #34', async ({ adminPage }) => { await adminPage.goto('/debts', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG435: test #35', async ({ adminPage }) => { await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG436: test #36', async ({ adminPage }) => { await adminPage.goto('/employees', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG437: test #37', async ({ adminPage }) => { await adminPage.goto('/settings', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG438: test #38', async ({ adminPage }) => { await adminPage.goto('/categories', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG439: test #39', async ({ gmPage }) => { await gmPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(100); });
    test('P2-Sauth-extraG440: test #40', async ({ accountantPage }) => { await accountantPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(100); });
});

test.describe('P2-S-FINAL', () => {
    test('P2-S-FINAL1: Final check', async ({ adminPage }) => { await adminPage.goto('/', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
});
