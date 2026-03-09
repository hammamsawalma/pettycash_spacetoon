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
// C-2 FIX: Uses interactive transaction with Serializable isolation to prevent
// race conditions where two concurrent settlements both pass the checks.
export async function settleDebt(debtId: string) {
    try {
        const session = await getSession();
        // M2: GLOBAL_ACCOUNTANT or ADMIN can settle debts
        if (!session || (session.role !== "GLOBAL_ACCOUNTANT" && session.role !== "ADMIN")) {
            return { error: "غير مصرح لك بتسوية الديون، هذه الصلاحية للمحاسب العام أو مدير النظام فقط." };
        }

        // C-2: All reads + writes inside a Serializable transaction
        await prisma.$transaction(async (tx) => {
            // Re-read debt inside transaction to get locked state
            const debt = await tx.outOfPocketDebt.findUnique({
                where: { id: debtId },
                include: { employee: { select: { id: true, name: true } } }
            });
            if (!debt) throw new Error("الدين غير موجود");
            if (debt.isSettled) throw new Error("هذا الدين تم تسويته مسبقاً");

            // Re-read wallet inside transaction
            const wallet = await tx.companyWallet.findFirst();
            if (!wallet) throw new Error("خزنة الشركة غير موجودة");
            if (wallet.balance < debt.amount) {
                throw new Error(`رصيد الخزنة (${wallet.balance.toLocaleString()}) غير كافٍ لتسوية هذا الدين (${debt.amount.toLocaleString()})`);
            }

            // Mark debt as settled
            await tx.outOfPocketDebt.update({
                where: { id: debtId },
                data: {
                    isSettled: true,
                    settledAt: new Date(),
                    settledBy: session.id
                }
            });

            // Deduct from company wallet
            await tx.companyWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: debt.amount },
                    totalOut: { increment: debt.amount }
                }
            });

            // Audit trail entry
            await tx.walletEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "SETTLE_DEBT",
                    amount: debt.amount,
                    note: `تسوية دين موظف: ${debt.employee?.name || debt.employeeId}`,
                    createdBy: session.id
                }
            });
        }, {
            isolationLevel: "Serializable"
        });

        // N-6: Notify the employee that their debt was settled
        try {
            const debt = await prisma.outOfPocketDebt.findUnique({
                where: { id: debtId },
                select: { employeeId: true, amount: true }
            });
            if (debt && debt.employeeId !== session.id) {
                await prisma.notification.create({
                    data: {
                        title: 'تمت تسوية دينك ✅',
                        content: `تم تسوية مبلغ ${debt.amount.toLocaleString()} ريال مستحق لك من الشركة`,
                        targetUserId: debt.employeeId
                    }
                });
            }
        } catch { /* non-critical */ }

        revalidatePath("/debts");
        revalidatePath("/wallet");
        revalidatePath("/deposits"); // R-6
        return { success: true };
    } catch (error) {
        console.error("Settle Debt Error:", error);
        const message = error instanceof Error ? error.message : "حدث خطأ أثناء تسوية الدين";
        return { error: message };
    }
}

