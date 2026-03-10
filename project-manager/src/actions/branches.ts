"use server";

import prisma from "@/lib/prisma";

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
