"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBranches() {
    const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            code: true,
            currency: true,
            country: true,
            flag: true,
        },
    });
    return branches;
}

// v8: Branches with stats — ROOT only
export async function getBranchesWithStats() {
    const session = await getSession();
    if (!session || session.role !== "ROOT") return [];

    const branches = await prisma.branch.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            code: true,
            currency: true,
            country: true,
            flag: true,
            isActive: true,
            createdAt: true,
        },
    });

    const branchesWithStats = await Promise.all(
        branches.map(async (branch) => {
            const [users, projects, admins] = await Promise.all([
                prisma.user.count({ where: { branchId: branch.id, isDeleted: false } }),
                prisma.project.count({ where: { branchId: branch.id, isDeleted: false } }),
                prisma.user.count({ where: { branchId: branch.id, role: "ADMIN", isDeleted: false } }),
            ]);
            return { ...branch, users, projects, admins };
        })
    );

    return branchesWithStats;
}

// v8: Toggle branch active status — ROOT only
export async function toggleBranchActive(branchId: string) {
    const session = await getSession();
    if (!session || session.role !== "ROOT") {
        return { error: "فقط ROOT يمكنه تعديل حالة الفروع" };
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return { error: "الفرع غير موجود" };

    await prisma.branch.update({
        where: { id: branchId },
        data: { isActive: !branch.isActive },
    });

    revalidatePath("/branches");
    revalidatePath("/welcome");
    return { success: true, isActive: !branch.isActive };
}
