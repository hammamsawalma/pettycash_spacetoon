"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isGlobalFinance } from "@/lib/rbac";



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

        // C4: ATOMIC — execute financial operation + update status in one transaction
        const execResult = await executeFinanceRequest(
            requestId,
            req.type as any,
            { amount: req.amount ?? undefined, targetId: req.targetId ?? undefined, note: req.note ?? undefined },
            session.id
        );
        if (execResult?.error) return execResult;

        // إشعار مُقدِّم الطلب (non-critical, outside transaction)
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

        // ADMIN and GENERAL_MANAGER see all pending requests; GLOBAL_ACCOUNTANT sees own
        const canSeeAll = isGlobalFinance(session.role);
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
// C4: Now wraps everything (execute + status update) in one transaction
async function executeFinanceRequest(
    requestId: string,
    type: string,
    data: { amount?: number; targetId?: string; note?: string },
    approverId: string
) {
    try {
        await prisma.$transaction(async (tx) => {
            // C4: Update request status atomically with execution
            await tx.financeRequest.update({
                where: { id: requestId },
                data: { status: "APPROVED", approvedBy: approverId, resolvedAt: new Date() }
            });

            if (type === "SETTLE_DEBT" && data.targetId) {
                const debt = await tx.outOfPocketDebt.findUnique({ where: { id: data.targetId } });
                if (debt && !debt.isSettled) {
                    await tx.outOfPocketDebt.update({
                        where: { id: data.targetId },
                        data: {
                            isSettled: true,
                            settledAt: new Date(),
                            settledBy: approverId
                        }
                    });
                }
            }

            if (type === "ALLOCATE_BUDGET" && data.targetId && data.amount && data.amount > 0) {
                const wallet = await tx.companyWallet.findFirst();
                if (!wallet) throw new Error("خزنة الشركة غير موجودة");
                if (wallet.balance < data.amount) throw new Error(`الرصيد المتاح في الخزنة (${wallet.balance}) أقل من المبلغ المطلوب (${data.amount})`);

                const project = await tx.project.findUnique({ where: { id: data.targetId } });
                if (!project) throw new Error("المشروع غير موجود");

                await tx.companyWallet.update({
                    where: { id: wallet.id },
                    data: { balance: { decrement: data.amount }, totalOut: { increment: data.amount } }
                });
                await tx.walletEntry.create({
                    data: {
                        walletId: wallet.id,
                        type: "ALLOCATE_TO_PROJECT",
                        amount: data.amount,
                        note: data.note || `تخصيص ميزانية للمشروع: ${project.name} (طلب مالي ${requestId})`,
                        createdBy: approverId
                    }
                });
                await tx.project.update({
                    where: { id: data.targetId },
                    data: { budgetAllocated: { increment: data.amount } }
                });
            }

            if (type === "RETURN_CUSTODY" && data.targetId) {
                const custody = await tx.employeeCustody.findUnique({ where: { id: data.targetId } });
                if (custody && !custody.isClosed) {
                    const remainingBalance = custody.balance;
                    await tx.employeeCustody.update({
                        where: { id: data.targetId },
                        data: { isClosed: true, closedAt: new Date(), balance: 0 }
                    });
                    await tx.projectMember.updateMany({
                        where: { projectId: custody.projectId, userId: custody.employeeId },
                        data: { custodyBalance: { decrement: remainingBalance } }
                    });
                    await tx.project.update({
                        where: { id: custody.projectId },
                        data: { custodyReturned: { increment: remainingBalance } }
                    });
                    // C3: Fixed — use approverId (User ID) instead of requestId (FinanceRequest ID)
                    await tx.custodyReturn.create({
                        data: {
                            custodyId: data.targetId,
                            amount: remainingBalance,
                            returnedBy: custody.employeeId,
                            recordedBy: approverId,
                            note: data.note || 'إرجاع عهدة عبر طلب مالي'
                        }
                    });
                }
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Execute Finance Request Error:", error);
        const message = error instanceof Error ? error.message : "فشل تنفيذ العملية المالية";
        return { error: message };
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
