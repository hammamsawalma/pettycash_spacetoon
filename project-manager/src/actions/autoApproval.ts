"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// ─── Get current AutoApprovalRule ────────────────────────
export async function getAutoApprovalRule() {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") return null;

        const rule = await prisma.autoApprovalRule.findFirst({ where: { isActive: true } });
        return rule;
    } catch {
        return null;
    }
}

// ─── Set/Update AutoApprovalRule (ADMIN only) ─────────────
export async function setAutoApprovalRule(maxAmount: number, requiresManager: boolean) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه تعديل قواعد الاعتماد التلقائي" };
        }

        if (isNaN(maxAmount) || maxAmount < 0) {
            return { error: "مبلغ غير صالح" };
        }

        // Deactivate any existing rules first
        await prisma.autoApprovalRule.updateMany({
            data: { isActive: false }
        });

        // Create (or reactivate) the rule
        await prisma.autoApprovalRule.create({
            data: {
                maxAmount,
                requiresManager,
                isActive: true
            }
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Set AutoApproval Error:", error);
        return { error: "حدث خطأ أثناء حفظ القاعدة" };
    }
}

// ─── Disable AutoApprovalRule (ADMIN only) ────────────────
export async function disableAutoApprovalRule() {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "غير مصرح" };
        }

        await prisma.autoApprovalRule.updateMany({
            data: { isActive: false }
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Disable AutoApproval Error:", error);
        return { error: "حدث خطأ أثناء تعطيل القاعدة" };
    }
}
