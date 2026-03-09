import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateVoucherHTML } from "@/lib/voucher";

/**
 * GET /api/vouchers/[id]
 * Returns HTML voucher for a custody (issue) or custody return (receipt)
 * Query params: type=issue|receipt, returnId=... (for receipt type)
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
        const url = new URL(request.url);
        const type = url.searchParams.get("type") || "issue";

        const custody = await prisma.employeeCustody.findUnique({
            where: { id },
            include: {
                project: true,
                employee: true,
                confirmation: true,
                returns: { include: { recorder: true } }
            }
        });

        if (!custody) {
            return NextResponse.json({ error: "العهدة غير موجودة" }, { status: 404 });
        }

        // Authorization: admin, accountant, or the employee themselves
        const canView =
            session.role === "ADMIN" ||
            session.role === "GLOBAL_ACCOUNTANT" ||
            session.role === "GENERAL_MANAGER" ||
            custody.employeeId === session.id;

        if (!canView) {
            return NextResponse.json({ error: "غير مصرح لك بعرض هذا السند" }, { status: 403 });
        }

        if (type === "receipt") {
            // Find a specific return
            const returnId = url.searchParams.get("returnId");
            const custodyReturn = returnId
                ? custody.returns.find((r: any) => r.id === returnId)
                : custody.returns[custody.returns.length - 1]; // latest

            if (!custodyReturn) {
                return NextResponse.json({ error: "لا يوجد سجل إرجاع" }, { status: 404 });
            }

            const html = generateVoucherHTML({
                voucherNumber: 0, // Sequential numbering can be enhanced later
                type: "RECEIPT",
                date: new Date((custodyReturn as any).createdAt),
                employeeName: custody.employee?.name || "غير معروف",
                projectName: custody.project?.name || "بدون مشروع",
                amount: (custodyReturn as any).amount,
                method: custody.method || "CASH",
                note: (custodyReturn as any).note || undefined,
                isExternal: custody.isExternal || false,
                externalName: custody.externalName || undefined,
                externalPhone: custody.externalPhone || undefined,
                externalPurpose: custody.externalPurpose || undefined,
                issuerName: (custodyReturn as any).recorder?.name || session.name || "المحاسب",
                recipientSignature: (custodyReturn as any).signatureFile || undefined,
            });

            return new NextResponse(html, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });
        }

        // Default: issue voucher
        const html = generateVoucherHTML({
            voucherNumber: 0,
            type: "ISSUE",
            date: custody.confirmedAt || custody.createdAt,
            employeeName: custody.employee?.name || "غير معروف",
            projectName: custody.project?.name || "بدون مشروع",
            amount: custody.amount,
            method: custody.method || "CASH",
            note: custody.note || undefined,
            isExternal: custody.isExternal || false,
            externalName: custody.externalName || undefined,
            externalPhone: custody.externalPhone || undefined,
            externalPurpose: custody.externalPurpose || undefined,
            issuerName: session.name || "المحاسب",
            recipientSignature: custody.confirmation?.signatureFile || undefined,
        });

        return new NextResponse(html, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    } catch (error) {
        console.error("Voucher API Error:", error);
        return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
    }
}
