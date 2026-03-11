import { test, expect } from '../fixtures/auth.fixture';
import { PrismaClient } from '@prisma/client';

test.describe('WALLET-1: Manual Entries & Deposits', () => {
    const prisma = new PrismaClient();
    const depositNote = `E2E Manual Deposit ${Date.now()}`;
    const depositAmount = '7500';

    test.beforeAll(async () => {
        // Ensure accountant has GLOBAL_ACCOUNTANT role to manage the wallet
        await prisma.user.updateMany({
            where: { email: 'accountant@pocket.com' },
            data: { role: 'GLOBAL_ACCOUNTANT' }
        });
    });

    test.afterAll(async () => {
        // Find the wallet entry and clean it up to keep the treasury pure
        const entry = await prisma.walletEntry.findFirst({
            where: { note: depositNote, type: 'DEPOSIT' }
        });

        if (entry) {
            await prisma.walletEntry.delete({ where: { id: entry.id } });
            await prisma.companyWallet.update({
                where: { id: entry.walletId },
                data: {
                    balance: { decrement: entry.amount },
                    totalIn: { decrement: entry.amount }
                }
            });
        }
        await prisma.$disconnect();
    });

    test('ACC-1: Accountant can view manual logs', async ({ accountantPage }) => {
        // 1. Check User Manual access (ACC view logic for /manual)
        await accountantPage.goto('/manual');
        await accountantPage.waitForLoadState('domcontentloaded');
        await expect(accountantPage.getByRole('heading', { name: /Project Management System Manual|دليل استخدام النظام/i })).toBeVisible();
    });

    test('ACC-2: Accountant can record manual deposits into the wallet', async ({ accountantPage }) => {
        // 2. Deposit into the company wallet
        await accountantPage.goto('/wallet');
        await accountantPage.waitForLoadState('domcontentloaded');
        
        // Click the 'Deposit to Wallet / إيداع رصيد' button
        await accountantPage.locator('a').filter({ hasText: /Deposit|إيداع/i }).first().click();

        // Assert we are on the deposit page and RBAC has not blocked us
        await expect(accountantPage.getByRole('heading', { name: /New Deposit|إيداع رصيد/i })).toBeVisible({ timeout: 15000 });

        // Fill form
        await accountantPage.locator('input[name="amount"]').fill(depositAmount);
        await accountantPage.locator('textarea[name="note"]').fill(depositNote);
        
        // Click Deposit
        await accountantPage.getByRole('button', { name: /Confirm & Deposit|تأكيد وإيداع/i }).click();

        // Wait for success toast and redirect to /wallet
        await expect(accountantPage.getByText(/Deposit successful|تم إيداع المبلغ بنجاح/i)).toBeVisible({ timeout: 15000 });
        await expect(accountantPage).toHaveURL(/.*\/wallet/);

        // 3. Verify it appears in the Wallet Ledger (/wallet)
        const walletLedgerCell = accountantPage.locator('td').filter({ hasText: depositNote }).first();
        await expect(walletLedgerCell).toBeVisible({ timeout: 10000 });

        // 4. Verify View Logic in /deposits (Transaction Logs)
        await accountantPage.goto('/deposits');
        await accountantPage.waitForLoadState('domcontentloaded');
        
        // Assert we are on the transactions log page
        await expect(accountantPage.getByRole('heading', { name: /Company Safe Operations Log|سجل عمليات خزنة الشركة/i })).toBeVisible();
        
        // Check if the deposit note is logged here
        const depositLogCell = accountantPage.locator('td').filter({ hasText: depositNote }).first();
        await expect(depositLogCell).toBeVisible({ timeout: 10000 });
    });
});
