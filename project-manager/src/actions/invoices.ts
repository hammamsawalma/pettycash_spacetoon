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
                            // All invoices in projects where user is a member
                            {
                                project: {
                                    members: {
                                        some: {
                                            userId: session.id
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
                // P4: Removed eager items[] — list view only needs count, detail page fetches separately
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
        const session = await getSession();
        if (!session) return null;

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
        if (!invoice) return null;

        // Auth: creator, global finance roles, or project member can read
        if (isGlobalFinance(session.role)) return invoice;
        if (invoice.creator?.id === session.id) return invoice;
        if (invoice.projectId) {
            const member = await prisma.projectMember.findFirst({
                where: { projectId: invoice.projectId, userId: session.id }
            });
            if (member) return invoice;
        }
        return null; // unauthorized
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

        // v5: Company expense scope
        const expenseScope = (formData.get("expenseScope") as string) || "PROJECT";
        const isCompanyExpense = expenseScope === "COMPANY";

        // v5: Company expenses — only ADMIN + GLOBAL_ACCOUNTANT
        if (isCompanyExpense) {
            if (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT") {
                return { error: "مصاريف الشركة متاحة للمحاسب العام ومدير النظام فقط" };
            }
            if (!categoryId) {
                return { error: "تصنيف المصروف إلزامي لمصاريف الشركة" };
            }
            if (!amountStr) {
                return { error: "المبلغ إلزامي" };
            }
        } else {
            // Project expenses require projectId
            if (!projectId || !amountStr) {
                return { error: "جميع الحقول الإلزامية مطلوبة" };
            }
        }

        // ─ Detect Manager Implicit Custody flow ─────────────────────────────────
        // When custodyId is the sentinel 'MANAGER_IMPLICIT', treat as manager's own budget
        const isManagerImplicit = custodyId === "MANAGER_IMPLICIT";
        if (isManagerImplicit) custodyId = null;

        // ─ Project access check (skip for company expenses) ────────────────────
        let projectIsManaged = false; // true when the session user IS the project manager
        if (isCompanyExpense) {
            // Company expenses: no project required, set paymentSource
            paymentSource = "COMPANY_DIRECT";
            custodyId = null;
        } else if (!isGlobalFinance(session.role)) {
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

            // Check project is still active
            if (project.status !== "IN_PROGRESS") {
                return { error: "لا يمكن إضافة فاتورة لمشروع مكتمل أو متوقف" };
            }

            projectIsManaged = project.managerId === session.id;
            const memberRecord = project.members[0];

            // Coordinators with no EMPLOYEE role cannot add invoices
            if (!projectIsManaged && memberRecord && memberRecord.projectRoles) {
                const canAddInvoice = hasProjectPermission(memberRecord.projectRoles, ["PROJECT_EMPLOYEE"]);
                if (!canAddInvoice) {
                    return { error: "بصفتك منسقاً فقط في هذا المشروع، لا يمكنك إضافة فاتورة. العملية متاحة للموظفين ومدير المشروع." };
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
        // Skip for company expenses (already set to COMPANY_DIRECT above)
        const isSimplifiedFlow = !paymentSource && !isManagerImplicit && !isCompanyExpense;

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
        // v5: Company expenses are NEVER auto-approved
        let autoApprove = false;
        if (!isCompanyExpense) {
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
        }
        const initialStatus = autoApprove ? "APPROVED" : "PENDING";

        // ─ ATOMIC: Create invoice + debt + auto-approve balance deductions in one transaction ─
        const result = await prisma.$transaction(async (tx) => {
            const newInvoice = await tx.invoice.create({
                data: {
                    projectId: isCompanyExpense ? null : projectId,
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
                    expenseScope: isCompanyExpense ? "COMPANY" : "PROJECT",
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
                await tx.outOfPocketDebt.create({
                    data: {
                        invoiceId: newInvoice.id,
                        employeeId: session.id,
                        amount // full amount owed
                    }
                });
            } else if (paymentSource === "SPLIT" && pocketAmount && pocketAmount > 0) {
                await tx.outOfPocketDebt.create({
                    data: {
                        invoiceId: newInvoice.id,
                        employeeId: session.id,
                        amount: pocketAmount // only the out-of-pocket portion
                    }
                });
            }

            // I1: If auto-approved, apply the same balance side-effects as updateInvoiceStatus(APPROVED)
            if (autoApprove) {
                // Write approvedBy + approvedAt
                await tx.invoice.update({
                    where: { id: newInvoice.id },
                    data: { approvedBy: session.id, approvedAt: new Date() }
                });

                const deductAmount = paymentSource === "SPLIT"
                    ? (custodyAmount ?? amount)
                    : amount;

                // Employee custody balance deduction
                if (custodyId && (paymentSource === "CUSTODY" || paymentSource === "SPLIT")) {
                    await tx.employeeCustody.update({
                        where: { id: custodyId },
                        data: { balance: { decrement: deductAmount } }
                    });
                    if (projectId) {
                        await tx.projectMember.updateMany({
                            where: { projectId, userId: session.id },
                            data: { custodyBalance: { decrement: deductAmount } }
                        });
                    }
                }

                // Manager implicit custody deduction (no custodyId, creator = manager)
                if (!custodyId && projectId && (paymentSource === "CUSTODY" || paymentSource === "SPLIT") && projectIsManaged) {
                    await tx.project.update({
                        where: { id: projectId },
                        data: { managerSpent: { increment: deductAmount } }
                    });
                }
            }

            return newInvoice;
        });

        // ─ Non-critical: Notifications (outside transaction — failure won't corrupt data) ───
        // v4+v5: Notify GLOBAL_ACCOUNTANT, but skip if the creator IS the accountant (UI-6)
        if (initialStatus === "PENDING" && session.role !== "GLOBAL_ACCOUNTANT") {
            const scopeLabel = isCompanyExpense ? "مصاريف شركة" : "مشاريع";
            await prisma.notification.create({
                data: {
                    title: `فاتورة جديدة تنتظر المراجعة 📄 (${scopeLabel})`,
                    content: `مرفوعة بواسطة ${session.name || session.id} — المبلغ: ${amount.toLocaleString()} ريال`,
                    targetRole: "GLOBAL_ACCOUNTANT"
                }
            });
        }

        if (purchaseId) {
            await markPurchaseAsBought(purchaseId, result.id);
            revalidatePath("/purchases");
        }

        revalidatePath("/invoices");
        revalidatePath("/");
        // R-4: Revalidate project page when auto-approved invoice deducted custody
        if (projectId) revalidatePath(`/projects/${projectId}`);
        return { success: true, invoiceId: result.id, autoApproved: autoApprove };

    } catch (error) {
        console.error("Invoice Creation Error:", error);
        return { error: "حدث خطأ أثناء إنشاء الفاتورة" };
    }
}

// ─── Update Invoice Status (with mandatory rejectionReason + v5 accountant fields) ───────────
export async function updateInvoiceStatus(
    id: string,
    status: "APPROVED" | "REJECTED" | "PENDING",
    options?: {
        rejectionReason?: string;
        externalNumber?: string;
        spendDate?: string;     // ISO date string
        categoryId?: string;
    }
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

        // ─ Authorization: v4+M-2 FIX ─────────────────────────────────────
        // GLOBAL_ACCOUNTANT + ADMIN can approve/reject invoices
        // GENERAL_MANAGER is NOT allowed to approve
        const isGlobalAccountant = session.role === "GLOBAL_ACCOUNTANT";
        const isAdmin = session.role === "ADMIN";

        if (!isGlobalAccountant && !isAdmin) {
            return { error: "غير مصرح لك بتغيير حالة الفاتورة — هذه الصلاحية للمحاسب العام أو مدير النظام" };
        }

        // Mandatory rejection reason
        if (status === "REJECTED") {
            if (!options?.rejectionReason?.trim()) {
                return { error: "سبب الرفض إجباري عند رفض الفاتورة" };
            }
        }

        // v5: Mandatory accountant fields when APPROVING
        if (status === "APPROVED") {
            if (!options?.externalNumber?.trim()) {
                return { error: "رقم الفاتورة الخارجي إلزامي عند الاعتماد" };
            }
            if (!options?.spendDate) {
                return { error: "تاريخ الصرف إلزامي عند الاعتماد" };
            }
            if (!options?.categoryId) {
                return { error: "تصنيف المصروف إلزامي عند الاعتماد" };
            }

            // v5: Check externalNumber uniqueness (exclude soft-deleted)
            const duplicate = await prisma.invoice.findFirst({
                where: {
                    externalNumber: options.externalNumber.trim(),
                    isDeleted: false,
                    NOT: { id }
                }
            });
            if (duplicate) {
                return { error: `رقم الفاتورة "${options.externalNumber}" مستخدم بالفعل في فاتورة أخرى (${duplicate.reference})` };
            }

            // EC-7: Check project is still active (if project-based)
            if (existingInvoice.projectId && existingInvoice.project) {
                if (existingInvoice.project.status !== "IN_PROGRESS") {
                    return { error: "لا يمكن اعتماد فاتورة لمشروع مغلق أو متوقف" };
                }
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

            // Update invoice status — I10: write timestamps + v5: accountant fields
            await tx.invoice.update({
                where: { id },
                data: {
                    status,
                    rejectionReason: status === "REJECTED" ? (options?.rejectionReason || null) : null,
                    ...(status === "APPROVED" ? {
                        approvedBy: session.id,
                        approvedAt: new Date(),
                        rejectedBy: null,
                        rejectedAt: null,
                        // v5: Save accountant fields
                        externalNumber: options?.externalNumber?.trim() || null,
                        spendDate: options?.spendDate ? new Date(options.spendDate) : null,
                        categoryId: options?.categoryId || null,
                    } : {}),
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
        revalidatePath("/my-custodies"); // R-3: Update employee custody view after approval/rejection

        // N-2: Notify invoice creator about the result (outside transaction — non-critical)
        try {
            if (existingInvoice.creatorId !== session.id) {
                const statusLabels: Record<string, string> = {
                    APPROVED: "تم اعتماد فاتورتك ✅",
                    REJECTED: "تم رفض فاتورتك ❌",
                    PENDING: "تمت إعادة فاتورتك للمراجعة 🔄",
                };
                const contentParts = [`الفاتورة ${existingInvoice.reference} — المبلغ: ${existingInvoice.amount.toLocaleString()} ريال`];
                if (status === "REJECTED" && options?.rejectionReason) {
                    contentParts.push(`السبب: ${options.rejectionReason}`);
                }
                await prisma.notification.create({
                    data: {
                        title: statusLabels[status] || `تحديث حالة فاتورة`,
                        content: contentParts.join('\n'),
                        targetUserId: existingInvoice.creatorId
                    }
                });
            }
        } catch { /* non-critical */ }

        return { success: true };
    } catch (error) {
        console.error("Update Invoice Status Error:", error);
        return { error: "حدث خطأ أثناء تحديث حالة الفاتورة" };
    }
}

// ─── Soft Delete Invoice (ADMIN only — moves to trash) ──────────────────────
export async function softDeleteInvoice(invoiceId: string) {
    try {
        const session = await getSession();
        if (!session || (session.role !== "ADMIN" && session.role !== "GLOBAL_ACCOUNTANT")) {
            return { error: "فقط مدير النظام أو المحاسب العام يمكنه حذف الفواتير" };
        }

        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) return { error: "الفاتورة غير موجودة" };
        if (invoice.isDeleted) return { error: "الفاتورة محذوفة بالفعل" };
        if (invoice.status === "APPROVED") {
            return { error: "لا يمكن حذف فاتورة معتمدة. يجب رفضها أو إعادتها إلى المراجعة أولاً." };
        }

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { isDeleted: true, deletedAt: new Date() }
        });

        revalidatePath("/invoices");
        revalidatePath("/trash");
        return { success: true };
    } catch (error) {
        console.error("Soft Delete Invoice Error:", error);
        return { error: "حدث خطأ أثناء حذف الفاتورة" };
    }
}
