import { test, expect } from '../../fixtures/api.fixture';
import { expenseAmountScenarios } from '../../test-data/expense-data';
import { ExpensesPage } from '../../pages/ExpensesPage';

test.describe('E2E: Data-Driven Expenses Validation', () => {
    test.describe('Admin Actions', () => {
        test.use({ storageState: 'tests/.auth/root.json' });

        for (const scenario of expenseAmountScenarios) {
            test(`Expense Creation Data Integrity: ${scenario.scenario} (${scenario.amount})`, async ({ db, testUser, testProject, page }) => {
                const expensesPage = new ExpensesPage(page);

                // Navigate to the form to test actual boundary logic
                await page.goto(`/projects/${testProject.id}?tab=team`);
                await page.waitForLoadState('networkidle');

                // Select Employee & Project
                // Using the UI to fill out the form
                await page.screenshot({ path: `test-results/debug-form-${scenario.amount}.png`, fullPage: true });
                
                // Debug the DOM before failing
                const selectHtml = await page.locator('#employee-select').innerHTML();
                console.log(`[DEBUG] #employee-select innerHTML:`, selectHtml);
                
                // Select by value just to be absolutely deterministic
                await page.locator('#employee-select').selectOption({ value: testUser.id }, { force: true, timeout: 5000 });
                // Method is CASH by default
                await page.locator('#custody-method').selectOption({ value: 'CASH' }, { force: true, timeout: 5000 });
                
                // Input the amount - Must scope to the form to avoid hidden modal inputs
                try {
                    await page.locator('form', { hasText: /صرف العهدة|Issue Custody/ }).locator('input[type="number"]').fill(String(scenario.amount));
                } catch (e) {
                    // Playwright throws if we try to fill 'abc' into a native number input
                    if (scenario.expectedBehavior === 'validation_error') return; else throw e;
                }
                
                await page.getByPlaceholder(/سبب صرف العهدة|Custody reason/i).fill(`E2E Test: ${scenario.scenario}`);
                
                // Submit
                await page.getByRole('button', { name: /صرف العهدة|Issue Custody/i }).click();

                if (scenario.expectedBehavior === 'validation_error') {
                    // Testing API boundary rejection
                    // Either the form blocks it (HTML5 invalid), or an error toast appears
                    const isFormNativeBlocked = await page.locator('input[type="number"]:invalid').isVisible();
                    
                    // If the browser form validator didn't block it, an error toast will appear
                    if (!isFormNativeBlocked) {
                         await expect(page.locator('text=/صالح|أكبر من صفر|Please enter a valid amount|ميزانية|أقل|يجب أن يكون|Error|حدث خطأ/i').first()).toBeVisible();
                    }
                } else {
                    // Testing Happy Path
                    await expect(page.locator('text=/تم صرف العهدة بنجاح|Custody issued successfully/i')).toBeVisible();
                    
                    // Verify entry hit the DB successfully
                    const savedCustody = await db.employeeCustody.findFirst({
                        where: { note: `E2E Test: ${scenario.scenario}` }
                    });
                    expect(savedCustody).toBeDefined();

                    // Clean up data using Fixture DB directly to prevent bleeding
                    if (savedCustody) {
                        await db.employeeCustody.delete({ where: { id: savedCustody.id } });
                    }
                }
            });
        }
    });

    test.describe('Employee Actions', () => {
        test.use({ storageState: 'tests/.auth/pm.json' });
        
        test('Race Condition/Real-time Verification: Total Balance Consistency', async ({ db, testUser, testProject, page }) => {
            // Create an official custody
            const initialCustody = await db.employeeCustody.create({
                data: {
                    amount: 5000,
                    balance: 5000,
                    method: 'CASH',
                    employeeId: testUser.id,
                    projectId: testProject.id,
                    isConfirmed: true, // Auto-confirm for this test
                }
            });

            await page.goto('/my-custodies');
            
            // Ensure "Remaining" reflects exactly the 5,000 balance
            await expect(page.locator('text=/المتبقي|Remaining/i').locator('..').locator('text=5,000').first()).toBeVisible();

            // 2. Simulate partial spend from this custody
            await db.employeeCustody.update({
                where: { id: initialCustody.id },
                data: { balance: 3500 }
            });

            // Refresh and check real-time state calculation updates dynamically
            await page.goto('/my-custodies');
            await expect(page.locator('text=/المتبقي|Remaining/i').locator('..').locator('text=3,500').first()).toBeVisible();
            await expect(page.locator('text=/تم صرف|Spent/i').locator('text=1,500').first()).toBeVisible();

            // Cleanup
            await db.employeeCustody.delete({ where: { id: initialCustody.id } });
        });
    });
});

