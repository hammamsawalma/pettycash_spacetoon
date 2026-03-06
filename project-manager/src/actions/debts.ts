"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isGlobalFinance } from "@/lib/rbac";

// ─── Get all unsettled debts ──────────────────────────────
export async function getPendingDebts() {
    try {
        const session = await getSession();
        if (!session) return [];

        // Employees see only their own debts; admins/accountants see all
        const where = !isGlobalFinance(session.role)
            ? { employeeId: session.id, isSettled: false }
            : { isSettled: false };

        const debts = await prisma.outOfPocketDebt.findMany({
            where,
            include: {
                employee: { select: { id: true, name: true, image: true } },
                invoice: {
                    include: {
                        project: { select: { name: true } },
                        category: { select: { name: true, icon: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return debts;
    } catch (error) {
        console.error("Get Debts Error:", error);
        return [];
    }
}

// ─── Settle a debt (admin pays the employee back) ─────────
export async function settleDebt(debtId: string) {
    try {
        const session = await getSession();
        if (!session || !isGlobalFinance(session.role)) {
            return { error: "غير مصرح لك بتسوية الديون" };
        }

        const debt = await prisma.outOfPocketDebt.findUnique({ where: { id: debtId } });
        if (!debt) return { error: "الدين غير موجود" };
        if (debt.isSettled) return { error: "هذا الدين تم تسويته مسبقاً" };

        await prisma.outOfPocketDebt.update({
            where: { id: debtId },
            data: {
                isSettled: true,
                settledAt: new Date(),
                settledBy: session.id
            }
        });

        revalidatePath("/debts");
        return { success: true };
    } catch (error) {
        console.error("Settle Debt Error:", error);
        return { error: "حدث خطأ أثناء تسوية الدين" };
    }
}

