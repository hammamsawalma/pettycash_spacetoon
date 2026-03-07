"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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

    const projectWhereClause: Prisma.ProjectWhereInput = (!isGlobalFinance(session.role))
        ? {
            OR: [
                { managerId: session.id },
                { members: { some: { userId: session.id } } }
            ],
            isDeleted: false
        }
        : { isDeleted: false };

    const invoiceProjectFilter = session.role === "ADMIN"
        ? { project: { managerId: session.id } }
        : {};

    // Total Projects
    const totalProjects = await prisma.project.count({
        where: projectWhereClause
    });

    // Completed Projects
    const completedProjects = await prisma.project.count({
        where: { ...projectWhereClause, status: "COMPLETED" }
    });

    // Total Employees
    const employees = await prisma.user.count({
        where: { role: { not: "ADMIN" }, isDeleted: false }
    });

    const isFinancial = isGlobalFinance(session.role);

    // Approved Revenue
    let totalRevenue = 0;
    if (isFinancial) {
        const invoices = await prisma.invoice.aggregate({
            _sum: { amount: true },
            where: { type: "SALES", status: "APPROVED", isDeleted: false, ...invoiceProjectFilter }
        });
        totalRevenue = invoices._sum.amount || 0;
    }

    // Expenses (Purchases)
    let totalExpenses = 0;
    if (isFinancial) {
        const expensesAgg = await prisma.invoice.aggregate({
            _sum: { amount: true },
            where: { type: "PURCHASE", status: "APPROVED", isDeleted: false, ...invoiceProjectFilter }
        });
        totalExpenses = expensesAgg._sum.amount || 0;
    }

    // Today Start
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Today's Revenue
    let todayRevenue = 0;
    if (isFinancial) {
        const todayRevenueAgg = await prisma.invoice.aggregate({
            _sum: { amount: true },
            where: { type: "SALES", status: "APPROVED", isDeleted: false, createdAt: { gte: todayStart }, ...invoiceProjectFilter }
        });
        todayRevenue = todayRevenueAgg._sum.amount || 0;
    }

    // Today's Withdrawals
    let todayWithdrawals = 0;
    if (isFinancial) {
        const todayWithdrawalsAgg = await prisma.deposit.aggregate({
            _sum: { amount: true },
            where: { type: "WITHDRAWAL", createdAt: { gte: todayStart } }
        });
        todayWithdrawals = todayWithdrawalsAgg._sum.amount || 0;
    }

    // Recent Projects
    const recentProjects = await prisma.project.findMany({
        where: projectWhereClause,
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { manager: true, members: true }
    });

    // Recent Notifications
    const recentNotifications = await prisma.notification.findMany({
        where: session.role !== "ADMIN" ? { targetRole: session.role } : undefined,
        take: 4,
        orderBy: { createdAt: 'desc' }
    });

    // Pending Invoices for Accountant Dashboard
    let pendingInvoices: any[] = [];
    if (isFinancial) {
        pendingInvoices = await prisma.invoice.findMany({
            where: { status: "PENDING", isDeleted: false, ...invoiceProjectFilter },
            take: 4,
            orderBy: { createdAt: 'desc' },
            include: { project: true }
        });
    }

    // Chart Data (Projects per month this year, and Projects per year for all time)
    const projects = await prisma.project.findMany({
        where: projectWhereClause,
        select: { createdAt: true }
    });

    const currentYear = new Date().getFullYear();
    const monthlyProjects = new Array(12).fill(0);
    const yearlyProjectsMap: Record<number, number> = {};

    projects.forEach(p => {
        const d = new Date(p.createdAt);
        const y = d.getFullYear();
        const m = d.getMonth();

        if (y === currentYear) {
            monthlyProjects[m]++;
        }

        yearlyProjectsMap[y] = (yearlyProjectsMap[y] || 0) + 1;
    });

    const monthNames = ['يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyData = monthNames.map((name, i) => ({
        name,
        value: monthlyProjects[i]
    }));

    const yearlyData = Object.entries(yearlyProjectsMap)
        .map(([year, value]) => ({ name: year, value }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));

    if (yearlyData.length === 0) {
        yearlyData.push({ name: currentYear.toString(), value: 0 });
    }

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
        chartData: {
            monthly: monthlyData,
            yearly: yearlyData
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// getFlowStats — بيانات Flow المالي لكل دور: وصل / مُنفَّق / متبقي
// ─────────────────────────────────────────────────────────────────────────────
export async function getFlowStats() {
    const session = await getSession();
    if (!session) return null;

    const role = session.role;

    // ─── ADMIN & ACCOUNTANT & GENERAL_MANAGER: يريان كامل الخزنة والمشاريع ──────
    if (isGlobalFinance(role)) {
        const wallet = await prisma.companyWallet.findFirst();
        const walletTotalIn = wallet?.totalIn ?? 0;   // إجمالي ما وُدِع في الخزنة
        const walletBalance = wallet?.balance ?? 0;   // المتبقي في الخزنة
        const walletTotalOut = wallet?.totalOut ?? 0;   // إجمالي ما خرج من الخزنة (موزَّع على مشاريع)

        // إجمالي الميزانيات الموزعة على المشاريع
        const projectBudgetAgg = await prisma.project.aggregate({
            _sum: { budgetAllocated: true, custodyIssued: true, custodyReturned: true },
            // المدير العام يرى الكل بدون فلتر
            where: { isDeleted: false, ...(role === "ADMIN" ? { managerId: session.id } : {}) }
        });
        const totalAllocated = projectBudgetAgg._sum.budgetAllocated ?? 0;  // خرج من الخزنة → مشاريع
        const totalCustodyOut = projectBudgetAgg._sum.custodyIssued ?? 0;  // خرج من المشاريع → موظفين
        const totalReturned = projectBudgetAgg._sum.custodyReturned ?? 0;  // رجع من الموظفين → مشاريع

        // إجمالي الفواتير المعتمدة (أُنفقت فعلياً)
        const approvedInvoicesAgg = await prisma.invoice.aggregate({
            _sum: { amount: true },
            where: { status: "APPROVED", isDeleted: false, ...(role === "ADMIN" ? { project: { managerId: session.id } } : {}) }
        });
        const totalSpent = approvedInvoicesAgg._sum.amount ?? 0;

        // إجمالي الفواتير قيد الانتظار
        const pendingInvoicesAgg = await prisma.invoice.aggregate({
            _sum: { amount: true },
            where: { status: "PENDING", isDeleted: false, ...(role === "ADMIN" ? { project: { managerId: session.id } } : {}) }
        });
        const totalPending = pendingInvoicesAgg._sum.amount ?? 0;

        return {
            role,
            // مستوى الخزنة
            walletReceived: walletTotalIn,
            walletSpent: walletTotalOut,
            walletRemaining: walletBalance,
            // مستوى المشاريع
            projectsAllocated: totalAllocated,
            custodyIssued: totalCustodyOut,
            custodyReturned: totalReturned,
            // مستوى الإنفاق الفعلي
            invoicesApproved: totalSpent,
            invoicesPending: totalPending,
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
        const isProjectAccountant = memberMemberships.some(m => m.projectRoles?.includes("PROJECT_ACCOUNTANT"));
        const isProjectEmployee = memberMemberships.some(m => m.projectRoles?.includes("PROJECT_EMPLOYEE"));
        // canAddInvoice: PROJECT_EMPLOYEE OR PROJECT_ACCOUNTANT OR direct project manager
        const canAddInvoice = isProjectEmployee || isProjectAccountant || managedProjectIds.length > 0;

        // Step D: Financial aggregations
        const managedBudget = managedProjects.reduce((s, p) => s + (p.budgetAllocated ?? 0), 0);
        const memberBudget = memberMemberships.reduce((s, m) => s + (m.project?.budgetAllocated ?? 0), 0);
        const managedIssued = managedProjects.reduce((s, p) => s + (p.custodyIssued ?? 0), 0);
        const memberIssued = memberMemberships.reduce((s, m) => s + (m.project?.custodyIssued ?? 0), 0);
        const managedReturned = managedProjects.reduce((s, p) => s + (p.custodyReturned ?? 0), 0);
        const memberReturned = memberMemberships.reduce((s, m) => s + (m.project?.custodyReturned ?? 0), 0);
        // Deduplicate: avoid double-counting if manager is also in members list
        const projectReceived = managedBudget + memberMemberships
            .filter(m => !managedProjectIds.includes(m.projectId))
            .reduce((s, m) => s + (m.project?.budgetAllocated ?? 0), 0);
        const projectIssued = managedIssued + memberMemberships
            .filter(m => !managedProjectIds.includes(m.projectId))
            .reduce((s, m) => s + (m.project?.custodyIssued ?? 0), 0);
        const projectReturned = managedReturned + memberMemberships
            .filter(m => !managedProjectIds.includes(m.projectId))
            .reduce((s, m) => s + (m.project?.custodyReturned ?? 0), 0);

        const approvedInvoicesAgg = allProjectIds.length > 0
            ? await prisma.invoice.aggregate({
                _sum: { amount: true },
                where: { projectId: { in: allProjectIds }, status: "APPROVED", isDeleted: false }
            })
            : { _sum: { amount: 0 } };
        const projectSpent = approvedInvoicesAgg._sum.amount ?? 0;
        const projectRemaining = projectReceived - projectIssued + projectReturned;

        // Step E: Personal Custody stats (own custody regardless of project)
        const custodies = await prisma.employeeCustody.findMany({
            where: { employeeId: session.id },
            select: { amount: true, balance: true }
        });
        const personalReceived = custodies.reduce((s, c) => s + c.amount, 0);
        const personalRemaining = custodies.reduce((s, c) => s + c.balance, 0);
        const personalSpent = personalReceived - personalRemaining;

        return {
            role,
            // Project role flags (used by EmployeeDashboard to render widgets)
            isProjectManager,
            isProjectAccountant,
            isProjectEmployee,
            canAddInvoice,
            hasAnyProject: allProjectIds.length > 0,
            // Project View keys
            projectReceived,
            projectIssued,
            projectReturned,
            projectSpent,
            projectRemaining,
            // Personal View keys
            personalReceived,
            personalSpent,
            personalRemaining
        };
    }


    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// getGMDashboardStats — بيانات شاملة للمدير العام: يرى كل شيء بلا قيود
// ─────────────────────────────────────────────────────────────────────────────
export async function getGMDashboardStats() {
    const session = await getSession();
    if (!session || session.role !== "GENERAL_MANAGER") return null;

    // خزنة الشركة
    const wallet = await prisma.companyWallet.findFirst();

    // إجمالي المشاريع
    const totalProjects = await prisma.project.count({ where: { isDeleted: false } });
    const inProgressProjects = await prisma.project.count({ where: { status: "IN_PROGRESS", isDeleted: false } });
    const closedProjects = await prisma.project.count({ where: { status: "CLOSED", isDeleted: false } });

    // إجمالي الموظفين (بدون admins)
    const totalEmployees = await prisma.user.count({ where: { isDeleted: false, role: { notIn: ["ADMIN", "GENERAL_MANAGER"] } } });

    // آخر 5 مشاريع
    const recentProjects = await prisma.project.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { manager: { select: { id: true, name: true } }, members: true }
    });

    // إجمالي الفواتير المعتمدة والمعلقة والمرفوضة
    const invoiceStats = await prisma.invoice.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _sum: { amount: true },
        _count: { id: true }
    });

    const invoiceData = {
        approved: invoiceStats.find(s => s.status === "APPROVED")?._sum.amount ?? 0,
        pending: invoiceStats.find(s => s.status === "PENDING")?._sum.amount ?? 0,
        rejected: invoiceStats.find(s => s.status === "REJECTED")?._sum.amount ?? 0,
        pendingCount: invoiceStats.find(s => s.status === "PENDING")?._count.id ?? 0,
    };

    // الفواتير المعلقة (آخر 8)
    const pendingInvoices = await prisma.invoice.findMany({
        where: { status: "PENDING", isDeleted: false },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, name: true } }, creator: { select: { id: true, name: true } } }
    });

    // المشتريات العاجلة (URGENT) + آخر المشتريات
    const urgentPurchases = await prisma.purchase.findMany({
        where: { priority: "URGENT", isDeleted: false, status: { not: "CANCELLED" } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
            creator: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } }
        }
    });

    // إجمالي العهد: المصروف والمرتجع
    const custodyStats = await prisma.project.aggregate({
        _sum: { budgetAllocated: true, custodyIssued: true, custodyReturned: true },
        where: { isDeleted: false }
    });

    // إحصائيات المشتريات حسب الحالة
    const purchaseStats = await prisma.purchase.groupBy({
        by: ["status"],
        where: { isDeleted: false },
        _count: { id: true }
    });

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

