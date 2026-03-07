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

// ─── Settle a debt (company pays the employee back from wallet) ─────────
export async function settleDebt(debtId: string) {
    try {
        const session = await getSession();
        // M2: GLOBAL_ACCOUNTANT or ADMIN can settle debts
        if (!session || (session.role !== "GLOBAL_ACCOUNTANT" && session.role !== "ADMIN")) {
            return { error: "غير مصرح لك بتسوية الديون، هذه الصلاحية للمحاسب العام أو مدير النظام فقط." };
        }

        const debt = await prisma.outOfPocketDebt.findUnique({
            where: { id: debtId },
            include: { employee: { select: { name: true } } }
        });
        if (!debt) return { error: "الدين غير موجود" };
        if (debt.isSettled) return { error: "هذا الدين تم تسويته مسبقاً" };

        // M2: Deduct from company wallet atomically
        const wallet = await prisma.companyWallet.findFirst();
        if (!wallet) return { error: "خزنة الشركة غير موجودة" };
        if (wallet.balance < debt.amount) {
            return { error: `رصيد الخزنة (${wallet.balance.toLocaleString()}) غير كافٍ لتسوية هذا الدين (${debt.amount.toLocaleString()})` };
        }

        await prisma.$transaction([
            // Mark debt as settled
            prisma.outOfPocketDebt.update({
                where: { id: debtId },
                data: {
                    isSettled: true,
                    settledAt: new Date(),
                    settledBy: session.id
                }
            }),
            // Deduct from company wallet
            prisma.companyWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: debt.amount },
                    totalOut: { increment: debt.amount }
                }
            }),
            // Audit trail entry
            prisma.walletEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "SETTLE_DEBT",
                    amount: debt.amount,
                    note: `تسوية دين موظف: ${debt.employee?.name || debt.employeeId}`,
                    createdBy: session.id
                }
            })
        ]);

        revalidatePath("/debts");
        revalidatePath("/wallet");
        return { success: true };
    } catch (error) {
        console.error("Settle Debt Error:", error);
        return { error: "حدث خطأ أثناء تسوية الدين" };
    }
}

