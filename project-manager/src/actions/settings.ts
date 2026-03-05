"use server"

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
        await prisma.setting.upsert({
            where: { id: "global" },
            update: { currency: newCurrency },
            create: { id: "global", currency: newCurrency }
        });

        // Revalidate the caching for the dashboard layout and all paths naturally
        revalidatePath("/", "layout");

        return { success: true };
    } catch (error) {
        console.error("Error updating global currency:", error);
        return { error: "فشل في تحديث العملة" };
    }
}
