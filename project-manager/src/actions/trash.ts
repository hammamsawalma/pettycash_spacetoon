"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export async function getTrashItems() {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return {
                projects: [],
                invoices: [],
                purchases: [],
                users: [],
            };
        }

        const projects = await prisma.project.findMany({ where: { isDeleted: true } });
        const invoices = await prisma.invoice.findMany({ where: { isDeleted: true } });
        const purchases = await prisma.purchase.findMany({ where: { isDeleted: true } });
        const users = await prisma.user.findMany({ where: { isDeleted: true } });

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
        const session = await getSession();
        if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");

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
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error restoring item" };
    }
}

export async function moveToTrash(type: "PROJECT" | "INVOICE" | "PURCHASE" | "USER", id: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");

        switch (type) {
            case "PROJECT": {
                // Dependency check
                const project = await prisma.project.findUnique({
                    where: { id },
                    include: {
                        _count: {
                            select: {
                                invoices: { where: { isDeleted: false } },
                                purchases: { where: { isDeleted: false } },
                                members: true
                            }
                        }
                    }
                });

                if (project) {
                    const activeDependencies = [];
                    if (project._count.invoices > 0) activeDependencies.push(`${project._count.invoices} فواتير`);
                    if (project._count.purchases > 0) activeDependencies.push(`${project._count.purchases} مشتريات`);
                    if (project._count.members > 0) activeDependencies.push(`${project._count.members} أعضاء`);

                    if (activeDependencies.length > 0) {
                        throw new Error(`لا يمكن حذف المشروع لوجود ارتباطات نشطة: ${activeDependencies.join('، ')}`);
                    }
                }

                await prisma.project.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
                break;
            }
            case "INVOICE":
                await prisma.invoice.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
                break;
            case "PURCHASE":
                await prisma.purchase.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
                break;
            case "USER": {
                const userDependencies = await prisma.user.findUnique({
                    where: { id },
                    include: {
                        _count: {
                            select: {
                                managedProjects: { where: { isDeleted: false } },
                                invoicesCreated: { where: { isDeleted: false } },
                                purchases: { where: { isDeleted: false } }
                            }
                        }
                    }
                });

                if (userDependencies) {
                    const activeDeps = [];
                    if (userDependencies._count.managedProjects > 0) activeDeps.push(`${userDependencies._count.managedProjects} مشاريع يديرها`);
                    if (userDependencies._count.invoicesCreated > 0) activeDeps.push(`${userDependencies._count.invoicesCreated} فواتير أنشأها`);
                    if (userDependencies._count.purchases > 0) activeDeps.push(`${userDependencies._count.purchases} مشتريات`);

                    if (activeDeps.length > 0) {
                        throw new Error(`لا يمكن حذف المستخدم لوجود ارتباطات نشطة: ${activeDeps.join('، ')}`);
                    }
                }

                await prisma.user.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
                break;
            }
        }

        revalidatePath("/trash");
        revalidatePath(`/${type.toLowerCase()}s`);
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error moving item to trash" };
    }
}

export async function permanentlyDelete(type: "PROJECT" | "INVOICE" | "PURCHASE" | "USER", id: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");

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
    } catch (error) {
        return { error: error instanceof Error ? error.message : "Error deleting item" };
    }
}

export async function purgeOldTrash() {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");

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
        return { error: error instanceof Error ? error.message : "حدث خطأ أثناء تنظيف المهملات" };
    }
}
