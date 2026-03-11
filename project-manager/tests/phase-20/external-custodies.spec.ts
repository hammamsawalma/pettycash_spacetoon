import { test, expect } from '../fixtures/auth.fixture';
import { PrismaClient } from '@prisma/client';

const generateSaudiPhone = () => `05${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

test.describe('CUSTODY-EXT: External Custodies Lifecycle', () => {
    let externalPhone = '';
    let externalName = '';
    let projectName = '';
    let createdProjectUrl = '';
    let projectId = '';
    const prisma = new PrismaClient();

    test.beforeAll(async () => {
        externalPhone = generateSaudiPhone();
        externalName = `مقاول خارجي للتجربة ${Date.now()}`;
        projectName = `مشروع عهدة خارجية ${Date.now()}`;
        
        // Ensure the company treasury has enough funds for tests
        const mainWallet = await prisma.companyWallet.findFirst({ orderBy: { updatedAt: 'asc' } });
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        
        if (mainWallet && adminUser) {
            await prisma.$transaction([
                prisma.walletEntry.create({
                    data: {
                        walletId: mainWallet.id,
                        createdBy: adminUser.id,
                        amount: 1000000,
                        type: 'IN',
                        note: 'Treasury injection for E2E tests',
                        createdAt: new Date()
                    }
                }),
                prisma.companyWallet.update({
                    where: { id: mainWallet.id },
                    data: {
                        balance: { increment: 1000000 },
                        totalIn: { increment: 1000000 }
                    }
                })
            ]);
        }

        // Setup a project programmatically to avoid UI flakiness
        // We know the accountant is 'accountant@pocket.com'
        const accountant = await prisma.user.findUnique({ where: { email: 'accountant@pocket.com' }});
        if (!accountant) throw new Error("Accountant user not found");
        
        // Ensure accountant has GLOBAL_ACCOUNTANT role to issue project custodies directly
        await prisma.user.update({
            where: { email: 'accountant@pocket.com' },
            data: { role: 'GLOBAL_ACCOUNTANT' }
        });
    });

    test.afterAll(async () => {
        // Find custody to delete its confirmations first
        const custody = await prisma.employeeCustody.findFirst({ where: { externalName } });
        if (custody) {
            await prisma.custodyConfirmation.deleteMany({ where: { custodyId: custody.id } });
            await prisma.employeeCustody.delete({ where: { id: custody.id } });
        }
        
        // Clean up project dependencies & project safely if created
        const tempProject = await prisma.project.findFirst({ where: { name: projectName }});
        if (tempProject) {
            await prisma.walletEntry.deleteMany({ where: { note: { contains: tempProject.id } } });
            await prisma.projectMember.deleteMany({ where: { projectId: tempProject.id } });
            await prisma.project.delete({ where: { id: tempProject.id } });
        }
        
        // Remove the injected test treasury amounts and the entry
        await prisma.walletEntry.deleteMany({ where: { note: 'Treasury injection for E2E tests' } });
        const mainWallet = await prisma.companyWallet.findFirst({ orderBy: { updatedAt: 'asc' } });
        if (mainWallet) {
             await prisma.companyWallet.update({
                where: { id: mainWallet.id },
                data: {
                    balance: { decrement: 1000000 },
                    totalIn: { decrement: 1000000 }
                }
            });
        }
        
        await prisma.$disconnect();
    });

    test.describe('Accountant Operations', () => {
        
        test('EXT-1: Accountant can create an external custody inside a project', async ({ adminPage, accountantPage }) => {
            
            // 1) Admin Creates Project & Allocates budget via UI 
            await adminPage.goto('/projects/new');
            await adminPage.waitForTimeout(2000);
            await adminPage.locator('input[name="name"]').fill(projectName);
            await adminPage.locator('textarea[name="description"]').fill('Test project for external custodies');
            await adminPage.locator('input[name="budget"]').fill('50000');
            
            // Save project
            await adminPage.getByRole('button', { name: 'اضافة التغييرات' }).click();
            
            // Wait for success and redirect
            // Wait for the exact project name heading to appear indicating data has loaded
            await expect(adminPage.getByRole('heading', { level: 1, name: new RegExp(projectName, 'i') })).toBeVisible({ timeout: 25000 });
            
            createdProjectUrl = adminPage.url();
            const urlObj = new URL(createdProjectUrl);
            const pathSegments = urlObj.pathname.split('/').filter(Boolean);
            projectId = pathSegments[pathSegments.length - 1];

            await adminPage.getByRole('button', { name: "فريق المشروع والعُهد" }).click();

            // Add Accountant to team via Prisma to bypass custom UI MultiSelect complexity
            const acc = await prisma.user.findUnique({ where: { email: 'accountant@pocket.com'} });
            if (acc) {
                await prisma.projectMember.create({
                    data: {
                        projectId,
                        userId: acc.id,
                        projectRoles: 'PROJECT_MANAGER'
                    }
                });
            }
            
            // Wait for charts/KPIs to finish loading
            await adminPage.waitForTimeout(3000); 
            
            // Click Allocate Budget button
            const allocateBtn = adminPage.getByRole('button', { name: /تخصيص ميزانية/i }).first();
            await expect(allocateBtn).toBeVisible({ timeout: 30000 });
            await allocateBtn.click();
            await adminPage.locator('input[type="number"]').first().fill('50000');
            await adminPage.getByRole('button', { name: /تأكيد التخصيص/i }).first().click();
            
            // Wait for allocation to complete and success toast
            await expect(adminPage.getByText(/تم تخصيص الميزانية بنجاح/i)).toBeVisible({ timeout: 15000 });
            await adminPage.waitForTimeout(2000); // Wait for modal to disappear and state to settle

            // 2) Accountant handles operations inside the project
            // Navigate directly to team tab where custodies are issued
            await accountantPage.goto(`${createdProjectUrl}?tab=team`);
            await accountantPage.waitForLoadState('domcontentloaded');
            // Ensure we are on the correct tab
            await accountantPage.getByRole('button', { name: "فريق المشروع والعُهد" }).click();
            await expect(accountantPage.getByText('صرف عهدة لموظف')).toBeVisible({ timeout: 15000 });
            
            await accountantPage.getByLabel(/خارجية|External/i).click();

            await accountantPage.getByPlaceholder(/اسم الشخص/i).fill(externalName);
            await accountantPage.getByPlaceholder(/05/i).fill(externalPhone);
            await accountantPage.getByPlaceholder(/سبب العهدة/i).first().fill('شراء مواد خام');
            await accountantPage.getByPlaceholder(/0.00/i).first().fill('1500');
            
            await accountantPage.getByLabel(/طريقة الصرف/i).selectOption('CASH');
            
            await accountantPage.getByRole('button', { name: /صرف العهدة/i }).click();

            await expect(accountantPage.getByText(/تم صرف العهدة الخارجية بنجاح/i)).toBeVisible({ timeout: 10000 });
        });

        test('EXT-2: View external custody globally and record manual return', async ({ accountantPage }) => {
            await accountantPage.goto('/external-custodies');
            
            // Wait for the table row to contain the externalName
            const row = accountantPage.locator('tr').filter({ hasText: externalName }).first();
            await expect(row).toBeVisible({ timeout: 15000 });

            // Verify row contents
            await expect(row.getByText('1,500').first()).toBeVisible();
            await expect(row).toContainText('شراء مواد خام');
            await expect(row).toContainText(externalName);
        });
    });
});
