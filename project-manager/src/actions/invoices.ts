"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { isGlobalFinance, hasProjectPermission } from "@/lib/rbac";
import fs from "fs";
import path from "path";
import { markPurchaseAsBought } from "./purchases";

export async function getInvoices() {
    try {
        const session = await getSession();
        if (!session) return [];

        const isRestricted = !isGlobalFinance(session.role);

        const invoices = await prisma.invoice.findMany({
            where: {
                isDeleted: false,
                ...(isRestricted
                    ? {
                        OR: [
                            // Own invoices regardless of role
                            { creatorId: session.id },
                            // All invoices in projects where user is project manager (managerId)
                            { project: { managerId: session.id } },
                            // All invoices in projects where user holds PROJECT_MANAGER role
                            {
                                project: {
                                    members: {
                                        some: {
                                            userId: session.id,
                                            projectRoles: { contains: "PROJECT_MANAGER" }
                                        }
                                    }
                                }
                            },
                            // All invoices in projects where user holds PROJECT_ACCOUNTANT role
                            {
                                project: {
                                    members: {
                                        some: {
                                            userId: session.id,
                                            projectRoles: { contains: "PROJECT_ACCOUNTANT" }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                    : {})
            },
            orderBy: { createdAt: 'desc' },
            include: {
                project: { select: { name: true } },
                creator: { select: { name: true } },
                category: { select: { name: true, icon: true } },
                items: true,
                _count: { select: { items: true } }
            }
        });
        return invoices;
    } catch (error) {
        console.error("Invoices Fetch Error:", error);
        return [];
    }
}

export async function getInvoiceById(id: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                project: true,
                creator: { select: { id: true, name: true, image: true } },
                category: true,
                items: true,
                custody: {
                    include: { employee: { select: { name: true } } }
                },
                outOfPocketDebt: true
            }
        });
        return invoice;
    } catch (error) {
        console.error("Get Invoice Error:", error);
        return null;
    }
}

// ─── Create Invoice (with optional items / paymentSource / custodyId) ───
export async function createInvoice(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك للقيام بهذه العملية" };

        const projectId = formData.get("projectId") as string;
        // Auto-generate reference if not provided (for EMPLOYEE simplified flow)
        const referenceRaw = formData.get("reference") as string | null;
        const reference = referenceRaw?.trim() || `INV-${Date.now()}`;
        const amountStr = formData.get("amount") as string;
        const notes = formData.get("notes") as string;
        const dateStr = formData.get("date") as string;
        const type = (formData.get("type") as string) || "SALES";
        const file = formData.get("file") as File | null;
        let paymentSource = (formData.get("paymentSource") as string) || "";
        let custodyId = formData.get("custodyId") as string | null;
        const categoryId = formData.get("categoryId") as string | null;
        const purchaseId = formData.get("purchaseId") as string | null;
        // JSON-encoded array of invoice items
        const itemsJson = formData.get("items") as string | null;

        if (!projectId || !amountStr) {
            return { error: "جميع الحقول الإلزامية مطلوبة" };
        }

        // ─ Detect Manager Implicit Custody flow ─────────────────────────────────
        // When custodyId is the sentinel 'MANAGER_IMPLICIT', treat as manager's own budget
        const isManagerImplicit = custodyId === "MANAGER_IMPLICIT";
        if (isManagerImplicit) custodyId = null;

        // ─ Project access check ───────────────────────────────────────────────
        let projectIsManaged = false; // true when the session user IS the project manager
        if (!isGlobalFinance(session.role)) {
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [
                        { managerId: session.id },
                        { members: { some: { userId: session.id } } }
                    ]
                },
                include: {
                    members: {
                        where: { userId: session.id }
                    }
                }
            });

            if (!project) return { error: "غير مصرح لك بالإضافة لهذا المشروع" };

            projectIsManaged = project.managerId === session.id;
            const memberRecord = project.members[0];

            // Coordinators with no EMPLOYEE/ACCOUNTANT role cannot add invoices
            if (!projectIsManaged && memberRecord && memberRecord.projectRoles) {
                const canAddInvoice = hasProjectPermission(memberRecord.projectRoles, ["PROJECT_EMPLOYEE", "PROJECT_ACCOUNTANT"]);
                if (!canAddInvoice) {
                    return { error: "بصفتك منسقاً فقط في هذا المشروع، لا يمكنك إضافة فاتورة. العملية متاحة للموظفين والمحاسبين ومدير المشروع." };
                }
            }
        } else {
            // Global finance roles: check if they are the project manager
            const project = await prisma.project.findUnique({ where: { id: projectId }, select: { managerId: true } });
            projectIsManaged = project?.managerId === session.id;
        }

        // ─ Manager Implicit Custody validation ────────────────────────────────
        const amount = parseFloat(amountStr);

        if (isManagerImplicit) {
            // Validate that the user IS the project manager
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { managerId: true, budgetAllocated: true, custodyIssued: true, custodyReturned: true, managerSpent: true }
            });
            if (!project || project.managerId !== session.id) {
                return { error: "عهدة المدير الضمنية متاحة فقط لمدير المشروع" };
            }
            const managerAvailable = (project.budgetAllocated || 0)
                - (project.custodyIssued || 0)
                + (project.custodyReturned || 0)
                - (project.managerSpent || 0);

            if (!paymentSource) paymentSource = "CUSTODY";

            if (paymentSource === "CUSTODY" && amount > managerAvailable) {
                return { error: `الرصيد المتاح لعهدة المدير (${managerAvailable.toLocaleString()} ريال) أقل من مبلغ الفاتورة (${amount.toLocaleString()} ريال).` };
            }
            if (paymentSource === "SPLIT") {
                const custAmt = parseFloat(formData.get("custodyAmount") as string || "0");
                if (custAmt > managerAvailable) {
                    return { error: `الرصيد المتاح لعهدة المدير (${managerAvailable.toLocaleString()} ريال) أقل من الجزء المطلوب من العهدة (${custAmt.toLocaleString()} ريال).` };
                }
            }
        }

        // ─ Auto-detect paymentSource for EMPLOYEE simplified flow ─────────────────────────────────
        // When paymentSource is not provided (employee simplified UI), auto-detect based on custody balance
        const isSimplifiedFlow = !paymentSource && !isManagerImplicit;

        if (isSimplifiedFlow && projectId) {
            // Find the best active custody for this employee in this project
            const activeCustody = await prisma.employeeCustody.findFirst({
                where: {
                    employeeId: session.id,
                    projectId,
                    isConfirmed: true,
                    isClosed: false,
                    balance: { gt: 0 }
                },
                orderBy: { balance: 'desc' } // prefer highest balance
            });

            if (activeCustody) {
                if (activeCustody.balance >= amount) {
                    paymentSource = "CUSTODY";
                    custodyId = activeCustody.id;
                } else {
                    paymentSource = "SPLIT";
                    custodyId = activeCustody.id;
                }
            } else {
                // No active custody → full out-of-pocket
                paymentSource = "PERSONAL";
                custodyId = null;
            }
        } else if (!paymentSource) {
            paymentSource = "CUSTODY";
        }

        // ─ Compute split amounts for auto-detected SPLIT ────────────────────────────────────────────
        let custodyAmountRaw = formData.get("custodyAmount") as string | null;
        let pocketAmountRaw = formData.get("pocketAmount") as string | null;

        // For auto-detected SPLIT, compute amounts automatically
        if (isSimplifiedFlow && paymentSource === "SPLIT" && custodyId) {
            const activeCust = await prisma.employeeCustody.findUnique({ where: { id: custodyId } });
            if (activeCust) {
                const custPortion = activeCust.balance;
                custodyAmountRaw = custPortion.toString();
                pocketAmountRaw = (amount - custPortion).toString();
            }
        }

        let custodyAmount = custodyAmountRaw ? parseFloat(custodyAmountRaw) : null;
        let pocketAmount = pocketAmountRaw ? parseFloat(pocketAmountRaw) : null;

        // ─ Employee Custody validation (skip for manager implicit) ────────────
        if (!isManagerImplicit && (paymentSource === "CUSTODY" || paymentSource === "SPLIT") && custodyId) {
            const custody = await prisma.employeeCustody.findUnique({ where: { id: custodyId } });
            if (!custody || custody.employeeId !== session.id) {
                return { error: "العهدة غير موجودة أو لا تخصك" };
            }
            if (!custody.isConfirmed) {
                return { error: "يجب تأكيد استلام العهدة أولاً قبل رفع الفواتير" };
            }
            if (custody.isClosed) {
                return { error: "هذه العهدة مغلقة" };
            }

            // ─ SPLIT: check custody portion doesn't exceed balance
            if (paymentSource === "SPLIT" && !isSimplifiedFlow) {
                if (!custodyAmount || !pocketAmount) {
                    return { error: "عند الدفع المختلط يجب تحديد الجزءين" };
                }
                const total = parseFloat(amountStr);
                if (Math.abs((custodyAmount + pocketAmount) - total) > 0.01) {
                    return { error: "مجموع الجزءين يجب أن يساوي إجمالي الفاتورة" };
                }
                if (custodyAmount > custody.balance) {
                    return { error: `رصيد عهدتك (${custody.balance.toLocaleString()} ريال) أقل من الجزء المطلوب من العهدة (${custodyAmount.toLocaleString()} ريال)` };
                }
            }

            // ─ CUSTODY only: full amount must fit in balance (only for manual flow)
            if (paymentSource === "CUSTODY" && !isSimplifiedFlow) {
                if (amount > custody.balance) {
                    return {
                        error: `رصيد عهدتك (${custody.balance.toLocaleString()} ريال) أقل من مبلغ الفاتورة (${amount.toLocaleString()} ريال).
 هل تريد الدفع المختلط (SPLIT)? حدد GLIT من العهدة والباقي من جيبك` };
                }
            }
        }

        let filePathDb: string | undefined = undefined;
        if (file && file.size > 0) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                return { error: "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة (JPG/PNG)" };
            }
            if (file.size > 5 * 1024 * 1024) {
                return { error: "حجم الملف يتجاوز الحد المسموح به (5 ميجابايت)" };
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            filePathDb = `/uploads/${fileName}`;
        }

        // Parse invoice items
        let items: Array<{ name: string; itemNumber?: string; description?: string; quantity: number; unitPrice?: number; totalPrice: number }> = [];
        if (itemsJson) {
            try {
                items = JSON.parse(itemsJson);
            } catch {
                return { error: "بيانات بنود الفاتورة غير صالحة" };
            }
        }

        // ─ Check AutoApprovalRule ─────────────────────────────────────────────
        // If an active rule exists and the invoice amount qualifies, auto-approve
        let autoApprove = false;
        try {
            const autoRule = await prisma.autoApprovalRule.findFirst({ where: { isActive: true } });
            if (autoRule && amount <= autoRule.maxAmount) {
                // requiresManager: only auto-approve if the creator is the project manager
                if (autoRule.requiresManager) {
                    autoApprove = projectIsManaged; // only true when creator === project.managerId
                } else {
                    autoApprove = true;
                }
            }
        } catch {
            // If the rule lookup fails, fall back to manual review
            autoApprove = false;
        }
        const initialStatus = autoApprove ? "APPROVED" : "PENDING";

        const newInvoice = await prisma.invoice.create({
            data: {
                projectId,
                reference,
                type,
                amount,
                notes: notes || null,
                date: dateStr ? new Date(dateStr) : new Date(),
                status: initialStatus,
                creatorId: session.id,
                paymentSource,
                custodyAmount: custodyAmount ?? null,
                pocketAmount: pocketAmount ?? null,
                custodyId: custodyId || null,
                categoryId: categoryId || null,
                ...(filePathDb && { filePath: filePathDb }),
                items: items.length > 0 ? {
                    create: items.map(item => ({
                        name: item.name,
                        itemNumber: item.itemNumber || null,
                        description: item.description || null,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice || null,
                        totalPrice: item.totalPrice
                    }))
                } : undefined
            }
        });

        // ─ Create debt record for PERSONAL or SPLIT payments ────────────
        if (paymentSource === "PERSONAL") {
            await prisma.outOfPocketDebt.create({
                data: {
                    invoiceId: newInvoice.id,
                    employeeId: session.id,
                    amount // full amount owed
                }
            });
        } else if (paymentSource === "SPLIT" && pocketAmount && pocketAmount > 0) {
            await prisma.outOfPocketDebt.create({
                data: {
                    invoiceId: newInvoice.id,
                    employeeId: session.id,
                    amount: pocketAmount // only the out-of-pocket portion
                }
            });
        }

        // I1: If auto-approved, apply the same balance side-effects as updateInvoiceStatus(APPROVED)
        if (autoApprove && newInvoice.id) {
            // Write approvedBy + approvedAt
            await prisma.invoice.update({
                where: { id: newInvoice.id },
                data: { approvedBy: session.id, approvedAt: new Date() }
            });

            const deductAmount = paymentSource === "SPLIT"
                ? (custodyAmount ?? amount)
                : amount;

            // Employee custody balance deduction
            if (custodyId && (paymentSource === "CUSTODY" || paymentSource === "SPLIT")) {
                await prisma.employeeCustody.update({
                    where: { id: custodyId },
                    data: { balance: { decrement: deductAmount } }
                });
                if (projectId) {
                    await prisma.projectMember.updateMany({
                        where: { projectId, userId: session.id },
                        data: { custodyBalance: { decrement: deductAmount } }
                    });
                }
            }

            // Manager implicit custody deduction (no custodyId, creator = manager)
            if (!custodyId && projectId && (paymentSource === "CUSTODY" || paymentSource === "SPLIT") && projectIsManaged) {
                await prisma.project.update({
                    where: { id: projectId },
                    data: { managerSpent: { increment: deductAmount } }
                });
            }
        }

        // ─ Fan-out notifications to ALL accountants on this project ───
        if (initialStatus === "PENDING" && projectId) {
            const accountantMembers = await prisma.projectMember.findMany({
                where: { projectId }
            });
            const accountantIds = accountantMembers
                .filter(m => hasProjectPermission(m.projectRoles, ["PROJECT_ACCOUNTANT"]))
                .map(m => m.userId);

            for (const accountantId of accountantIds) {
                await prisma.notification.create({
                    data: {
                        title: 'فاتورة جديدة تنتظر مراجعتك 📄',
                        content: `مرفوعة بواسطة ${session.name || session.id} — المبلغ: ${amount.toLocaleString()} ريال`,
                        targetUserId: accountantId
                    }
                });
            }

            // Also notify global accountants if none assigned at project level
            if (accountantIds.length === 0) {
                await prisma.notification.create({
                    data: {
                        title: 'فاتورة جديدة تنتظر المراجعة',
                        content: `مرفوعة بواسطة ${session.name || session.id} — المبلغ: ${amount.toLocaleString()} ريال`,
                        targetRole: "GLOBAL_ACCOUNTANT"
                    }
                });
            }
        }

        if (purchaseId) {
            await markPurchaseAsBought(purchaseId, newInvoice.id);
            revalidatePath("/purchases");
        }

        revalidatePath("/invoices");
        revalidatePath("/");
        return { success: true, invoiceId: newInvoice.id, autoApproved: autoApprove };

    } catch (error) {
        console.error("Invoice Creation Error:", error);
        return { error: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الفاتورة" };
    }
}

