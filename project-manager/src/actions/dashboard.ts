"use server";

import prisma from "@/lib/prisma";
import { getSession, getBranchFilter } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { isGlobalFinance } from "@/lib/rbac";


export async function getDashboardStats() {
    const session = await getSession();
    if (!session) {
        return {
            totalProjects: 0,
            completedProjects: 0,
            employees: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            todayRevenue: 0,
            todayWithdrawals: 0,
            pendingInvoices: [],
            recentProjects: [],
            recentNotifications: [],
            chartData: { monthly: [], yearly: [] }
        };
    }

    const bf = getBranchFilter(session);
    const projectWhereClause: Prisma.ProjectWhereInput = (!isGlobalFinance(session.role))
        ? {
            ...bf,
            OR: [
                { managerId: session.id },
                { members: { some: { userId: session.id } } }
            ],
            isDeleted: false
        }
        : { ...bf, isDeleted: false };

    const invoiceProjectFilter = session.role === "ADMIN"
        ? { project: { managerId: session.id } }
        : {};

    const isFinancial = isGlobalFinance(session.role);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // P2: Group 1 — counts (all independent, run in parallel)
    const [totalProjects, completedProjects, employees] = await Promise.all([
        prisma.project.count({ where: projectWhereClause }),
        prisma.project.count({ where: { ...projectWhereClause, status: "COMPLETED" } }),
        prisma.user.count({ where: { ...bf, role: { not: "ADMIN" }, isDeleted: false } }),
    ]);

    // P2: Group 2 — financial aggregations (only if financial role, run in parallel)
    let totalRevenue = 0, totalExpenses = 0, todayRevenue = 0, todayWithdrawals = 0;
    if (isFinancial) {
        const [revAgg, expAgg, todayRevAgg, todayWithAgg] = await Promise.all([
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: { type: "SALES", status: "APPROVED", isDeleted: false, ...invoiceProjectFilter }
            }),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: { type: "PURCHASE", status: "APPROVED", isDeleted: false, ...invoiceProjectFilter }
            }),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: { type: "SALES", status: "APPROVED", isDeleted: false, createdAt: { gte: todayStart }, ...invoiceProjectFilter }
            }),
            prisma.deposit.aggregate({
                _sum: { amount: true },
                where: { type: "WITHDRAWAL", createdAt: { gte: todayStart } }
            }),
        ]);
        totalRevenue = revAgg._sum.amount || 0;
        totalExpenses = expAgg._sum.amount || 0;
        todayRevenue = todayRevAgg._sum.amount || 0;
        todayWithdrawals = todayWithAgg._sum.amount || 0;
    }

    // P2: Group 3 — list fetches (run in parallel)
    const [recentProjects, recentNotifications, pendingInvoices, chartProjects] = await Promise.all([
        prisma.project.findMany({
            where: projectWhereClause,
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { manager: true, members: true }
        }),
        prisma.notification.findMany({
            where: session.role !== "ADMIN" ? { targetRole: session.role } : undefined,
            take: 4,
            orderBy: { createdAt: 'desc' }
        }),
        isFinancial
            ? prisma.invoice.findMany({
                where: { status: "PENDING", isDeleted: false, ...invoiceProjectFilter },
                take: 4,
                orderBy: { createdAt: 'desc' },
                include: { project: true }
            })
            : Promise.resolve([]),
        prisma.project.findMany({
            where: projectWhereClause,
            select: { createdAt: true }
        }),
    ]);

    // Build chart data from project dates (in-memory, fast)
    const currentYear = new Date().getFullYear();
    const monthlyProjects = new Array(12).fill(0);
    const yearlyProjectsMap: Record<number, number> = {};

    chartProjects.forEach(p => {
        const d = new Date(p.createdAt);
        const y = d.getFullYear();
        const m = d.getMonth();
        if (y === currentYear) monthlyProjects[m]++;
        yearlyProjectsMap[y] = (yearlyProjectsMap[y] || 0) + 1;
    });

    const monthNames = ['يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyData = monthNames.map((name, i) => ({ name, value: monthlyProjects[i] }));
    const yearlyData = Object.entries(yearlyProjectsMap)
        .map(([year, value]) => ({ name: year, value }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    if (yearlyData.length === 0) yearlyData.push({ name: currentYear.toString(), value: 0 });

    return {
        totalProjects,
        completedProjects,
        employees,
        totalRevenue,
        totalExpenses,
        todayRevenue,
        todayWithdrawals,
        pendingInvoices,
        recentProjects,
        recentNotifications,
        chartData: { monthly: monthlyData, yearly: yearlyData }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// getFlowStats — بيانات Flow المالي لكل دور: وصل / مُنفَّق / متبقي
// ─────────────────────────────────────────────────────────────────────────────
export async function getFlowStats() {
    const session = await getSession();
    if (!session) return null;
    const bf = getBranchFilter(session);

    const role = session.role;

    // ─── ADMIN & ACCOUNTANT & GENERAL_MANAGER: يريان كامل الخزنة والمشاريع ──────
    if (isGlobalFinance(role)) {
        const walletWhere = bf.branchId ? { branchId: bf.branchId } : {};
        const wallet = await prisma.companyWallet.findFirst({ where: walletWhere });
        const walletTotalIn = wallet?.totalIn ?? 0;
        const walletBalance = wallet?.balance ?? 0;
        const walletTotalOut = wallet?.totalOut ?? 0;

        // P2: Run these aggregations in parallel
        const [projectBudgetAgg, approvedInvoicesAgg, pendingInvoicesAgg, companyExpensesAgg] = await Promise.all([
            prisma.project.aggregate({
                _sum: { budgetAllocated: true, custodyIssued: true, custodyReturned: true },
                where: { ...bf, isDeleted: false, ...(role === "ADMIN" ? { managerId: session.id } : {}) }
            }),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: {
                    status: "APPROVED", isDeleted: false, expenseScope: "PROJECT",
                    ...(bf.branchId ? { project: { is: { branchId: bf.branchId } } } : {}),
                    ...(role === "ADMIN" ? { project: { is: { managerId: session.id, ...(bf.branchId ? { branchId: bf.branchId } : {}) } } } : {})
                }
            }),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: {
                    status: "PENDING", isDeleted: false, expenseScope: "PROJECT",
                    ...(bf.branchId ? { project: { is: { branchId: bf.branchId } } } : {}),
                    ...(role === "ADMIN" ? { project: { is: { managerId: session.id, ...(bf.branchId ? { branchId: bf.branchId } : {}) } } } : {})
                }
            }),
            // v5: Company expenses total (separate from project stats)
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: {
                    status: "APPROVED", isDeleted: false, expenseScope: "COMPANY",
                    ...(bf.branchId ? { project: { is: { branchId: bf.branchId } } } : {})
                }
            }),
        ]);

        return {
            role,
            walletReceived: walletTotalIn,
            walletSpent: walletTotalOut,
            walletRemaining: walletBalance,
            projectsAllocated: projectBudgetAgg._sum.budgetAllocated ?? 0,
            custodyIssued: projectBudgetAgg._sum.custodyIssued ?? 0,
            custodyReturned: projectBudgetAgg._sum.custodyReturned ?? 0,
            invoicesApproved: approvedInvoicesAgg._sum.amount ?? 0,
            invoicesPending: pendingInvoicesAgg._sum.amount ?? 0,
            companyExpenses: companyExpensesAgg._sum.amount ?? 0,  // v5
        };
    }

    // ─── USER: Unified Project & Custody Stats + Combined Project Role Flags ──────
    if (role === "USER") {
        // Step A: all project memberships & managerId — only in non-deleted projects
        const [managedProjects, memberMemberships] = await Promise.all([
            prisma.project.findMany({
                where: { managerId: session.id, isDeleted: false },
                select: { id: true, budgetAllocated: true, custodyIssued: true, custodyReturned: true }
            }),
            prisma.projectMember.findMany({
                where: {
                    userId: session.id,
                    project: { isDeleted: false }
                },
                select: { projectId: true, projectRoles: true, project: { select: { budgetAllocated: true, custodyIssued: true, custodyReturned: true } } }
            })
        ]);

        // Step B: Combine project IDs (manager + member)
        const managedProjectIds = managedProjects.map(p => p.id);
        const memberProjectIds = memberMemberships.map(m => m.projectId);
        const allProjectIds = [...new Set([...managedProjectIds, ...memberProjectIds])];

        // Step C: Project-level role flags
        const isProjectManager = managedProjectIds.length > 0
            || memberMemberships.some(m => m.projectRoles?.includes("PROJECT_MANAGER"));
        const isProjectEmployee = memberMemberships.some(m => m.projectRoles?.includes("PROJECT_EMPLOYEE"));
        const canAddInvoice = isProjectEmployee || managedProjectIds.length > 0;

        // Step D: Financial aggregations
        const managedBudget = managedProjects.reduce((s, p) => s + (p.budgetAllocated ?? 0), 0);
        const managedIssued = managedProjects.reduce((s, p) => s + (p.custodyIssued ?? 0), 0);
        const managedReturned = managedProjects.reduce((s, p) => s + (p.custodyReturned ?? 0), 0);
        const projectReceived = managedBudget + memberMemberships
            .filter(m => !managedProjectIds.includes(m.projectId))
            .reduce((s, m) => s + (m.project?.budgetAllocated ?? 0), 0);
        const projectIssued = managedIssued + memberMemberships
            .filter(m => !managedProjectIds.includes(m.projectId))
            .reduce((s, m) => s + (m.project?.custodyIssued ?? 0), 0);
        const projectReturned = managedReturned + memberMemberships
            .filter(m => !managedProjectIds.includes(m.projectId))
            .reduce((s, m) => s + (m.project?.custodyReturned ?? 0), 0);

        // P2: Run invoice aggregation + custody fetch in parallel
        const [approvedInvoicesAgg, custodies] = await Promise.all([
            allProjectIds.length > 0
                ? prisma.invoice.aggregate({
                    _sum: { amount: true },
                    where: { projectId: { in: allProjectIds }, status: "APPROVED", isDeleted: false, expenseScope: "PROJECT" }
                })
                : Promise.resolve({ _sum: { amount: 0 } }),
            prisma.employeeCustody.findMany({
                where: { employeeId: session.id },
                select: { amount: true, balance: true }
            }),
        ]);

        const projectSpent = approvedInvoicesAgg._sum.amount ?? 0;
        const projectRemaining = projectReceived - projectIssued + projectReturned;
        const personalReceived = custodies.reduce((s, c) => s + c.amount, 0);
        const personalRemaining = custodies.reduce((s, c) => s + c.balance, 0);
        const personalSpent = personalReceived - personalRemaining;

        return {
            role,
            isProjectManager,
            isProjectEmployee,
            canAddInvoice,
            hasAnyProject: allProjectIds.length > 0,
            projectReceived,
            projectIssued,
            projectReturned,
            projectSpent,
            projectRemaining,
            personalReceived,
            personalSpent,
            personalRemaining
        };
    }

    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// getGMDashboardStats — بيانات شاملة للمدير العام مع فلتر فرع اختياري
