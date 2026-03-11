import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { generateVerificationToken } from '../../src/lib/verification';

const prisma = new PrismaClient();

test.describe('Phase 10: Comprehensive Verification Portal Scenarios', () => {
    let testInvoiceId: string;
    let testInvoiceRef: string;
    let invoiceToken: string;

    let testPurchaseId: string;
    let testPurchaseOrder: string;
    let purchaseToken: string;

    test.beforeAll(async () => {
        // Find existing documents or create fallback ones
        const user = await prisma.user.findFirst();
        
        let invoice = await prisma.invoice.findFirst();
        if (!invoice) {
            invoice = await prisma.invoice.create({
                data: {
                    reference: `TEST-INV-${Date.now()}`,
                    amount: 500,
                    status: 'APPROVED',
                    type: 'PURCHASE',
                    paymentSource: 'CUSTODY',
                    creatorId: user!.id,
                }
            });
        }
        testInvoiceId = invoice.id;
        testInvoiceRef = invoice.reference;
        invoiceToken = generateVerificationToken(testInvoiceId);

        let purchase = await prisma.purchase.findFirst();
        if (!purchase) {
            purchase = await prisma.purchase.create({
                data: {
                    orderNumber: `TEST-PO-${Date.now()}`,
                    description: 'Test PO coverage',
                    amount: 1000,
                    status: 'APPROVED',
                    creatorId: user!.id,
                }
            });
        }
        testPurchaseId = purchase.id;
        testPurchaseOrder = purchase.orderNumber;
        purchaseToken = generateVerificationToken(testPurchaseId);
    });

    test('1. Security: Missing token should actively reject access', async ({ page }) => {
        await page.goto(`/verify/invoice/${testInvoiceRef}`);
        await expect(page.locator('text=معرّف التحقق مفقود')).toBeVisible();
    });

    test('2. Security: Unsupported document type should reject access', async ({ page }) => {
        await page.goto(`/verify/unknown/${testInvoiceRef}?token=${invoiceToken}`);
        await expect(page.locator('text=نوع المستند غير مدعوم')).toBeVisible();
    });

    test('3. Security: Forged or modified token should show tampered error', async ({ page }) => {
        // Appending 'X' to inherently invalidate HMAC verification
        await page.goto(`/verify/invoice/${testInvoiceRef}?token=${invoiceToken}X`);
        await expect(page.locator('text=/المستند مزوّر أو تم التلاعب بالرابط/i')).toBeVisible();
    });

    test('4. Security: Valid token footprint but non-existent DB document should fail gracefully', async ({ page }) => {
        // The token is cryptographically valid for ID "FAKE-123" but ID doesn't exist
        const fakeToken = generateVerificationToken("FAKE-123");
        await page.goto(`/verify/invoice/FAKE-123?token=${fakeToken}`);
        await expect(page.locator('text=هذا المستند غير موجود في النظام')).toBeVisible();
    });

    test('5. Data: Verify Purchase Invoice resolves correctly', async ({ page }) => {
        await page.goto(`/verify/invoice/${testInvoiceRef}?token=${invoiceToken}`);
        await expect(page.locator('text=مستند موثّق')).toBeVisible();
        await expect(page.locator('text=فاتورة مشتريات')).toBeVisible();
        await expect(page.locator(`text=${testInvoiceRef}`)).toBeVisible();
    });

    test('6. Data: Verify Purchase Request resolves correctly', async ({ page }) => {
        await page.goto(`/verify/purchase/${testPurchaseOrder}?token=${purchaseToken}`);
        await expect(page.locator('text=مستند موثّق')).toBeVisible();
        await expect(page.locator('text=طلب شراء')).toBeVisible();
        await expect(page.locator(`text=${testPurchaseOrder}`)).toBeVisible();
    });

    test('7. State: Unauthenticated users MUST NOT see internal system links', async ({ page }) => {
        await page.context().clearCookies();
        await page.goto(`/verify/purchase/${testPurchaseOrder}?token=${purchaseToken}`);
        await expect(page.locator('text=عرض التفاصيل كاملة في النظام')).not.toBeVisible();
    });

    test('8. State: Authenticated internal users CAN see internal system links and navigate back', async ({ browser }) => {
        // We use an admin session cached by 'auth.setup.ts' execution
        const context = await browser.newContext({ storageState: 'tests/.auth/admin.json' });
        const authPage = await context.newPage();

        await authPage.goto(`/verify/purchase/${testPurchaseOrder}?token=${purchaseToken}`);
        const link = authPage.locator('text=عرض التفاصيل كاملة في النظام');
        await expect(link).toBeVisible();

        await link.click();
        await expect(authPage).toHaveURL(new RegExp(`/purchases/${testPurchaseId}`));
        
        await context.close();
    });

    test('9. Internationalization: Translates completely to English properly', async ({ page }) => {
        await page.context().addCookies([{ name: 'NEXT_LOCALE', value: 'en', domain: 'localhost', path: '/' }]);
        await page.goto(`/verify/purchase/${testPurchaseOrder}?token=${purchaseToken}`);
        
        await expect(page.locator('text=Verified Document')).toBeVisible();
        await expect(page.locator('text=Purchase Request')).toBeVisible();
        await expect(page.locator('text=Total Amount')).toBeVisible();
    });
});
