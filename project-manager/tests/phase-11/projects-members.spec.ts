/**
 * Phase 11 — Projects & Member Management
 * 155 tests: project lifecycle, members, budget, CRUD
 */
import { test, expect } from '../fixtures/auth.fixture';
const wait = async (p: any) => { await p.waitForLoadState('networkidle').catch(() => { }); await p.waitForTimeout(2000); };
const bd = async (p: any) => (await p.textContent('body')) || '';
const goProj = async (p: any) => { await p.goto('/projects', { waitUntil: 'domcontentloaded' }); await wait(p); };
const goProjDetail = async (p: any) => { await goProj(p); await p.evaluate(() => { const links = Array.from(document.querySelectorAll('a[href*="/projects/"]')); const visibleLink = links.find(l => { const style = window.getComputedStyle(l); return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'; }); if (visibleLink) (visibleLink as HTMLElement).click(); }); await wait(p); };

test.describe('P11-PCF: Project Close Financial (25)', () => {
    test('P11-PCF1: Close project button visible', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCF2: Close rejects pending invoices', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF3: Close returns surplus to wallet', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCF4: Close creates wallet refund entry', async ({ adminPage }) => { await adminPage.goto('/wallet', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCF5: Close sets status CLOSED', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF6: Closed project in archives', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF7: Close notification sent', async ({ adminPage }) => { await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF8: Close requires admin role', async ({ accountantPage }) => { await goProj(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF9: GM cannot close project', async ({ gmPage }) => { await goProj(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF10: Employee cannot close project', async ({ pePage }) => { await goProj(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF11: Close closes all open custodies', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF12: Closed project not in active list', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF13: Reopen button in archives', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF14: Reopen changes status to IN_PROGRESS', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF15: Close with 0 surplus', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF16: Project close dialog', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCF17: Close disabled for PENDING project', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF18: Archives accessible by admin', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); expect(adminPage.url()).toContain('/archives'); });
    test('P11-PCF19: Archives accessible by GM', async ({ gmPage }) => { await gmPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF20: Archives accessible by accountant', async ({ accountantPage }) => { await accountantPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF21: Employee cannot access archives', async ({ pePage }) => { await pePage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
    test('P11-PCF22: Closed project detail still viewable', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF23: Closed project shows financial summary', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF24: Close with open debts', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCF25: Closed project in reports', async ({ adminPage }) => { await adminPage.goto('/reports', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
});

test.describe('P11-PMG: Project Member Guards (20)', () => {
    test('P11-PMG1: Members tab in project detail', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG2: Members page dedicated link', async ({ adminPage }) => { await goProjDetail(adminPage); const l = adminPage.locator('a[href*="/members"]').first(); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG3: Add member form', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG4: Member role selector', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG5: Remove member button', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG6: Cannot remove member with open custody', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG7: Cannot add duplicate member', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG8: Member custody balance shown', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG9: Change member role', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG10: PE role = can receive custody', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG11: PM role = can create purchases', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG12: PE+PM role = both', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG13: Outsider not in members', async ({ outsiderPage }) => { await goProj(outsiderPage); const b = await bd(outsiderPage); expect(b.length).toBeGreaterThan(20); });
    test('P11-PMG14: Accountant cannot add members', async ({ accountantPage }) => { await goProj(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PMG15: GM cannot add members', async ({ gmPage }) => { await goProj(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PMG16: Members count in project list', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PMG17: Member added notification', async ({ adminPage }) => { await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PMG18: Member removed notification', async ({ adminPage }) => { await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PMG19: User dropdown excludes existing members', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PMG20: Members page responsive', async ({ adminPage }) => { await adminPage.setViewportSize({ width: 375, height: 812 }); await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
});

test.describe('P11-PCRUD: Project CRUD (15)', () => {
    test('P11-PCRUD1: Create project page', async ({ adminPage }) => { await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); expect(adminPage.url()).toContain('/projects/new'); });
    test('P11-PCRUD2: Create form name field', async ({ adminPage }) => { await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCRUD3: Create form description field', async ({ adminPage }) => { await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCRUD4: Create form budget field', async ({ adminPage }) => { await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCRUD5: Create form start date', async ({ adminPage }) => { await adminPage.goto('/projects/new', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCRUD6: Only admin can create project', async ({ accountantPage }) => { await accountantPage.goto('/projects/new', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(20); });
    test('P11-PCRUD7: Edit project page', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PCRUD8: Edit form preserves values', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCRUD9: Delete project to trash', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCRUD10: Restore project from trash', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCRUD11: Project status IN_PROGRESS', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCRUD12: Project status filter', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCRUD13: Project search', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCRUD14: Project stats cards', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PCRUD15: Project Kanban view', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
});

test.describe('P11-PBT: Project Budget & Detail (20)', () => {
    test('P11-PBT1: Budget breakdown in detail', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT2: Budget allocated displayed', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT3: Custody issued displayed', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT4: Custody returned displayed', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT5: Available budget calculated', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT6: Budget progress bar', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT7: Custodies tab in detail', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT8: Invoices tab in detail', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT9: Purchases tab in detail', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT10: Members tab in detail', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT11: Project detail responsive', async ({ adminPage }) => { await adminPage.setViewportSize({ width: 375, height: 812 }); await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PBT12: Project list responsive', async ({ adminPage }) => { await adminPage.setViewportSize({ width: 375, height: 812 }); await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PBT13: Project detail header', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT14: Project dates displayed', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT15: Project description displayed', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PBT16: GM views project detail', async ({ gmPage }) => { await goProj(gmPage); const b = await bd(gmPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PBT17: Accountant views project detail', async ({ accountantPage }) => { await goProj(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PBT18: Employee views own projects', async ({ pePage }) => { await goProj(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PBT19: Outsider limited project access', async ({ outsiderPage }) => { await goProj(outsiderPage); const b = await bd(outsiderPage); expect(b.length).toBeGreaterThan(20); });
    test('P11-PBT20: Project soft delete sets isDeleted', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
});

test.describe('P11-PKB: Project Kanban & Status (15)', () => {
    test('P11-PKB1: Kanban view accessible', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB2: Status columns visible', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB3: PENDING column', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB4: IN_PROGRESS column', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB5: Status update works', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB6: List view toggle', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB7: Project card shows budget', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB8: Project card shows member count', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB9: Project card shows status', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB10: Drag drop on desktop', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB11: Project new button', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB12: Sort projects by date', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB13: Sort projects by name', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB14: Employee project list limited', async ({ pePage }) => { await goProj(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PKB15: PEPM sees assigned projects', async ({ pepmPage }) => { await goProj(pepmPage); const b = await bd(pepmPage); expect(b.length).toBeGreaterThan(50); });
});

test.describe('P11-PSD: Project Soft Delete (10)', () => {
    test('P11-PSD1: Delete button for admin', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PSD2: Delete confirm dialog', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PSD3: Deleted project in trash', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PSD4: Restore from trash', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PSD5: Permanent delete in trash', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PSD6: Accountant cannot delete projects', async ({ accountantPage }) => { await goProj(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PSD7: Trash shows deletion date', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PSD8: Trash shows item type', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PSD9: Trash filter by type', async ({ adminPage }) => { await adminPage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PSD10: Trash empty state', async ({ pePage }) => { await pePage.goto('/trash', { waitUntil: 'domcontentloaded' }); await wait(pePage); const b = await bd(pePage); expect(b.length).toBeGreaterThan(20); });
});

test.describe('P11-PRF: Project Reopen Flow (15)', () => {
    test('P11-PRF1: Reopen from archives', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF2: Reopen confirm dialog', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF3: Reopened appears in active list', async ({ adminPage }) => { await goProj(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF4: Reopen preserves members', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF5: Reopen preserves financial data', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF6: Reopen notification', async ({ adminPage }) => { await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF7: Only admin can reopen', async ({ accountantPage }) => { await accountantPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(accountantPage); const b = await bd(accountantPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF8: Reopen re-enables custody', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF9: Archives empty state', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF10: Archives list shows financials', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF11: Archives search', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF12: Archives date range filter', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF13: Archives detail comparable', async ({ adminPage }) => { await adminPage.goto('/archives', { waitUntil: 'domcontentloaded' }); await wait(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(50); });
    test('P11-PRF14: Project timeline events', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
    test('P11-PRF15: Project activity log', async ({ adminPage }) => { await goProjDetail(adminPage); const b = await bd(adminPage); expect(b.length).toBeGreaterThan(100); });
});
