"use server"
import prisma from "@/lib/prisma"

// ─── Get all Categories ───────────────────────────────────
export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" }
        });
        return categories;
    } catch (error) {
        console.error("Get Categories Error:", error);
        return [];
    }
}