// v8: Fixed branch filtering bug + added branchId parameter
// ─────────────────────────────────────────────────────────────────────────────
export async function getGMDashboardStats(branchId?: string) {
    const session = await getSession();
    if (!session || session.role !== "GENERAL_MANAGER") return null;

    // Branch scoping: filter all queries when a specific branch is selected
    const projectBranch = branchId ? { branchId } : {};
    const invoiceBranch = branchId ? { project: { is: { branchId } } } : {};
    const userBranch = branchId ? { branchId } : {};
    const walletWhere = branchId ? { branchId } : {};

    // P7: Group 1 — counts and wallet in parallel
    const [wallet, totalProjects, inProgressProjects, closedProjects, totalEmployees] = await Promise.all([
        prisma.companyWallet.findFirst({ where: walletWhere }),
        prisma.project.count({ where: { ...projectBranch, isDeleted: false } }),
        prisma.project.count({ where: { ...projectBranch, status: "IN_PROGRESS", isDeleted: false } }),
        prisma.project.count({ where: { ...projectBranch, status: "COMPLETED", isDeleted: false } }),
        prisma.user.count({ where: { ...userBranch, isDeleted: false, role: { notIn: ["ROOT", "ADMIN", "GENERAL_MANAGER"] } } }),
    ]);

    // P7: Group 2 — list fetches + groupBy stats in parallel
    const [recentProjects, invoiceStats, pendingInvoices, urgentPurchases, custodyStats, purchaseStats] = await Promise.all([
        prisma.project.findMany({
            where: { ...projectBranch, isDeleted: false },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { manager: { select: { id: true, name: true } }, members: true }
        }),
        prisma.invoice.groupBy({
            by: ["status"],
            where: { isDeleted: false, ...invoiceBranch },
            _sum: { amount: true },
            _count: { id: true }
        }),
        prisma.invoice.findMany({
            where: { status: "PENDING", isDeleted: false, ...invoiceBranch },
            take: 8,
            orderBy: { createdAt: "desc" },
            include: { project: { select: { id: true, name: true } }, creator: { select: { id: true, name: true } } }
        }),
        prisma.purchase.findMany({
            where: { priority: "URGENT", isDeleted: false, status: { not: "CANCELLED" }, ...invoiceBranch },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
                creator: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } }
            }
        }),
        prisma.project.aggregate({
            _sum: { budgetAllocated: true, custodyIssued: true, custodyReturned: true },
            where: { ...projectBranch, isDeleted: false }
        }),
        prisma.purchase.groupBy({
            by: ["status"],
            where: { isDeleted: false, ...invoiceBranch },
            _count: { id: true }
        }),
    ]);

    const invoiceData = {
        approved: invoiceStats.find(s => s.status === "APPROVED")?._sum.amount ?? 0,
        pending: invoiceStats.find(s => s.status === "PENDING")?._sum.amount ?? 0,
        rejected: invoiceStats.find(s => s.status === "REJECTED")?._sum.amount ?? 0,
        pendingCount: invoiceStats.find(s => s.status === "PENDING")?._count.id ?? 0,
    };

    return {
        wallet: {
            balance: wallet?.balance ?? 0,
            totalIn: wallet?.totalIn ?? 0,
            totalOut: wallet?.totalOut ?? 0,
        },
        projects: {
            total: totalProjects,
            inProgress: inProgressProjects,
            closed: closedProjects,
            recent: recentProjects,
        },
        employees: totalEmployees,
        invoices: invoiceData,
        pendingInvoices,
        urgentPurchases,
        custody: {
            allocated: custodyStats._sum.budgetAllocated ?? 0,
            issued: custodyStats._sum.custodyIssued ?? 0,
            returned: custodyStats._sum.custodyReturned ?? 0,
        },
        purchaseStats: {
            requested: purchaseStats.find(s => s.status === "REQUESTED")?._count.id ?? 0,
            inProgress: purchaseStats.find(s => s.status === "IN_PROGRESS")?._count.id ?? 0,
            purchased: purchaseStats.find(s => s.status === "PURCHASED")?._count.id ?? 0,
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// getBranchesForGM — قائمة الفروع لاستخدامها في فلتر GM
// ─────────────────────────────────────────────────────────────────────────────
export async function getBranchesForGM() {
    const session = await getSession();
    if (!session || !["ROOT", "GENERAL_MANAGER"].includes(session.role)) return [];

    return prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, flag: true },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// getGMBranchComparison — مقارنة أداء الفروع للمدير العام
// ─────────────────────────────────────────────────────────────────────────────
export async function getGMBranchComparison() {
    const session = await getSession();
    if (!session || !["ROOT", "GENERAL_MANAGER"].includes(session.role)) return [];

    const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, flag: true },
    });

    const comparison = await Promise.all(
        branches.map(async (branch) => {
            const [projectCount, activeProjects, employeeCount, wallet, invoiceAgg, custodyAgg] = await Promise.all([
                prisma.project.count({ where: { branchId: branch.id, isDeleted: false } }),
                prisma.project.count({ where: { branchId: branch.id, isDeleted: false, status: "IN_PROGRESS" } }),
                prisma.user.count({ where: { branchId: branch.id, isDeleted: false } }),
                prisma.companyWallet.findFirst({ where: { branchId: branch.id } }),
                prisma.invoice.aggregate({
                    _sum: { amount: true },
                    where: { status: "APPROVED", isDeleted: false, project: { branchId: branch.id } }
                }),
                prisma.project.aggregate({
                    _sum: { custodyIssued: true, custodyReturned: true },
                    where: { branchId: branch.id, isDeleted: false }
                }),
            ]);

            return {
                ...branch,
                projects: projectCount,
                activeProjects,
                employees: employeeCount,
                walletBalance: wallet?.balance ?? 0,
                totalInvoices: invoiceAgg._sum.amount ?? 0,
                custodyIssued: custodyAgg._sum.custodyIssued ?? 0,
                custodyReturned: custodyAgg._sum.custodyReturned ?? 0,
            };
        })
    );

    return comparison;
}

