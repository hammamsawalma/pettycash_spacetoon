"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validations/app-schemas";
import { isGlobalFinance } from "@/lib/rbac";
import fs from "fs";
import path from "path";
import { Prisma } from "@prisma/client";

export async function getProjects() {
    try {
        const session = await getSession();
        if (!session) return [];

        // Global finance roles (incl. GENERAL_MANAGER) see all projects
        const canSeeAll = isGlobalFinance(session.role);

        const projectWhereClause: Prisma.ProjectWhereInput = (!canSeeAll)
            ? {
                OR: [
                    { managerId: session.id },
                    { members: { some: { userId: session.id } } }
                ],
                isDeleted: false
            }
            : { isDeleted: false };

        const projects = await prisma.project.findMany({
            where: projectWhereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                manager: true,
                _count: {
                    select: { members: true, invoices: true, purchases: true }
                },
                invoices: {
                    where: { isDeleted: false, status: { in: ['APPROVED', 'PENDING'] } },
                    select: { amount: true, status: true }
                }
            }
        });

        // Fetch custody balances per project separately
        const projectIds = projects.map(p => p.id);
        const custodyAgg = await prisma.employeeCustody.groupBy({
            by: ['projectId'],
            where: { projectId: { in: projectIds }, isClosed: false },
            _sum: { balance: true }
        });
        const custodyMap = Object.fromEntries(custodyAgg.map(c => [c.projectId, c._sum.balance ?? 0]));

        return projects.map((projectItem) => {
            const { invoices, ...project } = projectItem as any;
            const approvedExpenses = invoices.filter((i: any) => i.status === 'APPROVED').reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
            const pendingExpenses = invoices.filter((i: any) => i.status === 'PENDING').reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
            const totalCustodyRemaining = custodyMap[project.id] ?? 0;

            return {
                ...project,
                approvedExpenses,
                pendingExpenses,
                totalCustodyRemaining,
                expectedRemaining: (project.budgetAllocated || 0) - approvedExpenses - pendingExpenses
            };
        });
    } catch (error) {
        console.error("Projects Fetch Error:", error);
        return [];
    }
}

export async function getProjectById(id: string) {
    try {
        const session = await getSession();
        if (!session) return null;

        const canSeeAll = isGlobalFinance(session.role) || session.role === "GENERAL_MANAGER";

        const whereClause: Prisma.ProjectWhereInput = (!canSeeAll)
            ? {
                id,
                isDeleted: false,
                OR: [
                    { managerId: session.id },
                    { members: { some: { userId: session.id } } }
                ]
            }
            : { id, isDeleted: false };

        const project = await prisma.project.findFirst({
            where: whereClause,
            include: {
                manager: true,
                invoices: {
                    where: { isDeleted: false },
                    orderBy: { date: 'desc' }
                },
                purchases: {
                    where: { isDeleted: false },
                    orderBy: { date: 'desc' }
                },
                members: {
                    include: { user: true }
                }
            }
        });

        if (!project) return null;
        return project;
    } catch (error) {
        console.error("Project Fetch Error:", error);
        return null;
    }
}

// ─── Projects available for Invoice creation ─────────────────────────────────
// Filters: IN_PROGRESS + user has PROJECT_EMPLOYEE or PROJECT_ACCOUNTANT role
// (or is a global role that can create invoices)
export async function getProjectsForInvoice() {
    try {
        const session = await getSession();
        if (!session) return [];

        // Global roles that can always create invoices against any project
        if (["ADMIN", "GLOBAL_ACCOUNTANT"].includes(session.role)) {
            return prisma.project.findMany({
                where: { status: "IN_PROGRESS", isDeleted: false },
                orderBy: { name: "asc" },
                select: { id: true, name: true, status: true }
            });
        }

        // USER: only projects where user has PROJECT_EMPLOYEE or PROJECT_ACCOUNTANT role
        const memberships = await prisma.projectMember.findMany({
            where: {
                userId: session.id,
                project: { status: "IN_PROGRESS", isDeleted: false }
            },
            select: { projectId: true, projectRoles: true, project: { select: { id: true, name: true, status: true } } }
        });

        // Also include projects where user is the manager AND has employee role
        const eligible = memberships.filter(m => {
            const roles = (m.projectRoles || "").split(",").map((r: string) => r.trim());
            return roles.includes("PROJECT_EMPLOYEE") || roles.includes("PROJECT_ACCOUNTANT");
        });

        return eligible.map(m => m.project);
    } catch (error) {
        console.error("getProjectsForInvoice Error:", error);
        return [];
    }
}

