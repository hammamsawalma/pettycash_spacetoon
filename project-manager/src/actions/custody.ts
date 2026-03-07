"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getUserRolesInProject } from "@/lib/roles";
import { isGlobalFinance, hasProjectPermission } from "@/lib/rbac";

// ─── Issue Custody to Employee ──────────────────────────
export async function issueCustody(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        const projectId = formData.get("projectId") as string;
        const employeeId = formData.get("employeeId") as string;
        const amount = parseFloat(formData.get("amount") as string);
        const method = (formData.get("method") as string) || "CASH";
        const note = formData.get("note") as string;

        if (!projectId || !employeeId || isNaN(amount) || amount <= 0) {
            return { error: "جميع الحقول مطلوبة والمبلغ يجب أن يكون أكبر من صفر" };
        }

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return { error: "المشروع غير موجود" };

        // Block custody issuance for non-active projects
        if (project.status !== "IN_PROGRESS") {
            return { error: "لا يمكن صرف عهدة لمشروع مكتمل أو متوقف" };
        }

        // v3: Only ADMIN (system-level) + PROJECT_ACCOUNTANT (project-level) can issue custody
        // GLOBAL_ACCOUNTANT is also allowed (they are auto-added as project accountant)
        let isAuthorized = session.role === "ADMIN" || session.role === "GLOBAL_ACCOUNTANT";

        // Check if user is a PROJECT_ACCOUNTANT in this specific project
        const projectRoles = await getUserRolesInProject(projectId, session.id);
        if (hasProjectPermission(projectRoles, ["PROJECT_ACCOUNTANT"])) {
            isAuthorized = true;
        }

        if (!isAuthorized) {
            return { error: "ليس لديك صلاحية لصرف عهدة في هذا المشروع" };
        }

        // Check employee is a member of this project
        const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: employeeId } }
        });
        if (!membership) return { error: "الموظف المحدد ليس عضواً في هذا المشروع" };

        // E2 + C4: Budget check AND all writes are wrapped in one atomic transaction.
        // This prevents the race condition where two concurrent custody issuances both pass
        // the pre-check and collectively exceed the project budget.
        let custody: { id: string };
        await prisma.$transaction(async (tx: any) => {
            // Re-read project inside tx to get the locked, current budget figures
            const lockedProject = await tx.project.findUnique({ where: { id: projectId } });
            if (!lockedProject) throw new Error("المشروع غير موجود");
            if (lockedProject.status !== "IN_PROGRESS") throw new Error("لا يمكن صرف عهدة لمشروع مكتمل أو متوقف");

            // C1: Include custodyReturned — returned cash frees up budget for re-issuance
            const available = (lockedProject.budgetAllocated ?? 0) - (lockedProject.custodyIssued ?? 0) + (lockedProject.custodyReturned ?? 0);
            if (amount > available) {
                throw new Error(`ميزانية المشروع المتاحة (${available.toLocaleString()}) أقل من المبلغ المطلوب (${amount.toLocaleString()})`);
            }

            // Create custody record — balance starts equal to amount
            custody = await tx.employeeCustody.create({
                data: {
                    projectId,
                    employeeId,
                    memberId: membership.id,
                    amount,
                    balance: amount,
                    method,
                    note: note || null,
                }
            });

            // Update project custodyIssued + member balance atomically
            await tx.project.update({
                where: { id: projectId },
                data: { custodyIssued: { increment: amount } }
            });
            await tx.projectMember.update({
                where: { id: membership.id },
                data: { custodyBalance: { increment: amount } }
            });
        });

        // Notify employee outside transaction (non-critical, failure will not roll back custody)
        await prisma.notification.create({
            data: {
                title: 'تم صرف عهدة لك ✅',
                content: `تم صرف مبلغ ${amount.toLocaleString()} ريال — يرجى تأكيد الاستلام`,
                targetUserId: employeeId
            }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/projects");

        return { success: true, custodyId: custody!.id };
    } catch (error) {
        console.error("Issue Custody Error:", error);
        return { error: "حدث خطأ أثناء صرف العهدة" };
    }
}

