"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission, getSession, getBranchFilter } from "@/lib/auth";

export async function getTrashItems() {
    try {
        const denied = await requirePermission("trash", "manage");
        if (denied) return { projects: [], invoices: [], purchases: [], users: [] };

        const session = await getSession();
        const bf = session ? getBranchFilter(session) : {};

        // P5: Run all 4 trash queries in parallel — reduces load time ~4x
        const [projects, invoices, purchases, users] = await Promise.all([
            prisma.project.findMany({ where: { isDeleted: true, ...bf } }),
            prisma.invoice.findMany({ where: { isDeleted: true } }),
            prisma.purchase.findMany({ where: { isDeleted: true } }),
            prisma.user.findMany({ where: { isDeleted: true, ...bf } }),
        ]);

        return { projects, invoices, purchases, users };
    } catch (error) {
        console.error("Fetch Trash Error:", error);
        return {
            projects: [],
            invoices: [],
            purchases: [],
            users: [],
        };
    }
}

export async function restoreItem(type: "PROJECT" | "INVOICE" | "PURCHASE" | "USER", id: string) {
    try {
        const denied = await requirePermission("trash", "manage");
        if (denied) return denied;

        switch (type) {
            case "PROJECT":
                await prisma.project.update({ where: { id }, data: { isDeleted: false, deletedAt: null } });
                break;
            case "INVOICE":
                await prisma.invoice.update({ where: { id }, data: { isDeleted: false, deletedAt: null } });
                break;
            case "PURCHASE":
                await prisma.purchase.update({ where: { id }, data: { isDeleted: false, deletedAt: null } });
                break;
            case "USER":
                await prisma.user.update({ where: { id }, data: { isDeleted: false, deletedAt: null } });
                break;
        }

        revalidatePath("/trash");
        revalidatePath(`/${type.toLowerCase()}s`);
        return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return { error: "حدث خطأ أثناء استعادة العنصر" };
    }
}


export async function permanentlyDelete(type: "PROJECT" | "INVOICE" | "PURCHASE" | "USER", id: string) {
    try {
        const denied = await requirePermission("trash", "manage");
        if (denied) return denied;

        switch (type) {
            case "PROJECT":
                await prisma.project.delete({ where: { id } });
                break;
            case "INVOICE":
                await prisma.invoice.delete({ where: { id } });
                break;
            case "PURCHASE":
                await prisma.purchase.delete({ where: { id } });
                break;
            case "USER":
                await prisma.user.delete({ where: { id } });
                break;
        }

        revalidatePath("/trash");
        return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return { error: "حدث خطأ أثناء الحذف النهائي" };
    }
}

export async function purgeOldTrash() {
    try {
        const denied = await requirePermission("trash", "manage");
        if (denied) return denied;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Delete projects older than 30 days
        await prisma.project.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyDaysAgo
                }
            }
        });

        // Delete invoices older than 30 days
        await prisma.invoice.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyDaysAgo
                }
            }
        });

        // Delete purchases older than 30 days
        await prisma.purchase.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyDaysAgo
                }
            }
        });

        // Delete users older than 30 days
        await prisma.user.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyDaysAgo
                }
            }
        });

        revalidatePath("/trash");
        return { success: true, message: "تم تنظيف سلة المهملات من العناصر القديمة بنجاح" };
    } catch (error) {
        console.error("Purge Trash Error:", error);
        return { error: "حدث خطأ أثناء تنظيف المهملات" };
    }
}
