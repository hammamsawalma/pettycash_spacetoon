"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function getGlobalCurrency() {
    try {
        let setting = await prisma.setting.findUnique({
            where: { id: "global" }
        });

        // Initialize if not present
        if (!setting) {
            setting = await prisma.setting.create({
                data: {
                    id: "global",
                    currency: "ر.ق" // Default to QAR symbol in Arabic
                }
            });
        }

        return setting.currency;
    } catch (error) {
        console.error("Error fetching global currency:", error);
        return "ر.ق"; // Fallback
    }
}

export async function updateGlobalCurrency(newCurrency: string) {
    try {
        // R1: ADMIN only can change system-wide currency
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط مدير النظام يمكنه تغيير عملة النظام" };
        }

        if (!newCurrency || newCurrency.trim().length === 0) {
            return { error: "رمز العملة لا يمكن أن يكون فارغاً" };
        }

        await prisma.setting.upsert({
            where: { id: "global" },
            update: { currency: newCurrency.trim() },
            create: { id: "global", currency: newCurrency.trim() }
        });

        // Revalidate the caching for the dashboard layout and all paths naturally
        revalidatePath("/", "layout");

        return { success: true };
    } catch (error) {
        console.error("Error updating global currency:", error);
        return { error: "فشل في تحديث العملة" };
    }
}

