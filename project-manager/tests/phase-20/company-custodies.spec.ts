import { test, expect } from '../fixtures/auth.fixture';
import { PrismaClient } from '@prisma/client';

test.describe('CUSTODY-COMP: Company Custodies Lifecycle', () => {
    let companyCustodyNote = '';
    const prisma = new PrismaClient();

    test.beforeAll(async () => {
        companyCustodyNote = `E2E Company Expense ${Date.now()}`;
        
        // Ensure the company treasury has enough funds for tests
        const mainWallet = await prisma.companyWallet.findFirst({ orderBy: { updatedAt: 'asc' } });
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        
        if (mainWallet && adminUser) {
            await prisma.$transaction([
                prisma.walletEntry.create({
                    data: {
                        walletId: mainWallet.id,
                        createdBy: adminUser.id,
                        amount: 10000,
                        type: 'IN',
                        note: 'Treasury injection for Company Custodies E2E',
                        createdAt: new Date()
                    }
                }),
                prisma.companyWallet.update({
                    where: { id: mainWallet.id },
                    data: {
                        balance: { increment: 10000 },
                        totalIn: { increment: 10000 }
                    }
                })
            ]);
        }
        
        // Ensure accountant has GLOBAL_ACCOUNTANT role to access company custodies
        await prisma.user.updateMany({
            where: { email: 'accountant@pocket.com' },
            data: { role: 'GLOBAL_ACCOUNTANT' }
        });
    });

    test.afterAll(async () => {
        // Find custody to delete its confirmations and returns first
        const custody = await prisma.employeeCustody.findFirst({ where: { note: companyCustodyNote, isCompanyExpense: true } });
        if (custody) {
            await prisma.custodyConfirmation.deleteMany({ where: { custodyId: custody.id } });
            await prisma.custodyReturn.deleteMany({ where: { custodyId: custody.id } });
            await prisma.employeeCustody.delete({ where: { id: custody.id } });
        }
        
        // Remove the injected test treasury amounts and the entry
        await prisma.walletEntry.deleteMany({ where: { note: 'Treasury injection for Company Custodies E2E' } });
        const mainWallet = await prisma.companyWallet.findFirst({ orderBy: { updatedAt: 'asc' } });
        if (mainWallet) {
             await prisma.companyWallet.update({
                where: { id: mainWallet.id },
                data: {
                    balance: { decrement: 10000 },
                    totalIn: { decrement: 10000 }
                }
            });
        }
        
        await prisma.$disconnect();
    });

    test.describe('Accountant Operations', () => {
        
        test('COMP-1: Accountant can issue and close a generic company administrative custody', async ({ accountantPage }) => {
            
            // 1) Accountant creates company custody
            await accountantPage.goto('/company-custodies');
            await accountantPage.waitForLoadState('domcontentloaded');
            
            // Click Issue Company Expense Custody
            await accountantPage.locator('button').filter({ hasText: /صرف عهدة مصاريف شركة|Issue Company Expense Custody/i }).first().click();

            // Select the accountant user (we select the first option which is usually themselves if they are the only accountant)
            // It's a select dropdown named employeeId
            const selectLocator = accountantPage.locator('select[name="employeeId"]');
            await expect(selectLocator).toBeVisible();
            
            // Get all options and select the last one assuming there is at least one accountant
            // We use JS explicitly to choose the first valid non-empty value
            await selectLocator.evaluate((select: HTMLSelectElement) => {
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].value !== "") {
                        select.selectedIndex = i;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        break;
                    }
                }
            });

            await accountantPage.locator('input[name="amount"]').fill('2000');
            await accountantPage.locator('select[name="method"]').selectOption('CASH');
            await accountantPage.locator('textarea[name="note"]').fill(companyCustodyNote);
            
            await accountantPage.getByRole('button', { name: /صرف العهدة|Issue Custody/i }).click();

            // Wait for success toast
            await expect(accountantPage.getByText(/تم صرف عهدة مصاريف الشركة بنجاح|Company expense custody issued/i)).toBeVisible({ timeout: 15000 });
            
            // Wait for the modal/form to disappear and layout to refresh
            await accountantPage.waitForTimeout(2000);

            // 2) Accountant records manual return
            // Find the card containing our unique note
            // Actually, in the UI it's a Card component inside a grid.
            // But wait, the class is not explicit, let's just find the parent containing the text.
            const cardLocator = accountantPage.locator('div').filter({ hasText: companyCustodyNote }).locator('.flex.justify-end').first();
            
            // Click Record Return
            await cardLocator.locator('button').filter({ hasText: /تسجيل مرتجع|Record Return/i }).first().click();

            // Modal should appear
            await expect(accountantPage.getByRole('heading', { name: /تسجيل مرتجع مصاريف|Record Expenses Return/i })).toBeVisible({ timeout: 5000 });

            // Fill full return amount
            await accountantPage.locator('input[name="amount"]').fill('2000');
            await accountantPage.locator('textarea[name="note"]').fill('Returned entirely, test over');
            
            await accountantPage.getByRole('button', { name: /تأكيد المرتجع|Confirm Return/i }).click();

            // Verify success
            await expect(accountantPage.getByText(/تم تسجيل المرتجع بنجاح|Return recorded successfully/i)).toBeVisible({ timeout: 15000 });

        });
    });
});