// ─── Projects available for Purchase request creation ────────────────────────
// Filters: IN_PROGRESS + user has PROJECT_MANAGER role (or is ADMIN/GM)
export async function getProjectsForPurchase() {
    try {
        const session = await getSession();
        if (!session) return [];

        // ADMIN and GENERAL_MANAGER can create purchases for any active project
        if (["ADMIN", "GENERAL_MANAGER"].includes(session.role)) {
            return prisma.project.findMany({
                where: { status: "IN_PROGRESS", isDeleted: false },
                orderBy: { name: "asc" },
                select: { id: true, name: true, status: true }
            });
        }

        // USER: only projects where user has PROJECT_MANAGER role
        const memberships = await prisma.projectMember.findMany({
            where: {
                userId: session.id,
                project: { status: "IN_PROGRESS", isDeleted: false }
            },
            select: { projectId: true, projectRoles: true, project: { select: { id: true, name: true, status: true } } }
        });

        const eligible = memberships.filter(m => {
            const roles = (m.projectRoles || "").split(",").map((r: string) => r.trim());
            return roles.includes("PROJECT_MANAGER");
        });

        return eligible.map(m => m.project);
    } catch (error) {
        console.error("getProjectsForPurchase Error:", error);
        return [];
    }
}

// ─── Update Project Status (Kanban server action) ─────────────────────────────
// Restricted to ADMIN only. Persists stage changes from the Kanban board.
export async function updateProjectStatus(projectId: string, status: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط المدير يمكنه تغيير حالة المشاريع" };
        }

        const allowedStatuses = ["IN_PROGRESS", "PENDING", "COMPLETED"];
        if (!allowedStatuses.includes(status)) {
            return { error: "حالة غير صالحة" };
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId, isDeleted: false }
        });
        if (!project) return { error: "المشروع غير موجود" };

        await prisma.project.update({
            where: { id: projectId },
            data: { status: status as any }
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error("updateProjectStatus Error:", error);
        return { error: "حدث خطأ أثناء تحديث حالة المشروع" };
    }
}

