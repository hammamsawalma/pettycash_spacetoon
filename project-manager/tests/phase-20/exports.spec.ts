import { test, expect } from '../fixtures/auth.fixture';

// Helpers to get exports payload sizes via server actions directly for testing
// We don't interact with UI exclusively here since we want to check internal RBAC bounds on Server Actions.
// Since Playwright runs in a client node process, we can hit the server actions indirectly or just verify UI buttons logic.
// For true coverage, we'll verify UI presence and use the API or page routes directly.

test.describe('EXP: Exports & Reports Validation', () => {
    test.describe('Global Accountant Export Rights', () => {
        test('EXP-1: Accountant can view and interact with Export page', async ({ accountantPage }) => {
            await accountantPage.goto('/exports');
            await expect(accountantPage.getByRole('heading', { name: /مركز التصدير/i }).first()).toBeVisible();
            
            // Check for buttons by ID
            const invoiceExportBtn = accountantPage.locator('#export-invoices-excel');
            await expect(invoiceExportBtn).toBeVisible();
            
            const custodyExportBtn = accountantPage.locator('#export-custodies-excel');
            await expect(custodyExportBtn).toBeVisible();
            
            const walletExportBtn = accountantPage.locator('#export-wallet-excel');
            await expect(walletExportBtn).toBeVisible();
        });
        
        test('EXP-2: Accountant can export Invoices to Excel successfully', async ({ accountantPage }) => {
            await accountantPage.goto('/exports');
            const downloadPromise = accountantPage.waitForEvent('download', { timeout: 30000 });
            
            await accountantPage.locator('#export-invoices-excel').click();
            
            const download = await downloadPromise;
            // The file name uses the Arabic format depending on the locale, or English
            expect(download.suggestedFilename()).toMatch(/Invoices_Report|تقرير_الفواتير/);
            expect(download.suggestedFilename()).toContain('.xlsx');
        });
    });
    
    test.describe('RBAC Hard Negatives (Users blocked from exports)', () => {
        test('EXP-3: Project Employee (PE) is blocked from viewing Export page', async ({ pePage }) => {
            await pePage.goto('/exports');
            
            // Should be redirected back to dashboard or show 404
            await pePage.waitForURL(url => url.pathname === '/' || url.pathname.includes('/404') || url.pathname.includes('/login'));
        });
        
        test('EXP-4: Project Manager (PM) is blocked from viewing Export page', async ({ pmPage }) => {
            await pmPage.goto('/exports');
            
            await pmPage.waitForURL(url => url.pathname === '/' || url.pathname.includes('/404') || url.pathname.includes('/login'));
        });
    });
    
    test.describe('Admin Export Rights', () => {
        test('EXP-5: Admin can export Wallet to Excel successfully', async ({ adminPage }) => {
            await adminPage.goto('/exports');
            const downloadPromise = adminPage.waitForEvent('download', { timeout: 30000 });
            
            await adminPage.locator('#export-wallet-excel').click();
            
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/Wallet_Statement|كشف_حساب_الخزنة/);
            expect(download.suggestedFilename()).toContain('.xlsx');
        });
    });
});
