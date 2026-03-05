"use server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createDepositSchema } from "@/lib/validations/app-schemas";
import { isGlobalFinance } from "@/lib/rbac";

export async function getDeposits() {
    try {
        const session = await getSession();
        if (!session) return { deposits: [], totalBalance: 0 };

        const whereClause = isGlobalFinance(session.role)
            ? {}
            : { creatorId: session.id }; // Employees only see their own deposits/withdrawals

        const records = await prisma.deposit.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: {
                creator: { select: { name: true, image: true } }
            }
        });

        // Calculate a simple mock balance (sum of DEPOSIT - sum of WITHDRAWAL)
        const totalBalance = records.reduce((acc: number, curr: { type: string, amount: number }) => {
            return curr.type === "DEPOSIT" ? acc + curr.amount : acc - curr.amount;
        }, 0);

        return { deposits: records, totalBalance };

    } catch (error) {
        console.error("Deposits Fetch Error:", error);
        return { deposits: [], totalBalance: 0 };
    }
}

export async function createDeposit(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        const validatedFields = createDepositSchema.safeParse({
            amount: formData.get("amount"),
            type: formData.get("type"),
            date: formData.get("date"),
            description: formData.get("description"),
        });

        if (!validatedFields.success) {
            return { error: validatedFields.error.issues[0].message };
        }

        const { amount, type, date: dateStr, description } = validatedFields.data;

        if (type === "WITHDRAWAL") {
            // Validate against current balance
            const { totalBalance } = await getDeposits();
            if (amount > totalBalance) {
                return { error: `عذراً، الرصيد المتاح في العهدة (${totalBalance} QAR) لا يكفي لإتمام عملية السحب.` };
            }
        }

        const newDeposit = await prisma.deposit.create({
            data: {
                amount,
                type,
                date: dateStr ? new Date(dateStr) : new Date(),
                description,
                creatorId: session.id
            }
        });

        revalidatePath("/deposits");
        return { success: true, depositId: newDeposit.id };

    } catch (error) {
        console.error("Deposit Creation Error:", error);
        return { error: error instanceof Error ? error.message : "حدث خطأ أثناء إضافة السجل" };
    }
}

export async function getEmployeeCustodyBalance() {
    try {
        const session = await getSession();
        if (!session) return { totalCustody: 0, totalExpenses: 0, remainingBalance: 0 };

        const isRestricted = !isGlobalFinance(session.role);

        const projects = await prisma.project.findMany({
            where: isRestricted
                ? { OR: [{ managerId: session.id }, { members: { some: { userId: session.id } } }], status: "IN_PROGRESS", isDeleted: false }
                : { status: "IN_PROGRESS", isDeleted: false },
            include: {
                purchases: {
                    where: { status: { not: "CANCELLED" } }
                }
            }
        });

        const totalCustody = projects.reduce((sum, p) => sum + (p.custody || 0), 0);
        const totalExpenses = projects.reduce((sum, p) => sum + p.purchases.reduce((exp, pur) => exp + pur.amount, 0), 0);

        return {
            totalCustody,
            totalExpenses,
            remainingBalance: totalCustody - totalExpenses
        };
    } catch (error) {
        console.error("Custody Balance Fetch Error:", error);
        return { totalCustody: 0, totalExpenses: 0, remainingBalance: 0 };
    }
}