export async function createProject(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "ليس لديك صلاحية لإنشاء مشروع جديد" };
        }

        const validatedFields = createProjectSchema.safeParse({
            name: formData.get("name"),
            description: formData.get("description"),
            budget: formData.get("budget"),
            custody: formData.get("custody"),
            memberIds: formData.get("memberIds")
        });

        if (!validatedFields.success) {
            return { error: validatedFields.error.issues[0].message };
        }

        const { name, description, budget, custody, memberIds: membersJson } = validatedFields.data;

        // Parse membersJson. In the updated UI, it will be array of objects: { id: string, roles: string[] }
        let membersData: { id: string, roles: string[] }[] = [];
        try {
            if (membersJson) membersData = JSON.parse(membersJson);
        } catch (e) {
            console.error("Failed to parse memberIds:", e);
        }

        const managerId = session.id;

        const imageFile = formData.get("image") as File | null;
        let imagePath = undefined;

        if (imageFile && imageFile.size > 0) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `${Date.now()}-${imageFile.name}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            imagePath = `/uploads/projects/${fileName}`;
        }

        const newProject = await prisma.project.create({
            data: {
                name,
                description: description || null,
                budget: budget !== undefined && budget !== null ? budget : null,
                custody: custody !== undefined && custody !== null ? custody : 0,
                managerId,
                status: "IN_PROGRESS",
                ...(imagePath && { image: imagePath }),
                members: {
                    create: membersData.map(m => ({
                        user: { connect: { id: m.id } },
                        projectRoles: m.roles.join(",")
                    }))
                }
            }
        });

        // ── Auto-accountant: if no PROJECT_ACCOUNTANT was assigned, add GLOBAL_ACCOUNTANT ──
        const hasAccountant = membersData.some(m => m.roles.includes("PROJECT_ACCOUNTANT"));
        if (!hasAccountant) {
            const globalAccountant = await prisma.user.findFirst({
                where: { role: "GLOBAL_ACCOUNTANT", isDeleted: false },
                select: { id: true },
            });
            if (globalAccountant) {
                await prisma.projectMember.create({
                    data: {
                        projectId: newProject.id,
                        userId: globalAccountant.id,
                        projectRoles: "PROJECT_EMPLOYEE,PROJECT_ACCOUNTANT",
                    }
                });
            }
        }

        revalidatePath("/projects");
        revalidatePath("/");

        return { success: true, projectId: newProject.id };

    } catch (error) {
        console.error("Project Creation Error:", error);
        return { error: "حدث خطأ أثناء إنشاء المشروع، يرجى المحاولة مجدداً" };
    }
}

export async function updateProject(projectId: string, prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك بإجراء هذا التعديل" };

        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const status = formData.get("status") as string;
        const budget = formData.get("budget") ? Number(formData.get("budget")) : undefined;
        let membersData: { id: string, roles: string[] }[] = [];

        try {
            const mems = formData.get("memberIds") as string;
            if (mems) {
                const parsed = JSON.parse(mems);
                // E4: Validate shape — filter out any malformed entries
                if (Array.isArray(parsed)) {
                    membersData = parsed.filter(
                        (m: any) => m && typeof m.id === "string" && Array.isArray(m.roles)
                    );
                }
            }
        } catch (e) {
            console.error("Failed to parse memberIds:", e);
        }

        if (!name) return { error: "اسم المشروع مطلوب" };

        const existingProject = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!existingProject) return { error: "المشروع غير موجود" };

        // Only ADMIN or the Project's MANAGER can edit it
        if (session.role !== "ADMIN" && session.id !== existingProject.managerId) {
            return { error: "عذراً، فقط مدير النظام أو منسق هذا المشروع يمكنه تعديله" };
        }

        // تحديد الأعضاء الحاليين في قاعدة البيانات
        const existingMembers = await prisma.projectMember.findMany({
            where: { projectId },
            select: { userId: true, id: true }
        });
        const existingIds = existingMembers.map(m => m.userId);

        const incomingIds = membersData.map(m => m.id);
        const toAdd = incomingIds.filter(id => !existingIds.includes(id));
        const toRemove = existingIds.filter(id => !incomingIds.includes(id));

        const imageFile = formData.get("image") as File | null;
        let imagePath = undefined;

        if (imageFile && imageFile.size > 0) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileName = `${Date.now()}-${imageFile.name}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            imagePath = `/uploads/projects/${fileName}`;
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                name,
                description,
                status: status || existingProject.status,
                budget: budget !== undefined ? budget : existingProject.budget,
                ...(imagePath && { image: imagePath })
            }
        });

        // حذف الأعضاء المُزالين فقط إذا لم يكن لديهم عهدة نشطة
        if (toRemove.length > 0) {
            // لا نحذف عضواً لديه عهدة لم تُصف-ّ بعد
            await prisma.projectMember.deleteMany({
                where: {
                    projectId,
                    userId: { in: toRemove },
                    custodyBalance: 0
                }
            });

            // W3: Find members that could NOT be removed (still have active custody balance)
            const stuckMembers = await prisma.projectMember.findMany({
                where: {
                    projectId,
                    userId: { in: toRemove },
                    custodyBalance: { gt: 0 }
                },
                include: { user: { select: { name: true } } }
            });

            if (stuckMembers.length > 0 && updatedProject.managerId) {
                const names = stuckMembers.map(m => m.user.name).join('، ');
                await prisma.notification.create({
                    data: {
                        title: 'تنبيه: لم يتم إزالة بعض الأعضاء ⚠️',
                        content: `لم يتم إزالة الأعضاء التاليين من المشروع "${updatedProject.name}" لأن لديهم أرصدة عهدة نشطة لم تُسوَّ بعد: ${names}. يرجى تسوية العهدة أولاً ثم إزالتهم.`,
                        targetUserId: updatedProject.managerId
                    }
                });
            }
        }

        // تحديث الأدوار للأعضاء الحاليين وإضافة الجدد
        for (const member of membersData) {
            await prisma.projectMember.upsert({
                where: { projectId_userId: { projectId, userId: member.id } },
                update: { projectRoles: member.roles.join(",") },
                create: { projectId, userId: member.id, projectRoles: member.roles.join(",") }
            });
        }

        revalidatePath("/projects");
        revalidatePath(`/projects/${projectId}`);

        return { success: true, project: updatedProject };

    } catch (error) {
        console.error("Project Update Error:", error);
        return { error: "حدث خطأ أثناء تعديل المشروع" };
    }
}

