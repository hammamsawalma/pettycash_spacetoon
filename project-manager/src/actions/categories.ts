"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

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

// ─── Create Category ──────────────────────────────────────
export async function createCategory(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه إضافة تصنيفات جديدة" };
        }

        const name = formData.get("name") as string;
        const icon = formData.get("icon") as string;

        if (!name?.trim()) return { error: "اسم التصنيف مطلوب" };

        const existing = await prisma.category.findFirst({ where: { name: name.trim() } });
        if (existing) return { error: "هذا التصنيف موجود بالفعل" };

        await prisma.category.create({
            data: { name: name.trim(), icon: icon?.trim() || null }
        });

        revalidatePath("/categories");
        return { success: true };
    } catch (error) {
        console.error("Create Category Error:", error);
        return { error: "حدث خطأ أثناء إنشاء التصنيف" };
    }
}

// ─── Update Category ──────────────────────────────────────
export async function updateCategory(id: string, prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه تعديل التصنيفات" };
        }

        const name = formData.get("name") as string;
        const icon = formData.get("icon") as string;
        const isActive = formData.get("isActive") === "true";

        if (!name?.trim()) return { error: "اسم التصنيف مطلوب" };

        await prisma.category.update({
            where: { id },
            data: { name: name.trim(), icon: icon?.trim() || null, isActive }
        });

        revalidatePath("/categories");
        return { success: true };
    } catch (error) {
        console.error("Update Category Error:", error);
        return { error: "حدث خطأ أثناء تعديل التصنيف" };
    }
}

// ─── Seed Default Categories ──────────────────────────────
export async function seedDefaultCategories() {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "غير مصرح" };
        }

        const defaults = [
            { name: "طعام ومشروبات", icon: "🍔" },
            { name: "نقل ومواصلات", icon: "🚗" },
            { name: "مستلزمات مكتبية", icon: "📦" },
            { name: "اتصالات", icon: "📱" },
            { name: "صيانة", icon: "🔧" },
            { name: "استضافة وفنادق", icon: "🏨" },
            { name: "أخرى", icon: "📌" },
        ];

        for (const cat of defaults) {
            await prisma.category.upsert({
                where: { id: cat.name }, // workaround: use name as lookup
                update: {},
                create: cat
            }).catch(() => prisma.category.create({ data: cat }));
        }

        revalidatePath("/categories");
        return { success: true };
    } catch (error) {
        console.error("Seed Categories Error:", error);
        return { error: "حدث خطأ أثناء البذر" };
    }
}