// ─────────────────────────────────────────────────────────────────────────────
// getRootDashboardStats — بيانات شاملة لمستخدم ROOT: كل الفروع دفعة واحدة
// ─────────────────────────────────────────────────────────────────────────────
export async function getRootDashboardStats() {
    const session = await getSession();
    if (!session || session.role !== "ROOT") return null;

    // Fetch all active branches
    const branches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, currency: true, country: true, flag: true },
    });

    // Per-branch stats in parallel
    const branchStats = await Promise.all(
        branches.map(async (branch) => {
            const [projectCount, activeProjects, employeeCount, wallet, pendingInvoiceCount, pendingInvoiceAmount] = await Promise.all([
                prisma.project.count({ where: { branchId: branch.id, isDeleted: false } }),
                prisma.project.count({ where: { branchId: branch.id, isDeleted: false, status: "IN_PROGRESS" } }),
                prisma.user.count({ where: { branchId: branch.id, isDeleted: false } }),
                prisma.companyWallet.findFirst({ where: { branchId: branch.id } }),
                prisma.invoice.count({ where: { status: "PENDING", isDeleted: false, project: { branchId: branch.id } } }),
                prisma.invoice.aggregate({
                    _sum: { amount: true },
                    where: { status: "PENDING", isDeleted: false, project: { branchId: branch.id } }
                }),
            ]);

            return {
                ...branch,
                projects: projectCount,
                activeProjects,
                employees: employeeCount,
                walletBalance: wallet?.balance ?? 0,
                walletTotalIn: wallet?.totalIn ?? 0,
                walletTotalOut: wallet?.totalOut ?? 0,
                pendingInvoices: pendingInvoiceCount,
                pendingInvoiceAmount: pendingInvoiceAmount._sum.amount ?? 0,
            };
        })
    );

    // Aggregate totals
    const totals = {
        projects: branchStats.reduce((s, b) => s + b.projects, 0),
        activeProjects: branchStats.reduce((s, b) => s + b.activeProjects, 0),
        employees: branchStats.reduce((s, b) => s + b.employees, 0),
        walletBalance: branchStats.reduce((s, b) => s + b.walletBalance, 0),
        walletTotalIn: branchStats.reduce((s, b) => s + b.walletTotalIn, 0),
        walletTotalOut: branchStats.reduce((s, b) => s + b.walletTotalOut, 0),
        pendingInvoices: branchStats.reduce((s, b) => s + b.pendingInvoices, 0),
        pendingInvoiceAmount: branchStats.reduce((s, b) => s + b.pendingInvoiceAmount, 0),
    };

    return { branches: branchStats, totals };
}

