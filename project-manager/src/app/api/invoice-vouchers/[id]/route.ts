import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInvoiceVoucherHTML } from "@/lib/invoice-voucher";
import { getLogoBase64 } from "@/lib/document-branding";

/**
 * GET /api/invoice-vouchers/[id]
 * Returns HTML invoice voucher for a specific invoice
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                project: { select: { name: true, branch: { select: { name: true, flag: true } } } },
                creator: { select: { name: true, branch: { select: { name: true, flag: true } } } },
                category: { select: { name: true } },
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
        }

        // Authorization
        const canView =
            session.role === "ADMIN" ||
            session.role === "GLOBAL_ACCOUNTANT" ||
            session.role === "GENERAL_MANAGER" ||
            invoice.creatorId === session.id;

        if (!canView) {
            return NextResponse.json({ error: "غير مصرح لك بعرض هذه الفاتورة" }, { status: 403 });
        }

        // v9: Get branch info and logo
        const branch = invoice.project?.branch || invoice.creator?.branch;
        const logoBase64 = getLogoBase64();

        const html = generateInvoiceVoucherHTML({
            invoiceNumber: invoice.reference || invoice.id.slice(0, 8).toUpperCase(),
            date: invoice.date || invoice.createdAt,
            employeeName: invoice.creator?.name || "غير معروف",
            projectName: invoice.project?.name || "بدون مشروع",
            amount: invoice.amount,
            status: invoice.status,
            categoryName: invoice.category?.name,
            description: invoice.notes || undefined,
            paymentSource: invoice.paymentSource || undefined,
            externalNumber: invoice.externalNumber,
            branchName: branch?.name,
            branchFlag: branch?.flag,
            logoBase64,
        });

        return new NextResponse(html, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    } catch (error) {
        console.error("Invoice Voucher API Error:", error);
        return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
    }
}