// ─── Employee confirms receiving custody ─────────────────
export async function confirmCustodyReceipt(custodyId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        const custody = await prisma.employeeCustody.findUnique({
            where: { id: custodyId }
        });
        if (!custody) return { error: "العهدة غير موجودة" };
        if (custody.employeeId !== session.id) return { error: "لا يمكنك تأكيد استلام عهدة شخص آخر" };
        if (custody.isConfirmed) return { error: "تم تأكيد الاستلام مسبقاً" };

        await prisma.employeeCustody.update({
            where: { id: custodyId },
            data: {
                isConfirmed: true,
                confirmedAt: new Date(),
                confirmation: {
                    create: {
                        signature: `CONF-${Date.now()}`
                    }
                }
            }
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Confirm Custody Error:", error);
        return { error: "حدث خطأ أثناء تأكيد الاستلام" };
    }
}

// ─── Employee rejects an unconfirmed custody ─────────────
export async function rejectCustody(custodyId: string, reason?: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        const custody = await prisma.employeeCustody.findUnique({
            where: { id: custodyId },
            include: { project: true }
        });
        if (!custody) return { error: "العهدة غير موجودة" };
        if (custody.employeeId !== session.id) return { error: "لا يمكنك رفض عهدة شخص آخر" };
        if (custody.isConfirmed) return { error: "لا يمكن رفض عهدة تم تأكيد استلامها بالفعل" };

        await prisma.$transaction(async (tx) => {
            // Restore project budget
            await tx.project.update({
                where: { id: custody.projectId },
                data: { custodyIssued: { decrement: custody.amount } }
            });

            // Restore project member balance
            if (custody.memberId) {
                await tx.projectMember.update({
                    where: { id: custody.memberId },
                    data: { custodyBalance: { decrement: custody.amount } }
                });
            }

            // Notify the project manager (if exists) about the rejection
            if (custody.project.managerId) {
                await tx.notification.create({
                    data: {
                        title: 'تم رفض استلام عهدة ❌',
                        content: `قام ${session.name} برفض عهدة بقيمة ${custody.amount.toLocaleString()} ريال للمشروع "${custody.project.name}".${reason ? `\nالسبب: ${reason}` : ''}`,
                        targetUserId: custody.project.managerId
                    }
                });
            }

            // Delete the custody record entirely
            await tx.employeeCustody.delete({
                where: { id: custodyId }
            });
        });

        revalidatePath("/");
        revalidatePath("/my-custodies");
        return { success: true };
    } catch (error) {
        console.error("Reject Custody Error:", error);
        return { error: "حدث خطأ أثناء رفض العهدة" };
    }
}

