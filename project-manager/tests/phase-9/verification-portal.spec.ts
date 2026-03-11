import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { generateVerificationToken } from '../../src/lib/verification';

const prisma = new PrismaClient();

test.describe('Verification Portal (Trust Portal)', () => {
    let testInvoiceId: string;
    let testInvoiceRef: string;
    let validToken: string;

    test.beforeAll(async () => {
        // Find an existing invoice or create a dummy one for the test
        const invoice = await prisma.invoice.findFirst();
        if (invoice) {
            testInvoiceId = invoice.id;
            testInvoiceRef = invoice.reference;
        } else {
            // Create a dummy user and invoice if db is completely empty (rare)
            const user = await prisma.user.findFirst();
            const newInvoice = await prisma.invoice.create({
                data: {
                    reference: `TEST-INV-${Date.now()}`,
                    amount: 500,
                    status: 'APPROVED',
                    type: 'PURCHASE',
                    paymentSource: 'CUSTODY',
                    creatorId: user!.id,
                }
            });
            testInvoiceId = newInvoice.id;
            testInvoiceRef = newInvoice.reference;
        }
        validToken = generateVerificationToken(testInvoiceId);
    });

    test('Missing token should show error', async ({ page }) => {
        await page.goto(`/verify/invoice/${testInvoiceRef}`);
        await expect(page.locator('text=معرّف التحقق مفقود')).toBeVisible();
    });

    test('Unsupported type should show error', async ({ page }) => {
        await page.goto(`/verify/unknown/${testInvoiceRef}?token=${validToken}`);
        await expect(page.locator('text=نوع المستند غير مدعوم')).toBeVisible();
    });

    test('Invalid token should show forged error', async ({ page }) => {
        await page.goto(`/verify/invoice/${testInvoiceRef}?token=invalid1234567890`);
        await expect(page.locator('text=المستند مزوّر أو تم التلاعب بالرابط')).toBeVisible();
    });

    test('Document not found should show error', async ({ page }) => {
        await page.goto(`/verify/invoice/NONEXISTENT-123?token=${validToken}`);
        await expect(page.locator('text=هذا المستند غير موجود في النظام')).toBeVisible();
    });

    test('Valid token as unauthenticated user shows document info without system link', async ({ page }) => {
        // Clear any auth cookies
        await page.context().clearCookies();

        await page.goto(`/verify/invoice/${testInvoiceRef}?token=${validToken}`);
        await expect(page.locator('text=مستند موثّق')).toBeVisible();
        await expect(page.locator(`text=${testInvoiceRef}`)).toBeVisible();
        
        // Ensure the internal link button is NOT present
        await expect(page.locator('text=عرض التفاصيل كاملة في النظام')).not.toBeVisible();
    });

    test('Valid token as authenticated user shows document info WITH system link', async ({ page, browser }) => {
        // User a pre-authenticated context from setup
        const context = await browser.newContext({ storageState: 'tests/.auth/admin.json' });
        const authPage = await context.newPage();

        await authPage.goto(`/verify/invoice/${testInvoiceRef}?token=${validToken}`);
        await expect(authPage.locator('text=مستند موثّق')).toBeVisible();
        await expect(authPage.locator(`text=${testInvoiceRef}`)).toBeVisible();

        // The system link SHOULD be visible for logged in staff
        const link = authPage.locator('text=عرض التفاصيل كاملة في النظام');
        await expect(link).toBeVisible();

        // Clicking it should navigate to the invoice details
        await link.click();
        await expect(authPage).toHaveURL(new RegExp(`/invoices/${testInvoiceId}`));
        
        await context.close();
    });

    test('English language handles correctly via cookie', async ({ page }) => {
        await page.context().addCookies([{
            name: 'NEXT_LOCALE',
            value: 'en',
            domain: 'localhost',
            path: '/',
        }]);

        await page.goto(`/verify/invoice/${testInvoiceRef}?token=${validToken}`);
        await expect(page.locator('text=Verified Document')).toBeVisible();
        await expect(page.locator('text=Purchase Invoice')).toBeVisible();
    });
});
