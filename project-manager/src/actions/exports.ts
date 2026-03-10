"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isGlobalFinance } from "@/lib/rbac";

// ─── Helper: Verify export access ────────────────────────────────────────────

async function verifyExportAccess() {
    const session = await getSession();
    if (!session) throw new Error("غير مصرح");
    if (!isGlobalFinance(session.role)) throw new Error("ليس لديك صلاحية للتصدير");
    return session;
}

// ─── Invoices Export Data ─────────────────────────────────────────────────────

export async function getInvoicesExportData(filters?: {
    status?: string;
    projectId?: string;
    scope?: string;
}) {
    await verifyExportAccess();

    const where: Record<string, unknown> = { isDeleted: false };
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.scope && filters.scope !== "ALL") where.expenseScope = filters.scope;

    const invoices = await prisma.invoice.findMany({
        where,
        include: {
            creator: { select: { name: true } },
            project: { select: { name: true } },
            category: { select: { name: true } },
            custody: { select: { id: true, employee: { select: { name: true } } } },
            items: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return invoices.map((inv) => ({
        reference: inv.reference,
        type: inv.type,
        amount: inv.amount,
        status: inv.status,
        paymentSource: inv.paymentSource,
        custodyAmount: inv.custodyAmount,
        pocketAmount: inv.pocketAmount,
        projectName: inv.project?.name || "عام",
        categoryName: inv.category?.name || "غير محدد",
        creatorName: inv.creator?.name || "-",
        expenseScope: inv.expenseScope,
        externalNumber: inv.externalNumber || "-",
        spendDate: inv.spendDate,
        createdAt: inv.createdAt,
        notes: inv.notes || "",
        itemCount: inv.items.length,
    }));
}

// ─── Wallet Export Data ───────────────────────────────────────────────────────

export async function getWalletExportData() {
    await verifyExportAccess();

    const wallet = await prisma.companyWallet.findFirst({
        include: {
            entries: {
                include: { creator: { select: { name: true } } },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!wallet) return { balance: 0, totalIn: 0, totalOut: 0, entries: [] };

    return {
        balance: wallet.balance,
        totalIn: wallet.totalIn,
        totalOut: wallet.totalOut,
        entries: wallet.entries.map((e) => ({
            type: e.type,
            amount: e.amount,
            note: e.note || "-",
            creatorName: e.creator?.name || "-",
            createdAt: e.createdAt,
        })),
    };
}

// ─── Debts Export Data ────────────────────────────────────────────────────────

export async function getDebtsExportData() {
    await verifyExportAccess();

    const debts = await prisma.outOfPocketDebt.findMany({
        where: { isSettled: false },
        include: {
            employee: { select: { name: true } },
            invoice: {
                select: {
                    reference: true,
                    project: { select: { name: true } },
                    category: { select: { name: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return debts.map((d) => ({
        employeeName: d.employee?.name || "-",
        projectName: d.invoice?.project?.name || "عام",
        categoryName: d.invoice?.category?.name || "غير محدد",
        invoiceRef: d.invoice?.reference || "-",
        amount: d.amount,
        isSettled: d.isSettled,
        createdAt: d.createdAt,
    }));
}

// ─── Custodies Export Data ────────────────────────────────────────────────────

export async function getCustodiesExportData(
    type: "employee" | "external" | "company" | "all"
) {
    await verifyExportAccess();

    const where: Record<string, unknown> = {};

    if (type === "employee") {
        where.isExternal = false;
        where.isCompanyExpense = false;
    } else if (type === "external") {
        where.isExternal = true;
    } else if (type === "company") {
        where.isCompanyExpense = true;
    }

    const custodies = await prisma.employeeCustody.findMany({
        where,
        include: {
            employee: { select: { name: true } },
            project: { select: { name: true } },
            returns: { select: { amount: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return custodies.map((c) => ({
        employeeName: c.isExternal ? (c.externalName || "-") : (c.employee?.name || "-"),
        projectName: c.isCompanyExpense ? "مصاريف الشركة" : (c.project?.name || "-"),
        amount: c.amount,
        balance: c.balance,
        method: c.method,
        status: c.status,
        isConfirmed: c.isConfirmed,
        isClosed: c.isClosed,
        isExternal: c.isExternal,
        isCompanyExpense: c.isCompanyExpense,
        externalName: c.externalName || "",
        externalPhone: c.externalPhone || "",
        externalPurpose: c.externalPurpose || "",
        totalReturned: c.returns.reduce((s, r) => s + r.amount, 0),
        note: c.note || "",
        createdAt: c.createdAt,
    }));
}

// ─── Projects Export Data ─────────────────────────────────────────────────────

export async function getProjectsExportData() {
    await verifyExportAccess();

    const projects = await prisma.project.findMany({
        where: { isDeleted: false },
        include: {
            manager: { select: { name: true } },
            _count: { select: { invoices: true, purchases: true, members: true, custodies: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return projects.map((p) => ({
        name: p.name,
        status: p.status,
        budget: p.budget || 0,
        budgetAllocated: p.budgetAllocated,
        custodyIssued: p.custodyIssued,
        custodyReturned: p.custodyReturned,
        managerSpent: p.managerSpent,
        managerName: p.manager?.name || "-",
        membersCount: p._count.members,
        invoicesCount: p._count.invoices,
        purchasesCount: p._count.purchases,
        custodiesCount: p._count.custodies,
        startDate: p.startDate,
        endDate: p.endDate,
        createdAt: p.createdAt,
    }));
}

// ─── Single Project Financial Report ──────────────────────────────────────────

export async function getProjectFinancialExportData(projectId: string) {
    await verifyExportAccess();

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            manager: { select: { name: true } },
            members: { include: { user: { select: { name: true } } } },
            invoices: {
                where: { isDeleted: false },
                include: {
                    creator: { select: { name: true } },
                    category: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
            },
            purchases: {
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
            },
            custodies: {
                include: {
                    employee: { select: { name: true } },
                    returns: { select: { amount: true, createdAt: true } },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!project) return null;

    return {
        project: {
            name: project.name,
            status: project.status,
            budget: project.budget || 0,
            budgetAllocated: project.budgetAllocated,
            custodyIssued: project.custodyIssued,
            custodyReturned: project.custodyReturned,
            managerSpent: project.managerSpent,
            managerName: project.manager?.name || "-",
            startDate: project.startDate,
            endDate: project.endDate,
        },
        invoices: project.invoices.map((inv) => ({
            reference: inv.reference,
            type: inv.type,
            amount: inv.amount,
            status: inv.status,
            paymentSource: inv.paymentSource,
            creatorName: inv.creator?.name || "-",
            categoryName: inv.category?.name || "غير محدد",
            createdAt: inv.createdAt,
        })),
        custodies: project.custodies.map((c) => ({
            employeeName: c.isExternal ? (c.externalName || "-") : (c.employee?.name || "-"),
            amount: c.amount,
            balance: c.balance,
            status: c.status,
            isClosed: c.isClosed,
            totalReturned: c.returns.reduce((s, r) => s + r.amount, 0),
            createdAt: c.createdAt,
        })),
        purchases: project.purchases.map((p) => ({
            orderNumber: p.orderNumber,
            description: p.description,
            status: p.status,
            priority: p.priority,
            deadline: p.deadline,
            createdAt: p.createdAt,
        })),
    };
}

// ─── Purchases Export Data ────────────────────────────────────────────────────

export async function getPurchasesExportData(filters?: { status?: string; projectId?: string }) {
    await verifyExportAccess();

    const where: Record<string, unknown> = { isDeleted: false };
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.projectId) where.projectId = filters.projectId;

    const purchases = await prisma.purchase.findMany({
        where,
        include: {
            creator: { select: { name: true } },
            project: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return purchases.map((p) => ({
        orderNumber: p.orderNumber,
        description: p.description,
        status: p.status,
        priority: p.priority,
        projectName: p.project?.name || "عام",
        creatorName: p.creator?.name || "-",
        deadline: p.deadline,
        notes: p.notes || "",
        createdAt: p.createdAt,
    }));
}

// ─── Finance Requests Export Data ─────────────────────────────────────────────

export async function getFinanceRequestsExportData() {
    await verifyExportAccess();

    const requests = await prisma.financeRequest.findMany({
        include: {
            requester: { select: { name: true } },
            approver: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => ({
        type: r.type,
        status: r.status,
        amount: r.amount || 0,
        requesterName: r.requester?.name || "-",
        approverName: r.approver?.name || "-",
        note: r.note || "",
        rejectReason: r.rejectReason || "",
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
    }));
}
