import { test, expect } from '@playwright/test';
import prisma from '../../src/lib/prisma';
import crypto from 'crypto';

const createId = () => crypto.randomUUID();

test.describe('Print Views & PDF Voucher QR Codes Edge Cases', () => {
    test.use({ storageState: 'tests/.auth/admin.json' });

    let testPurchaseId: string;
    let testInvoiceId: string;
    let testInvoiceReference: string;
    let testPurchaseOrderNumber: string;
    let testProjectId: string;
    let fallbackUserName: string;

    test.beforeAll(async () => {
        // Setup initial data using Prisma directly
        const adminUser = await prisma.user.findUnique({ where: { email: 'admin@pocket.com' } });
        const gmUser = await prisma.user.findUnique({ where: { email: 'gm@pocket.com' } });
        
        if (!adminUser || !gmUser) throw new Error("Seed users not found");
        fallbackUserName = gmUser.name;

        const category = await prisma.category.findFirst();

        const project = await prisma.project.create({
            data: {
                name: `PDF Test Project ${createId()}`,
                status: 'ACTIVE',
                budget: 10000,
                branchId: adminUser.branchId,
            }
        });
        testProjectId = project.id;

        const purchase = await prisma.purchase.create({
            data: {
                orderNumber: 'ORD-' + createId().substring(0, 6).toUpperCase(),
                projectId: project.id,
                description: 'Test PDF QR Code Purchase ' + createId(),
                quantity: "1",
                priority: 'NORMAL',
                creatorId: adminUser.id,
                status: 'REQUESTED'
            }
        });
        testPurchaseId = purchase.id;
        testPurchaseOrderNumber = purchase.orderNumber || '';

        const invoice = await prisma.invoice.create({
            data: {
                reference: 'INV-' + createId().substring(0, 6).toUpperCase(),
                amount: 250,
                type: 'EXPENSE',
                date: new Date(),
                status: 'PENDING',
                creatorId: gmUser.id,
                projectId: project.id,
                categoryId: category?.id,
                paymentSource: 'PERSONAL',
                notes: 'Test for QR code in PDF'
            }
        });
        testInvoiceId = invoice.id;
        testInvoiceReference = invoice.reference;
        
        await prisma.purchase.update({
            where: { id: purchase.id },
            data: { invoiceId: invoice.id }
        });
    });

    // Cleanup
    test.afterAll(async () => {
        await prisma.outOfPocketDebt.deleteMany({ where: { invoiceId: testInvoiceId } });
        await prisma.invoice.deleteMany({ where: { id: testInvoiceId } });
        await prisma.purchase.deleteMany({ where: { id: testPurchaseId } });
        await prisma.project.deleteMany({ where: { id: testProjectId } });
    });

    test('1. PENDING Invoice should not show QR Code inside PDF Voucher', async ({ request }) => {
        // Check PDF API for this pending invoice
        // We can just login as root/admin to get cookie
        const pReq = await request.post('/api/auth/login', { data: { email: 'admin@pocket.com', password: 'password123' } });
        const cookie = pReq.headers()['set-cookie'];

        const pdfRes = await request.get(`/api/invoice-vouchers/${testInvoiceId}`, {
            headers: { Cookie: cookie }
        });
        const pdfHtml = await pdfRes.text();
        
        // Ensure QR code is NOT in the HTML
        expect(pdfHtml).not.toContain('امسح للتحقق');
        expect(pdfHtml).not.toContain('alt="QR Code"');
    });

    test('2. PENDING Invoice should not show QR Code in Print View UI', async ({ page }) => {
        // Check Print View UI
        await page.goto(`/invoices/${testInvoiceId}`);
        // Ensure page is actually on the invoice page, not redirected to login
        await expect(page).toHaveURL(new RegExp(`/invoices/${testInvoiceId}`), { timeout: 10000 });
        
        // Ensure page is loaded
        await expect(page.locator('h2', { hasText: testInvoiceReference }).first()).toBeVisible({ timeout: 10000 });
        
        // Text "امسح للتحقق" (Scan to verify) should be hidden or not present
        const qrCodeCount = await page.locator('text=امسح للتحقق').count();
        expect(qrCodeCount).toBe(0);
    });

    test('3. APPROVED Invoice embeds QR Code in PDF Voucher and shows in Print view', async ({ page, request }) => {
        // Approve invoice via Prisma since we use Server Actions, not an API endpoint
        await prisma.invoice.update({
            where: { id: testInvoiceId },
            data: { 
                status: 'APPROVED', 
                externalNumber: 'EXT-QR-99', 
                spendDate: new Date(),
                approvedBy: fallbackUserName,
                approvedAt: new Date()
            }
        });

        // 1. Check API HTML 
        const pdfRes = await request.get(`/api/invoice-vouchers/${testInvoiceId}`);
        const pdfHtml = await pdfRes.text();
        
        // Ensure QR code IS in the HTML
        expect(pdfHtml).toContain('امسح للتحقق');
        expect(pdfHtml).toContain('alt="QR Code"');
        expect(pdfHtml).toContain('data:image/png;base64,');

        // 2. Check Print View UI (Invoice)
        await page.goto(`/invoices/${testInvoiceId}`);
        await expect(page.locator('h2', { hasText: testInvoiceReference }).first()).toBeVisible({ timeout: 10000 });
        
        // "امسح للتحقق" should be present inside the print block
        await expect(page.locator('text=امسح للتحقق').first()).toBeAttached();

        // 3. Purchase Print View UI 
        await page.goto(`/purchases/${testPurchaseId}`);
        await expect(page.locator('text=امسح للتحقق').first()).toBeAttached();
    });

    test('4. General Voucher API should not crash when rendering basic voucher', async ({ request }) => {
        // Use Prisma to find a custody if it exists
        const custody = await prisma.employeeCustody.findFirst();
        
        if (custody) {
            const pdfRes = await request.get(`/api/vouchers/${custody.id}?type=issue`);
            const text = await pdfRes.text();
            expect(pdfRes.status(), `Status failed with msg: ${text}`).toBe(200);
            
            // Should render successfully
            expect(text).toContain('سند صرف');
        }
    });
});


