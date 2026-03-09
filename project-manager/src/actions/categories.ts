"use server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// ─── Get Categories (with optional scope filter) ───────────────────────────
export async function getCategories(scope?: "PROJECT" | "COMPANY" | "BOTH") {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                ...(scope ? {
                    OR: [
                        { scope },
                        { scope: "BOTH" }
                    ]
                } : {})
            },
            orderBy: { name: "asc" }
        });
        return categories;
    } catch (error) {
        console.error("Get Categories Error:", error);
        return [];
    }
}

// ─── Get All Categories (including inactive — for management page) ────────
export async function getAllCategories() {
    try {
        const session = await getSession();
        if (!session) return [];

        // Only ADMIN and GLOBAL_ACCOUNTANT can manage categories
        if (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT") {
            return [];
        }

        const categories = await prisma.category.findMany({
            orderBy: [{ scope: "asc" }, { name: "asc" }],
            include: {
                _count: { select: { invoices: true } }
            }
        });
        return categories;
    } catch (error) {
        console.error("Get All Categories Error:", error);
        return [];
    }
}

// ─── Create Category ──────────────────────────────────────────────────────
export async function createCategory(name: string, scope: string, icon?: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        if (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT") {
            return { error: "هذه الصلاحية للمحاسب العام ومدير النظام فقط" };
        }

        if (!name.trim()) return { error: "اسم التصنيف مطلوب" };
        if (!["PROJECT", "COMPANY", "BOTH"].includes(scope)) {
            return { error: "نوع التصنيف غير صالح" };
        }

        // Check unique name within scope
        const existing = await prisma.category.findFirst({
            where: {
                name: name.trim(),
                scope,
                isActive: true
            }
        });
        if (existing) return { error: "تصنيف بهذا الاسم موجود مسبقاً" };

        await prisma.category.create({
            data: {
                name: name.trim(),
                scope,
                icon: icon || null
            }
        });

        revalidatePath("/settings/categories");
        revalidatePath("/invoices/new");
        return { success: true };
    } catch (error) {
        console.error("Create Category Error:", error);
        return { error: "حدث خطأ أثناء إنشاء التصنيف" };
    }
}

// ─── Update Category ──────────────────────────────────────────────────────
export async function updateCategory(id: string, name: string, icon?: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        if (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT") {
            return { error: "هذه الصلاحية للمحاسب العام ومدير النظام فقط" };
        }

        if (!name.trim()) return { error: "اسم التصنيف مطلوب" };

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) return { error: "التصنيف غير موجود" };

        // Check unique name within same scope (exclude self)
        const duplicate = await prisma.category.findFirst({
            where: {
                name: name.trim(),
                scope: category.scope,
                isActive: true,
                NOT: { id }
            }
        });
        if (duplicate) return { error: "تصنيف بهذا الاسم موجود مسبقاً" };

        await prisma.category.update({
            where: { id },
            data: {
                name: name.trim(),
                icon: icon !== undefined ? (icon || null) : undefined
            }
        });

        revalidatePath("/settings/categories");
        revalidatePath("/invoices/new");
        return { success: true };
    } catch (error) {
        console.error("Update Category Error:", error);
        return { error: "حدث خطأ أثناء تحديث التصنيف" };
    }
}

// ─── Delete Category (only if no invoices linked) ──────────────────────────
export async function deleteCategory(id: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        if (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT") {
            return { error: "هذه الصلاحية للمحاسب العام ومدير النظام فقط" };
        }

        const category = await prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { invoices: true } } }
        });
        if (!category) return { error: "التصنيف غير موجود" };

        if (category._count.invoices > 0) {
            return { error: `لا يمكن حذف هذا التصنيف — مرتبط بـ ${category._count.invoices} فاتورة. استخدم "إلغاء التفعيل" بدلاً من الحذف.` };
        }

        await prisma.category.delete({ where: { id } });

        revalidatePath("/settings/categories");
        revalidatePath("/invoices/new");
        return { success: true };
    } catch (error) {
        console.error("Delete Category Error:", error);
        return { error: "حدث خطأ أثناء حذف التصنيف" };
    }
}

// ─── Deactivate Category (hide from lists but keep linked invoices) ────────
export async function deactivateCategory(id: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        if (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT") {
            return { error: "هذه الصلاحية للمحاسب العام ومدير النظام فقط" };
        }

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) return { error: "التصنيف غير موجود" };

        await prisma.category.update({
            where: { id },
            data: { isActive: !category.isActive }
        });

        revalidatePath("/settings/categories");
        revalidatePath("/invoices/new");
        return { success: true, isActive: !category.isActive };
    } catch (error) {
        console.error("Deactivate Category Error:", error);
        return { error: "حدث خطأ" };
    }
}
