"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isGlobalFinance } from "@/lib/rbac";

// ─── Get or Create the single CompanyWallet ───────────────
async function getOrCreateWallet() {
    let wallet = await prisma.companyWallet.findFirst();
    if (!wallet) {
        wallet = await prisma.companyWallet.create({
            data: { balance: 0, totalIn: 0, totalOut: 0 }
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
        const wallet = await getOrCreateWallet();
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
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه إيداع في خزنة الشركة" };
        }

        const amount = parseFloat(formData.get("amount") as string);
        const note = formData.get("note") as string;

        if (isNaN(amount) || amount <= 0) return { error: "المبلغ غير صالح" };

        const wallet = await getOrCreateWallet();

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
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه تخصيص الميزانية للمشاريع" };
        }

        const projectId = formData.get("projectId") as string;
        const amount = parseFloat(formData.get("amount") as string);
        const note = formData.get("note") as string;

        if (!projectId || isNaN(amount) || amount <= 0) {
            return { error: "بيانات غير صالحة" };
        }

        const wallet = await getOrCreateWallet();
        if (wallet.balance < amount) {
            return { error: `رصيد خزنة الشركة (${wallet.balance}) أقل من المبلغ المطلوب (${amount})` };
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return { error: "المشروع غير موجود" };
        if (project.status !== "IN_PROGRESS") {
            return { error: "لا يمكن تخصيص ميزانية لمشروع مكتمل أو متوقف" };
        }


        await prisma.$transaction([
            prisma.companyWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    totalOut: { increment: amount }
                }
            }),
            prisma.walletEntry.create({
                data: {
                    walletId: wallet.id,
                    type: "ALLOCATE_TO_PROJECT",
                    amount,
                    note: note || `تخصيص ميزانية للمشروع: ${project.name}`,
                    createdBy: session.id
                }
            }),
            prisma.project.update({
                where: { id: projectId },
                data: { budgetAllocated: { increment: amount } }
            })
        ]);

        revalidatePath("/wallet");
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Allocate Budget Error:", error);
        return { error: "حدث خطأ أثناء تخصيص الميزانية" };
    }
}



