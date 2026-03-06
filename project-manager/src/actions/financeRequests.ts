"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";




// ─── المدير يوافق على طلب مالي ────────────────────────────
export async function approveFinanceRequest(requestId: string) {
    try {
        const session = await getSession();
        // W1: ADMIN and GENERAL_MANAGER can approve finance requests
        if (!session || (session.role !== "ADMIN" && session.role !== "GENERAL_MANAGER")) {
            return { error: "فقط مدير النظام أو المدير العام يمكنه الموافقة على الطلبات المالية" };
        }

        const req = await prisma.financeRequest.findUnique({ where: { id: requestId } });
        if (!req) return { error: "الطلب غير موجود" };
        if (req.status !== "PENDING") return { error: "هذا الطلب تمت معالجته مسبقاً" };

        // تنفيذ العملية الفعلية
        const execResult = await executeFinanceRequest(
            requestId,
            req.type as any,
            { amount: req.amount ?? undefined, targetId: req.targetId ?? undefined, note: req.note ?? undefined }
        );
        if (execResult?.error) return execResult;

        await prisma.financeRequest.update({
            where: { id: requestId },
            data: { status: "APPROVED", approvedBy: session.id, resolvedAt: new Date() }
        });

        // إشعار مُقدِّم الطلب
        await prisma.notification.create({
            data: {
                title: "تمت الموافقة على طلبك المالي ✅",
                content: `وافق المدير على طلب: ${getRequestTypeLabel(req.type)}`,
                targetUserId: req.requestedBy
            }
        });

        revalidatePath("/finance-requests");
        revalidatePath("/debts");
        return { success: true };
    } catch (error) {
        console.error("Approve Request Error:", error);
        return { error: "حدث خطأ أثناء الموافقة" };
    }
}

// ─── المدير يرفض طلب مالي ─────────────────────────────────
export async function rejectFinanceRequest(requestId: string, reason: string) {
    try {
        const session = await getSession();
        // W1: ADMIN and GENERAL_MANAGER can reject finance requests
        if (!session || (session.role !== "ADMIN" && session.role !== "GENERAL_MANAGER")) {
            return { error: "فقط مدير النظام أو المدير العام يمكنه الرفض" };
        }

        if (!reason?.trim()) return { error: "سبب الرفض مطلوب" };

        const req = await prisma.financeRequest.findUnique({ where: { id: requestId } });
        if (!req) return { error: "الطلب غير موجود" };
        if (req.status !== "PENDING") return { error: "تمت معالجة هذا الطلب مسبقاً" };

        await prisma.financeRequest.update({
            where: { id: requestId },
            data: {
                status: "REJECTED",
                approvedBy: session.id,
                rejectReason: reason.trim(),
                resolvedAt: new Date()
            }
        });

        // إشعار مُقدِّم الطلب
        await prisma.notification.create({
            data: {
                title: "تم رفض طلبك المالي ❌",
                content: `رُفض الطلب: ${getRequestTypeLabel(req.type)} — السبب: ${reason}`,
                targetUserId: req.requestedBy
            }
        });

        revalidatePath("/finance-requests");
        return { success: true };
    } catch (error) {
        console.error("Reject Request Error:", error);
        return { error: "حدث خطأ أثناء الرفض" };
    }
}