// ─── Get Custodies for a Project ─────────────────────────
export async function getProjectCustodies(projectId: string) {
    try {
        const session = await getSession();
        if (!session) return [];

        // M1: Authorization check — global finance roles, project manager, or project member
        const isGlobalAuth = isGlobalFinance(session.role) || session.role === "GENERAL_MANAGER";
        let isManager = false;
        let isFinanceRole = false; // PROJECT_MANAGER or PROJECT_ACCOUNTANT

        if (!isGlobalAuth) {
            const project = await prisma.project.findUnique({ where: { id: projectId }, select: { managerId: true } });
            isManager = project?.managerId === session.id;
            const membership = !isManager
                ? await prisma.projectMember.findUnique({
                    where: { projectId_userId: { projectId, userId: session.id } }
                })
                : null;
            if (!isManager && !membership) {
                return []; // not a member of this project
            }
            // V2: Check if this member is a manager or accountant at project level
            if (membership) {
                isFinanceRole = hasProjectPermission(membership.projectRoles, ["PROJECT_MANAGER", "PROJECT_ACCOUNTANT"]);
            }
        }

        // V2: Only managers / accountants / global finance roles see ALL custodies
        // Regular members (PROJECT_EMPLOYEE, COORDINATOR) only see their OWN custody
        const canSeeAll = isGlobalAuth || isManager || isFinanceRole;

        const custodies = await prisma.employeeCustody.findMany({
            where: {
                projectId,
                // V2: Restrict to own custody if not a privileged role
                ...(canSeeAll ? {} : { employeeId: session.id })
            },
            include: {
                employee: { select: { id: true, name: true, image: true } },
                confirmation: true,
                invoices: {
                    where: { isDeleted: false },
                    select: { id: true, amount: true, status: true }
                },
                returns: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return custodies;
    } catch (error) {
        console.error("Get Custodies Error:", error);
        return [];
    }
}

// ─── Get Custodies for the Current Employee ───────────────
export async function getMyCustodies() {
    try {
        const session = await getSession();
        if (!session) return [];

        const custodies = await prisma.employeeCustody.findMany({
            where: { employeeId: session.id },
            include: {
                project: { select: { id: true, name: true, manager: { select: { name: true } } } },
                confirmation: true,
                invoices: {
                    where: { isDeleted: false },
                    select: { id: true, amount: true, status: true, paymentSource: true }
                },
                returns: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // V1: Clamp negative balances to 0 for employee display
        // Negative balances are an internal accounting concept visible only to managers/accountants
        return custodies.map(c => ({
            ...c,
            balance: Math.max(0, c.balance)
        }));
    } catch (error) {
        console.error("Get My Custodies Error:", error);
        return [];
    }
}

// ─── Return Remaining Cash at Project Close ────────────────
export async function returnCustodyBalance(
    custodyId: string,
    returnedAmount: number,
    note?: string
) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح" };

        const custody = await prisma.employeeCustody.findUnique({
            where: { id: custodyId },
            include: { project: true }
        });
        if (!custody) return { error: "العهدة غير موجودة" };

        // Authorization: ADMIN (project manager), GLOBAL_ACCOUNTANT, GENERAL_MANAGER, or PROJECT_MANAGER/ACCOUNTANT
        let isAuthorized = false;
        if (session.role === "GENERAL_MANAGER" || session.role === "GLOBAL_ACCOUNTANT") {
            isAuthorized = true;
        } else if (session.role === "ADMIN" && custody.project.managerId === session.id) {
            isAuthorized = true;
        } else {
            const memberRecord = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId: custody.projectId, userId: session.id } }
            });
            if (memberRecord && hasProjectPermission(memberRecord.projectRoles, ["PROJECT_MANAGER", "PROJECT_ACCOUNTANT"])) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return { error: "ليس لديك صلاحية لتسجيل إرجاع العهدة" };
        }
        if (custody.isClosed) return { error: "هذه العهدة مغلقة مسبقاً" };
        // H3: Guard against zero or negative return amounts
        if (!returnedAmount || returnedAmount <= 0) {
            return { error: "المبلغ يجب أن يكون أكبر من صفر" };
        }
        if (returnedAmount > custody.balance) {
            return { error: `المبلغ المُرجَع (${returnedAmount}) أكبر من رصيد العهدة (${custody.balance})` };
        }

        const newBalance = custody.balance - returnedAmount;
        // M1: Use tolerance instead of === 0 to handle float precision issues
        const willClose = Math.abs(newBalance) < 0.01;

        await prisma.$transaction([
            // تسجيل عملية الإرجاع
            prisma.custodyReturn.create({
                data: {
                    custodyId,
                    amount: returnedAmount,
                    returnedBy: custody.employeeId,
                    recordedBy: session.id,
                    note: note || null
                }
            }),
            // تحديث رصيد العهدة
            prisma.employeeCustody.update({
                where: { id: custodyId },
                data: {
                    balance: newBalance,
                    isClosed: willClose,
                    closedAt: willClose ? new Date() : null
                }
            }),
            // تحديث رصيد عضو المشروع
            prisma.projectMember.updateMany({
                where: { projectId: custody.projectId, userId: custody.employeeId },
                data: { custodyBalance: { decrement: returnedAmount } }
            }),
            // تحديث custodyReturned على المشروع
            prisma.project.update({
                where: { id: custody.projectId },
                data: { custodyReturned: { increment: returnedAmount } }
            })
        ]);

        revalidatePath(`/projects/${custody.projectId}`);
        revalidatePath(`/custody/${custodyId}`);
        return { success: true, closed: willClose, remainingBalance: newBalance };
    } catch (error) {
        console.error("Return Custody Error:", error);
        return { error: "حدث خطأ أثناء تسجيل الإرجاع" };
    }
}
