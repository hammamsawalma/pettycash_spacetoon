"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { parseRoles, serializeRoles, type ProjectRole } from "@/lib/roles";

// ─── إضافة عضو للمشروع مع أدواره ────────────────────────
export async function addMemberToProject(
    projectId: string,
    userId: string,
    roles: ProjectRole[]
) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه إضافة أعضاء للمشروع" };
        }

        // تأكد أن الأدوار تحتوي دائماً على PROJECT_EMPLOYEE
        const rolesWithEmployee = Array.from(new Set(["PROJECT_EMPLOYEE" as ProjectRole, ...roles]));

        const member = await prisma.projectMember.upsert({
            where: { projectId_userId: { projectId, userId } },
            update: { projectRoles: serializeRoles(rolesWithEmployee) },
            create: {
                projectId,
                userId,
                projectRoles: serializeRoles(rolesWithEmployee),
                custodyBalance: 0
            }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath(`/projects/${projectId}/members`);
        return { success: true, member };
    } catch (error) {
        console.error("Add Member Error:", error);
        return { error: "حدث خطأ أثناء إضافة العضو" };
    }
}

// ─── تحديث أدوار عضو في المشروع ──────────────────────────
export async function updateMemberRoles(
    memberId: string,
    roles: ProjectRole[]
) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه تعديل الأدوار" };
        }

        // PROJECT_EMPLOYEE دائماً موجود
        const rolesWithEmployee = Array.from(new Set(["PROJECT_EMPLOYEE" as ProjectRole, ...roles]));

        const member = await prisma.projectMember.update({
            where: { id: memberId },
            data: { projectRoles: serializeRoles(rolesWithEmployee) }
        });

        revalidatePath(`/projects/${member.projectId}/members`);
        return { success: true, member };
    } catch (error) {
        console.error("Update Roles Error:", error);
        return { error: "حدث خطأ أثناء تحديث الأدوار" };
    }
}


export async function getProjectMembers(projectId: string) {
    try {
        const session = await getSession();
        if (!session) return [];

        // Authorization: must be ADMIN, global finance, or a member of this project
        if (!['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'].includes(session.role)) {
            const membership = await prisma.projectMember.findFirst({
                where: { projectId, userId: session.id }
            });
            const isManager = await prisma.project.findFirst({
                where: { id: projectId, managerId: session.id }
            });
            if (!membership && !isManager) {
                return []; // silently return empty — don’t leak project existence
            }
        }

        const members = await prisma.projectMember.findMany({
            where: { projectId },
            include: {
                user: {
                    select: {
                        id: true, name: true, email: true,
                        phone: true, image: true, jobTitle: true
                    }
                }
            }
        });

        // نُعيد الأعضاء مع قائمة الأدوار المُحللة
        return members.map(m => ({
            ...m,
            parsedRoles: parseRoles(m.projectRoles)
        }));
    } catch (error) {
        console.error("Get Members Error:", error);
        return [];
    }
}


// ─── حذف عضو من المشروع ──────────────────────────────────
export async function removeMemberFromProject(memberId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه إزالة الأعضاء" };
        }

        const member = await prisma.projectMember.findUnique({
            where: { id: memberId },
            include: { custodies: { where: { isClosed: false } } }
        });

        if (!member) return { error: "العضو غير موجود" };

        if (member.custodies.length > 0) {
            return { error: "لا يمكن إزالة عضو لديه عهدات نشطة غير مغلقة" };
        }

        await prisma.projectMember.delete({ where: { id: memberId } });

        revalidatePath(`/projects/${member.projectId}/members`);
        return { success: true };
    } catch (error) {
        console.error("Remove Member Error:", error);
        return { error: "حدث خطأ أثناء إزالة العضو" };
    }
}