// ─── جلب الطلبات المالية المعلقة ──────────────────────────
export async function getPendingFinanceRequests() {
    try {
        const session = await getSession();
        if (!session) return [];

        // W1: ADMIN and GENERAL_MANAGER see all pending requests; GLOBAL_ACCOUNTANT sees own
        const canSeeAll = session.role === "ADMIN" || session.role === "GENERAL_MANAGER";
        const where = canSeeAll
            ? { status: "PENDING" }
            : { requestedBy: session.id }; // المحاسب يرى طلباته فقط

        const requests = await prisma.financeRequest.findMany({
            where,
            include: {
                requester: { select: { id: true, name: true, image: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return requests;
    } catch (error) {
        console.error("Get Requests Error:", error);
        return [];
    }
}

// ─── Helper: تنفيذ العملية المالية الفعلية ────────────────
async function executeFinanceRequest(
    requestId: string,
    type: string,
    data: { amount?: number; targetId?: string; note?: string }
) {
    try {
        if (type === "SETTLE_DEBT" && data.targetId) {
            const debt = await prisma.outOfPocketDebt.findUnique({ where: { id: data.targetId } });
            if (debt && !debt.isSettled) {
                // Fetch the approver from the finance request for audit trail
                const req = await prisma.financeRequest.findUnique({
                    where: { id: requestId },
                    select: { approvedBy: true }
                });
                await prisma.outOfPocketDebt.update({
                    where: { id: data.targetId },
                    data: {
                        isSettled: true,
                        settledAt: new Date(),
                        settledBy: req?.approvedBy ?? null
                    }
                });
            }
        }

        if (type === "ALLOCATE_BUDGET" && data.targetId && data.amount && data.amount > 0) {
            // تخصيص ميزانية لمشروع من الخزنة
            const wallet = await prisma.companyWallet.findFirst();
            if (!wallet) return { error: "خزنة الشركة غير موجودة" };
            if (wallet.balance < data.amount) return { error: `الرصيد المتاح في الخزنة (${wallet.balance}) أقل من المبلغ المطلوب (${data.amount})` };

            const project = await prisma.project.findUnique({ where: { id: data.targetId } });
            if (!project) return { error: "المشروع غير موجود" };

            await prisma.$transaction([
                prisma.companyWallet.update({
                    where: { id: wallet.id },
                    data: { balance: { decrement: data.amount }, totalOut: { increment: data.amount } }
                }),
                prisma.walletEntry.create({
                    data: {
                        walletId: wallet.id,
                        type: "ALLOCATE_TO_PROJECT",
                        amount: data.amount,
                        note: data.note || `تخصيص ميزانية للمشروع: ${project.name} (طلب مالي ${requestId})`,
                        createdBy: project.managerId || wallet.id // fallback
                    }
                }),
                prisma.project.update({
                    where: { id: data.targetId },
                    data: { budgetAllocated: { increment: data.amount } }
                })
            ]);
        }

        if (type === "RETURN_CUSTODY" && data.targetId) {
            // Close the custody and sync all balance counters
            const custody = await prisma.employeeCustody.findUnique({ where: { id: data.targetId } });
            if (custody && !custody.isClosed) {
                const remainingBalance = custody.balance;
                await prisma.$transaction([
                    // Mark custody closed and zero out balance
                    prisma.employeeCustody.update({
                        where: { id: data.targetId },
                        data: { isClosed: true, closedAt: new Date(), balance: 0 }
                    }),
                    // Sync member's custody balance
                    prisma.projectMember.updateMany({
                        where: { projectId: custody.projectId, userId: custody.employeeId },
                        data: { custodyBalance: { decrement: remainingBalance } }
                    }),
                    // Record returned amount on project
                    prisma.project.update({
                        where: { id: custody.projectId },
                        data: { custodyReturned: { increment: remainingBalance } }
                    }),
                    // Create a CustodyReturn record for audit trail
                    prisma.custodyReturn.create({
                        data: {
                            custodyId: data.targetId,
                            amount: remainingBalance,
                            returnedBy: custody.employeeId,
                            recordedBy: requestId, // finance request id as recorder ref
                            note: data.note || 'إرجاع عهدة عبر طلب مالي'
                        }
                    })
                ]);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Execute Finance Request Error:", error);
        return { error: "فشل تنفيذ العملية المالية" };
    }
}

// ─── Helper: إرسال إشعار للمدير ──────────────────────────
async function sendAdminNotification(title: string, content: string) {
    await prisma.notification.create({
        data: { title, content, targetRole: "ADMIN" }
    });
}

// ─── Helper: ترجمة نوع الطلب ─────────────────────────────
function getRequestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        SETTLE_DEBT: "تسوية دين موظف",
        ALLOCATE_BUDGET: "تخصيص ميزانية",
        RETURN_CUSTODY: "إرجاع عهدة",
        OTHER: "أخرى"
    };
    return labels[type] || type;
}
