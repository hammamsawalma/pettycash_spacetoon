"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isGlobalFinance } from "@/lib/rbac";
import { sendPushNotification } from "@/lib/push";



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
        const apprTitle = "تمت الموافقة على طلبك المالي ✅";
        const apprBody = `وافق المدير على طلب: ${getRequestTypeLabel(req.type)}`;
        await prisma.notification.create({
            data: { title: apprTitle, content: apprBody, targetUserId: req.requestedBy }
        });
        try { await sendPushNotification({ targetUserId: req.requestedBy, title: apprTitle, body: apprBody, url: '/finance-requests' }); } catch { /* push non-critical */ }

        revalidatePath("/finance-requests");
        revalidatePath("/debts");
        revalidatePath("/wallet"); // R-7: wallet changes when SETTLE_DEBT or ALLOCATE_BUDGET
        revalidatePath("/deposits");
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
        const rejTitle = "تم رفض طلبك المالي ❌";
        const rejBody = `رُفض الطلب: ${getRequestTypeLabel(req.type)} — السبب: ${reason}`;
        await prisma.notification.create({
            data: { title: rejTitle, content: rejBody, targetUserId: req.requestedBy }
        });
        try { await sendPushNotification({ targetUserId: req.requestedBy, title: rejTitle, body: rejBody, url: '/finance-requests' }); } catch { /* push non-critical */ }

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

// ─── إنشاء طلب مالي جديد ──────────────────────────────────
export async function createFinanceRequest(data: {
    type: string;
    amount?: number;
    targetId?: string;
    note?: string;
}) {
    try {
        const session = await getSession();
        // Only ADMIN and GLOBAL_ACCOUNTANT can create finance requests
        if (!session || (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT")) {
            return { error: "ليس لديك صلاحية لإنشاء طلب مالي" };
        }

        if (!data.type) return { error: "نوع الطلب مطلوب" };

        const validTypes = ["SETTLE_DEBT", "ALLOCATE_BUDGET", "RETURN_CUSTODY", "OTHER"];
        if (!validTypes.includes(data.type)) return { error: "نوع الطلب غير صالح" };

        if (data.amount !== undefined && data.amount <= 0) {
            return { error: "المبلغ يجب أن يكون أكبر من صفر" };
        }

        const request = await prisma.financeRequest.create({
            data: {
                type: data.type,
                amount: data.amount ?? null,
                targetId: data.targetId ?? null,
                note: data.note?.trim() || null,
                requestedBy: session.id,
                status: "PENDING",
            }
        });

        // إشعار المدير بالطلب الجديد
        await sendAdminNotification(
            "طلب مالي جديد 📋",
            `${session.name || 'مستخدم'} أنشأ طلب: ${getRequestTypeLabel(data.type)}${data.amount ? ` — المبلغ: ${data.amount.toLocaleString('en-US')}` : ''}`
        );

        revalidatePath("/finance-requests");
        return { success: true, id: request.id };
    } catch (error) {
        console.error("Create Finance Request Error:", error);
        return { error: "حدث خطأ أثناء إنشاء الطلب" };
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
                const debt = await tx.outOfPocketDebt.findUnique({
                    where: { id: data.targetId },
                    include: { employee: { select: { name: true } } }
                });
                if (debt && !debt.isSettled) {
                    // B-1 FIX: Deduct from wallet (matching direct settleDebt behavior)
                    const wallet = await tx.companyWallet.findFirst();
                    if (!wallet) throw new Error("خزنة الشركة غير موجودة");
                    if (wallet.balance < debt.amount) {
                        throw new Error(`رصيد الخزنة (${wallet.balance.toLocaleString('en-US')}) غير كافٍ لتسوية هذا الدين (${debt.amount.toLocaleString('en-US')})`);
                    }

                    await tx.outOfPocketDebt.update({
                        where: { id: data.targetId },
                        data: {
                            isSettled: true,
                            settledAt: new Date(),
                            settledBy: approverId
                        }
                    });

                    await tx.companyWallet.update({
                        where: { id: wallet.id },
                        data: {
                            balance: { decrement: debt.amount },
                            totalOut: { increment: debt.amount }
                        }
                    });

                    await tx.walletEntry.create({
                        data: {
                            walletId: wallet.id,
                            type: "SETTLE_DEBT",
                            amount: debt.amount,
                            note: `تسوية دين موظف: ${debt.employee?.name || debt.employeeId} (طلب مالي)`,
                            createdBy: approverId
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
                    // v7: Only update project member/project if linked to a project
                    if (custody.projectId) {
                        await tx.projectMember.updateMany({
                            where: { projectId: custody.projectId, userId: custody.employeeId },
                            data: { custodyBalance: { decrement: remainingBalance } }
                        });
                        await tx.project.update({
                            where: { id: custody.projectId },
                            data: { custodyReturned: { increment: remainingBalance } }
                        });
                    }
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
    try { await sendPushNotification({ targetRole: 'ADMIN', title, body: content, url: '/finance-requests' }); } catch { /* push non-critical */ }
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
