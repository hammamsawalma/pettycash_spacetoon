"use server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { isGlobalFinance } from "@/lib/rbac"

export async function getReportStats(period: string) {
    try {
        const session = await getSession();
        if (!session || session.role === "USER") {
            return {
                netProfit: 0, totalProjects: 0, completedProjectsCount: 0,
                pendingInvoices: 0, topProjects: [], projectBudgets: [], monthlyStats: [], categoryExpenses: [],
                companyExpensesTotal: 0, projectExpensesTotal: 0,
                internalCustodyTotal: 0, externalCustodyTotal: 0,
                internalCustodyCount: 0, externalCustodyCount: 0, openExternalCustodies: 0
            };
        }

        let dateFilter = {};
        const now = new Date();

        if (period === "آخر 30 يوم") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            dateFilter = { gte: thirtyDaysAgo };
        } else if (period === "هذا العام") {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            dateFilter = { gte: startOfYear };
        } else if (period === "العام الماضي") {
            const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
            dateFilter = { gte: startOfLastYear, lte: endOfLastYear };
        } else {
            // Default to all time or specific logic if needed
            dateFilter = {};
        }

        // Net Profit (Deposits IN - Deposits OUT/Purchases) -> For simplicity we do IN - OUT from Deposits
        const dateCondition = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

        let deposits: any[] = [];
        let netProfit = 0;
        let pendingInvoices = 0;

        const canSeeGlobalFinances = isGlobalFinance(session.role);
        if (canSeeGlobalFinances) {
            deposits = await prisma.deposit.findMany({
                where: { date: dateCondition ? dateCondition : undefined }
            });

            netProfit = deposits.reduce((acc: number, curr: { type: string; amount: number }) => {
                if (curr.type === 'DEPOSIT') return acc + curr.amount;
                if (curr.type === 'WITHDRAWAL') return acc - curr.amount;
                return acc;
            }, 0);

            pendingInvoices = await prisma.invoice.count({
                where: {
                    status: 'PENDING',
                    date: dateCondition ? dateCondition : undefined,
                    isDeleted: false
                }
            });
        }

        // Projects info
        const projectWhereClause: any = !isGlobalFinance(session.role)
            ? { OR: [{ managerId: session.id }, { members: { some: { userId: session.id } } }], isDeleted: false }
            : { isDeleted: false };

        if (dateCondition) projectWhereClause.createdAt = dateCondition;

        const totalProjects = await prisma.project.count({
            where: projectWhereClause
        });

        const completedProjectsCount = await prisma.project.count({
            where: {
                ...projectWhereClause,
                status: 'COMPLETED'
            }
        });

        // Top projects by actual allocated budget (not legacy planning value)
        const topProjects = await prisma.project.findMany({
            take: 5,
            orderBy: {
                budgetAllocated: 'desc'
            },
            where: projectWhereClause
        });

        // projectBudgets for PieChart — uses real allocated budget
        const projectBudgets = topProjects.map((p: any) => ({
            name: p.name,
            value: p.budgetAllocated || p.budget || 0
        }));

        // monthlyStats for BarChart (Mocked logic based on deposits for simplicity or real aggregation if possible)
        // Grouping deposits by month (simple client side reduction mapped here)
        const monthlyStatsMap: Record<string, { name: string, revenue: number, expense: number }> = {};
        deposits.forEach(d => {
            const monthName = new Date(d.date).toLocaleString('en-GB', { month: 'short' });
            if (!monthlyStatsMap[monthName]) {
                monthlyStatsMap[monthName] = { name: monthName, revenue: 0, expense: 0 };
            }
            if (d.type === 'DEPOSIT') {
                monthlyStatsMap[monthName].revenue += d.amount;
            } else {
                monthlyStatsMap[monthName].expense += d.amount;
            }
        });
        const monthlyStats = Object.values(monthlyStatsMap);

        // Aggregating expenses by Category - use raw query to bypass schema caching issues
        const expensesByCategory = await (prisma.invoice as any).groupBy({
            by: ['categoryId'],
            where: {
                status: 'APPROVED',
                date: dateCondition ? dateCondition : undefined,
                isDeleted: false
            },
            _sum: {
                amount: true,
            },
            orderBy: {
                _sum: { amount: 'desc' }
            }
        });

        const categories = await prisma.category.findMany();
        const categoryExpenses = expensesByCategory.map((item: any) => {
            const c = categories.find((cat: any) => cat.id === item.categoryId);
            return {
                name: c?.name || 'غير مصنف',
                icon: c?.icon || '📁',
                value: item._sum?.amount || 0
            };
        }).filter((item: any) => item.value > 0);


        // v5: Company vs Project expenses separation
        let companyExpensesTotal = 0;
        let projectExpensesTotal = 0;
        // v5.1: Custody stats (internal vs external)
        let internalCustodyTotal = 0;
        let externalCustodyTotal = 0;
        let internalCustodyCount = 0;
        let externalCustodyCount = 0;
        let openExternalCustodies = 0;

        if (canSeeGlobalFinances) {
            const [companyAgg, projectAgg, intCustody, extCustody, openExtCount] = await Promise.all([
                (prisma.invoice as any).aggregate({
                    _sum: { amount: true },
                    where: { status: 'APPROVED', isDeleted: false, expenseScope: 'COMPANY', ...(dateCondition ? { date: dateCondition } : {}) }
                }),
                (prisma.invoice as any).aggregate({
                    _sum: { amount: true },
                    where: { status: 'APPROVED', isDeleted: false, expenseScope: 'PROJECT', ...(dateCondition ? { date: dateCondition } : {}) }
                }),
                // Internal custodies
                (prisma.employeeCustody as any).aggregate({
                    _sum: { amount: true },
                    _count: true,
                    where: { isExternal: false, ...(dateCondition ? { createdAt: dateCondition } : {}) }
                }),
                // External custodies
                (prisma.employeeCustody as any).aggregate({
                    _sum: { amount: true },
                    _count: true,
                    where: { isExternal: true, ...(dateCondition ? { createdAt: dateCondition } : {}) }
                }),
                // Open external custodies count
                (prisma.employeeCustody as any).count({
                    where: { isExternal: true, isClosed: false }
                }),
            ]);
            companyExpensesTotal = companyAgg?._sum?.amount ?? 0;
            projectExpensesTotal = projectAgg?._sum?.amount ?? 0;
            internalCustodyTotal = intCustody?._sum?.amount ?? 0;
            internalCustodyCount = intCustody?._count ?? 0;
            externalCustodyTotal = extCustody?._sum?.amount ?? 0;
            externalCustodyCount = extCustody?._count ?? 0;
            openExternalCustodies = openExtCount ?? 0;
        }

        return {
            netProfit,
            totalProjects,
            completedProjectsCount,
            pendingInvoices,
            topProjects,
            projectBudgets,
            monthlyStats,
            categoryExpenses,
            companyExpensesTotal,
            projectExpensesTotal,
            internalCustodyTotal,
            externalCustodyTotal,
            internalCustodyCount,
            externalCustodyCount,
            openExternalCustodies,
        };
    } catch (error) {
        console.error("Reports Fetch Error:", error);
        return {
            netProfit: 0,
            totalProjects: 0,
            completedProjectsCount: 0,
            pendingInvoices: 0,
            topProjects: [],
            projectBudgets: [],
            monthlyStats: [],
            categoryExpenses: [],
            companyExpensesTotal: 0,
            projectExpensesTotal: 0,
            internalCustodyTotal: 0,
            externalCustodyTotal: 0,
            internalCustodyCount: 0,
            externalCustodyCount: 0,
            openExternalCustodies: 0
        };
    }
}