export async function closeProject(projectId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط مدير النظام يمكنه إغلاق المشاريع بشكل نهائي" };
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { custodies: { where: { isClosed: false } } }
        });
        if (!project) return { error: "المشروع غير موجود" };
        if (project.status === "COMPLETED") return { error: "المشروع مغلق بالفعل" };

        // ─ Check 1: All custodies must have balance = 0 (V3 strict check) ──
        const openCustodies = project.custodies.filter((c: any) => c.balance > 0);
        if (openCustodies.length > 0) {
            return {
                error: `لا يمكن إغلاق المشروع. لا تزال هناك ${openCustodies.length} عهدة لم تُصفَّ. يرجى استرداد المبالغ المتبقية أولاً.`
            };
        }

        // ─ Check 2: No pending invoices ─────────────────────────────────────
        const pendingCount = await prisma.invoice.count({
            where: { projectId, status: "PENDING", isDeleted: false }
        });
        if (pendingCount > 0) {
            return { error: `لا يمكن إغلاق المشروع. يوجد ${pendingCount} فاتورة معلقة تنتظر مراجعة المحاسب.` };
        }

        // ─ Check 3: No unsettled out-of-pocket debts ─────────────────────────
        const unsettledDebts = await prisma.outOfPocketDebt.count({
            where: { isSettled: false, invoice: { projectId } }
        });
        if (unsettledDebts > 0) {
            return { error: `لا يمكن إغلاق المشروع. يوجد ${unsettledDebts} دَيْن شخصي للموظفين لم يُسوَّ بعد.` };
        }

        // ─ Calculate remaining budget to return to wallet ────────────────────
        // Formula: allocated - issued + returned - managerSpent
        // custodyReturned: cash physically returned by employees (frees up budget)
        // managerSpent: manager implicit custody already consumed (reduces remaining)
        const remainingBudget = Math.max(0,
            (project.budgetAllocated ?? 0)
            - (project.custodyIssued ?? 0)
            + (project.custodyReturned ?? 0)
            - (project.managerSpent ?? 0)
        );

        await prisma.$transaction(async (tx: any) => {
            if (remainingBudget > 0) {
                const wallet = await tx.companyWallet.findFirst();
                if (wallet) {
                    await tx.companyWallet.update({
                        where: { id: wallet.id },
                        data: { balance: { increment: remainingBudget }, totalIn: { increment: remainingBudget } }
                    });
                    await tx.walletEntry.create({
                        data: {
                            walletId: wallet.id, type: "RETURN_FROM_PROJECT",
                            amount: remainingBudget,
                            note: `إرجاع الرصيد المتبقي عند إغلاق المشروع: ${project.name}`,
                            createdBy: session.id
                        }
                    });
                }
            }

            await tx.project.update({
                where: { id: projectId },
                data: { status: "COMPLETED", closedAt: new Date() }
            });
        });

        revalidatePath("/projects");
        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/wallet");
        return { success: true };
    } catch (error) {
        console.error("Project Closure Error:", error);
        return { error: "حدث خطأ أثناء محاولة إغلاق المشروع" };
    }
}

// ─── Get Completed (Archived) Projects ──────────────────────────────────────
export async function getCompletedProjects() {
    try {
        const session = await getSession();
        if (!session) return [];

        const canSeeAll = isGlobalFinance(session.role) || session.role === "GENERAL_MANAGER";

        const whereClause =
            canSeeAll
                ? { status: "COMPLETED", isDeleted: false }
                : {
                    status: "COMPLETED",
                    isDeleted: false,
                    OR: [
                        { managerId: session.id },
                        { members: { some: { userId: session.id } } }
                    ]
                };

        const projects = await prisma.project.findMany({
            where: whereClause,
            orderBy: { updatedAt: "desc" },
            include: {
                manager: { select: { id: true, name: true } },
                _count: { select: { members: true, invoices: true } }
            }
        });
        return projects;
    } catch (error) {
        console.error("Completed Projects Fetch Error:", error);
        return [];
    }
}

// ─── Reopen a Completed Project (ADMIN only) ──────────────────────────────────
export async function reopenProject(projectId: string) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return { error: "فقط مدير النظام يمكنه إعادة تفعيل المشاريع" };
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return { error: "المشروع غير موجود" };
        if (project.status !== "COMPLETED") return { error: "المشروع غير مغلق" };

        await prisma.project.update({
            where: { id: projectId },
            data: { status: "IN_PROGRESS", closedAt: null }
        });

        revalidatePath("/projects");
        revalidatePath("/archives");
        revalidatePath(`/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Reopen Project Error:", error);
        return { error: "حدث خطأ أثناء إعادة تفعيل المشروع" };
    }
}

// ─── Get Manager's Available Implicit Custody for a Project ──────────────────
// Available = budgetAllocated - custodyIssued + custodyReturned - managerSpent
export async function getManagerAvailableCustody(projectId: string) {
    try {
        const session = await getSession();
        if (!session) return null;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                managerId: true,
                budgetAllocated: true,
                custodyIssued: true,
                custodyReturned: true,
                managerSpent: true,
            }
        });

        if (!project || project.managerId !== session.id) return null;

        const available = (project.budgetAllocated || 0)
            - (project.custodyIssued || 0)
            + (project.custodyReturned || 0)
            - (project.managerSpent || 0);

        return { available };
    } catch (error) {
        console.error("Get Manager Available Custody Error:", error);
        return null;
    }
}
