"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession, getBranchFilter } from "@/lib/auth";
import { isGlobalFinance } from "@/lib/rbac";

// ─── Get or Create the single CompanyWallet ───────────────
async function getOrCreateWallet(branchId?: string | null) {
    const where = branchId ? { branchId } : {};
    let wallet = await prisma.companyWallet.findFirst({ where });
    if (!wallet) {
        wallet = await prisma.companyWallet.create({
            data: { balance: 0, totalIn: 0, totalOut: 0, branchId: branchId ?? null }
        });
    }
    return wallet;
}

// ─── Get Company Wallet Stats ─────────────────────────────
export async function getCompanyWallet() {
    try {
        const session = await getSession();
        if (!session || !isGlobalFinance(session.role)) {
            return null;
        }
        const wallet = await getOrCreateWallet(session.branchId);
        const entries = await prisma.walletEntry.findMany({
            where: { walletId: wallet.id },
            include: { creator: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 50
        });
        return { ...wallet, entries };
    } catch (error) {
        console.error("Get Wallet Error:", error);
        return null;
    }
}

// ─── Deposit into Company Wallet ──────────────────────────
export async function depositToCompanyWallet(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || !["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT", "ACCOUNTANT"].includes(session.role)) {
            return { error: "فقط الإدارة والمالية يمكنهم إضافة رصيد لخزنة الشركة" };
        }

        const amount = parseFloat(formData.get("amount") as string);
        const note = formData.get("note") as string;

        if (isNaN(amount) || amount <= 0) return { error: "المبلغ غير صالح" };

        const wallet = await getOrCreateWallet(session.branchId);

        await prisma.$transaction([
            prisma.companyWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { increment: amount },
                    totalIn: { increment: amount }
                }
            }),
            prisma.walletEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "DEPOSIT",
                    amount,
                    note: note || null,
                    createdBy: session.id
                }
            })
        ]);

        revalidatePath("/wallet");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Deposit Error:", error);
        return { error: "حدث خطأ أثناء الإيداع" };
    }
}

// ─── Allocate Budget to a Project ────────────────────────
export async function allocateBudgetToProject(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || !["ROOT", "ADMIN"].includes(session.role)) {
            return { error: "فقط المدير يمكنه تخصيص الميزانية للمشاريع" };
        }

        const projectId = formData.get("projectId") as string;
        const amount = parseFloat(formData.get("amount") as string);
        const note = formData.get("note") as string;

        if (!projectId || isNaN(amount) || amount <= 0) {
            return { error: "بيانات غير صالحة" };
        }

        // RC-1 FIX: Interactive transaction with balance check INSIDE
        let projectName = "";
        let managerId: string | null = null;

        await prisma.$transaction(async (tx) => {
            const walletWhere = session.branchId ? { branchId: session.branchId } : {};
            const wallet = await tx.companyWallet.findFirst({ where: walletWhere });
            if (!wallet) throw new Error("خزنة الشركة غير موجودة");
            if (wallet.balance < amount) {
                throw new Error(`رصيد خزنة الشركة (${wallet.balance.toLocaleString('en-US')}) أقل من المبلغ المطلوب (${amount.toLocaleString('en-US')})`);
            }

            const project = await tx.project.findUnique({ where: { id: projectId } });
            if (!project) throw new Error("المشروع غير موجود");
            if (project.status !== "IN_PROGRESS") {
                throw new Error("لا يمكن تخصيص ميزانية لمشروع مكتمل أو متوقف");
            }
            projectName = project.name;
            managerId = project.managerId;

            await tx.companyWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    totalOut: { increment: amount }
                }
            });
            await tx.walletEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "ALLOCATE_TO_PROJECT",
                    amount,
                    note: note || `تخصيص ميزانية للمشروع: ${projectName}`,
                    createdBy: session.id
                }
            });
            await tx.project.update({
                where: { id: projectId },
                data: { budgetAllocated: { increment: amount } }
            });
        }, { isolationLevel: "Serializable" });

        // N-4: Notify project manager about new budget allocation
        if (managerId && managerId !== session.id) {
            try {
                await prisma.notification.create({
                    data: {
                        title: 'تم تخصيص ميزانية جديدة لمشروعك 💰',
                        content: `تم تخصيص ${amount.toLocaleString('en-US')} ريال لمشروع "${projectName}"`,
                        targetUserId: managerId
                    }
                });
            } catch { /* non-critical */ }
        }

        revalidatePath("/wallet");
        revalidatePath("/deposits"); // R-5
        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Allocate Budget Error:", error);
        const message = error instanceof Error ? error.message : "حدث خطأ أثناء تخصيص الميزانية";
        return { error: message };
    }
}



