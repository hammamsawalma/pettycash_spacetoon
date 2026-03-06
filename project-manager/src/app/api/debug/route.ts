import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isGlobalFinance } from "@/lib/rbac";

export async function GET() {
    try {
        const session = await getSession();
        const purchasesCount = await prisma.purchase.count({ where: { isDeleted: false } });
        const invoicesCount = await prisma.invoice.count({ where: { isDeleted: false } });

        return NextResponse.json({
            session: session
                ? { id: session.id, name: session.name, role: session.role }
                : null,
            isGlobalFinance: session ? isGlobalFinance(session.role) : false,
            db: {
                purchases: purchasesCount,
                invoices: invoicesCount,
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
    }
}