// ─── Update Invoice Status (with mandatory rejectionReason) ───────────────
export async function updateInvoiceStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "PENDING",
    rejectionReason?: string
) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        const existingInvoice = await prisma.invoice.findUnique({
            where: { id },
            include: { outOfPocketDebt: true, project: true }
        });
        if (!existingInvoice) return { error: "الفاتورة غير موجودة" };

        // I6: Reject if soft-deleted
        if (existingInvoice.isDeleted) return { error: "لا يمكن تعديل فاتورة محذوفة" };

        // I3: Idempotency — validate the transition is meaningful
        const VALID_TRANSITIONS: Record<string, string[]> = {
            "PENDING": ["APPROVED", "REJECTED"],
            "APPROVED": ["PENDING", "REJECTED"],
            "REJECTED": ["PENDING"],
        };
        const allowedNext = VALID_TRANSITIONS[existingInvoice.status] ?? [];
        if (!allowedNext.includes(status)) {
            return { error: `لا يمكن تحويل الفاتورة من "${existingInvoice.status}" إلى "${status}". التحويل غير مسموح به.` };
        }

        // ─ Authorization: global finance OR project accountant ──────────────────
        const isGlobalAuth = isGlobalFinance(session.role);
        let isProjectAuth = false;

        if (!isGlobalAuth && existingInvoice.projectId) {
            const memberRecord = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId: existingInvoice.projectId, userId: session.id } }
            });
            if (memberRecord) {
                isProjectAuth = hasProjectPermission(memberRecord.projectRoles, ["PROJECT_ACCOUNTANT"]);
            }
        }

        if (!isGlobalAuth && !isProjectAuth) {
            return { error: "غير مصرح لك بتغيير حالة الفاتورة" };
        }

        if (session.role === "ADMIN" && existingInvoice.projectId && existingInvoice.project?.managerId !== session.id) {
            return { error: "غير مصرح لك بتغيير حالة فاتورة في مشروع لا تديره" };
        }

        // Separation of Duties
        // Exception: ADMIN and finance roles (GLOBAL_ACCOUNTANT, PROJECT_ACCOUNTANT) may self-approve
        const isAccountantRole = session.role === "ADMIN" || session.role === "GLOBAL_ACCOUNTANT" || isProjectAuth;
        if (existingInvoice.creatorId === session.id && !isAccountantRole) {
            return { error: "لا يمكن اعتماد أو رفض فاتورة قمت بإنشائها (فصل المهام)" };
        }

        // Mandatory rejection reason
        if (status === "REJECTED") {
            if (!rejectionReason?.trim()) {
                return { error: "سبب الرفض إجباري عند رفض الفاتورة" };
            }
        }

        // EC2: Wrap entire state-change + balance-update in a SERIALIZABLE transaction
        // This ensures two simultaneous approval requests cannot both pass the idempotency
        // check and double-deduct the custody balance.
        await prisma.$transaction(async (tx) => {
            // Re-read inside the transaction to get the locked, current state
            const lockedInvoice = await tx.invoice.findUnique({
                where: { id },
                include: { outOfPocketDebt: true, project: true }
            });
            if (!lockedInvoice) throw new Error("الفاتورة غير موجودة");
            if (lockedInvoice.isDeleted) throw new Error("لا يمكن تعديل فاتورة محذوفة");

            // Re-validate transition against locked state (catches race condition)
            const VALID_TRANSITIONS: Record<string, string[]> = {
                "PENDING": ["APPROVED", "REJECTED"],
                "APPROVED": ["PENDING", "REJECTED"],
                "REJECTED": ["PENDING"],
            };
            const allowedNext = VALID_TRANSITIONS[lockedInvoice.status] ?? [];
            if (!allowedNext.includes(status)) {
                throw new Error(`لا يمكن تحويل الفاتورة من "${lockedInvoice.status}" إلى "${status}". التحويل غير مسموح به.`);
            }

            // Update invoice status — I10: write timestamps
            await tx.invoice.update({
                where: { id },
                data: {
                    status,
                    rejectionReason: status === "REJECTED" ? rejectionReason : null,
                    ...(status === "APPROVED" ? { approvedBy: session.id, approvedAt: new Date(), rejectedBy: null, rejectedAt: null } : {}),
                    ...(status === "REJECTED" ? { rejectedBy: session.id, rejectedAt: new Date(), approvedBy: null, approvedAt: null } : {}),
                    ...(status === "PENDING" ? { approvedBy: null, approvedAt: null, rejectedBy: null, rejectedAt: null } : {}),
                }
            });

            // ─ Custody Balance Management ─────────────────────────────────────
            if (lockedInvoice.custodyId && (lockedInvoice.paymentSource === "CUSTODY" || lockedInvoice.paymentSource === "SPLIT")) {
                const wasApproved = lockedInvoice.status === "APPROVED";
                const nowApproved = status === "APPROVED";

                if (!wasApproved && nowApproved) {
                    const deductAmount = lockedInvoice.paymentSource === "SPLIT"
                        ? (lockedInvoice.custodyAmount ?? lockedInvoice.amount)
                        : lockedInvoice.amount;

                    await tx.employeeCustody.update({
                        where: { id: lockedInvoice.custodyId },
                        data: { balance: { decrement: deductAmount } }
                    });
                    if (lockedInvoice.projectId) {
                        await tx.projectMember.updateMany({
                            where: { projectId: lockedInvoice.projectId, userId: lockedInvoice.creatorId },
                            data: { custodyBalance: { decrement: deductAmount } }
                        });
                    }
                } else if (wasApproved && !nowApproved) {
                    const restoreAmount = lockedInvoice.paymentSource === "SPLIT"
                        ? (lockedInvoice.custodyAmount ?? lockedInvoice.amount)
                        : lockedInvoice.amount;

                    await tx.employeeCustody.update({
                        where: { id: lockedInvoice.custodyId },
                        data: { balance: { increment: restoreAmount } }
                    });
                    if (lockedInvoice.projectId) {
                        await tx.projectMember.updateMany({
                            where: { projectId: lockedInvoice.projectId, userId: lockedInvoice.creatorId },
                            data: { custodyBalance: { increment: restoreAmount } }
                        });
                    }
                }
            }

            // ─ Manager Implicit Custody Balance Management ─────────────────────
            if (!lockedInvoice.custodyId && lockedInvoice.projectId &&
                (lockedInvoice.paymentSource === "CUSTODY" || lockedInvoice.paymentSource === "SPLIT")) {
                const project = await tx.project.findUnique({
                    where: { id: lockedInvoice.projectId },
                    select: { managerId: true }
                });
                if (project?.managerId === lockedInvoice.creatorId) {
                    const wasApproved = lockedInvoice.status === "APPROVED";
                    const nowApproved = status === "APPROVED";
                    const delta = lockedInvoice.paymentSource === "SPLIT"
                        ? (lockedInvoice.custodyAmount ?? lockedInvoice.amount)
                        : lockedInvoice.amount;

                    if (!wasApproved && nowApproved) {
                        await tx.project.update({
                            where: { id: lockedInvoice.projectId },
                            data: { managerSpent: { increment: delta } }
                        });
                    } else if (wasApproved && !nowApproved) {
                        await tx.project.update({
                            where: { id: lockedInvoice.projectId },
                            data: { managerSpent: { decrement: delta } }
                        });
                    }
                }
            }

            // ─ OutOfPocketDebt Management ──────────────────────────────────────
            if (lockedInvoice.outOfPocketDebt) {
                const debt = lockedInvoice.outOfPocketDebt;
                const wasRejected = lockedInvoice.status === "REJECTED";
                const nowRejected = status === "REJECTED";

                if (!wasRejected && nowRejected) {
                    await tx.outOfPocketDebt.update({
                        where: { id: debt.id },
                        data: { isSettled: true, settledAt: new Date(), settledBy: session.id }
                    });
                } else if (wasRejected && !nowRejected) {
                    await tx.outOfPocketDebt.update({
                        where: { id: debt.id },
                        data: { isSettled: false, settledAt: null, settledBy: null }
                    });
                }
            }
        }, {
            // Serializable isolation: prevents phantom reads between the status check and balance updates
            isolationLevel: "Serializable"
        });

        revalidatePath("/invoices");
        revalidatePath(`/invoices/${id}`);
        revalidatePath("/debts");
        return { success: true };
    } catch (error) {
        console.error("Update Invoice Status Error:", error);
        return { error: "حدث خطأ أثناء تحديث حالة الفاتورة" };
    }
}

