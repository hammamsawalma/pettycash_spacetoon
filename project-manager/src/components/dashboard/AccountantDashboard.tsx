"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import ManagerFinancialOverview from "@/components/dashboard/ManagerFinancialOverview";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Wallet, ArrowUpToLine, ChevronLeft, FolderKanban, Banknote, BadgeDollarSign, Building2, HandCoins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDashboardStats, getFlowStats } from '@/actions/dashboard';
import { getPendingDebts } from '@/actions/debts';
import { Project, User, Notification, Invoice, ProjectMember } from '@prisma/client';
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useRouter } from "next/navigation";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { AccountantDashboardSkeleton } from "@/components/ui/SkeletonCard";

export default function AccountantDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalProjects: 0,
        completedProjects: 0,
        employees: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        todayRevenue: 0,
        todayWithdrawals: 0,
        pendingInvoices: [] as Array<Invoice & { project: Project | null }>,
        recentProjects: [] as Array<Project & { manager: User | null, members: ProjectMember[] }>,
        recentNotifications: [] as Notification[],
        chartData: { monthly: [] as { name: string, value: number }[], yearly: [] as { name: string, value: number }[] }
    });

    const [flow, setFlow] = useState({
        projectsAllocated: 0,
        custodyIssued: 0,
        custodyReturned: 0,
        invoicesApproved: 0,
        companyExpenses: 0,
    });

    const [pendingDebtsCount, setPendingDebtsCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        getDashboardStats().then(setStats);
        getFlowStats().then(data => {
            if (data && "projectsAllocated" in data) {
                setFlow({
                    projectsAllocated: data.projectsAllocated ?? 0,
                    custodyIssued: data.custodyIssued ?? 0,
                    custodyReturned: data.custodyReturned ?? 0,
                    invoicesApproved: data.invoicesApproved ?? 0,
                    companyExpenses: data.companyExpenses ?? 0,
                });
            }
        });
        getPendingDebts().then(debts => {
            setPendingDebtsCount(Array.isArray(debts) ? debts.length : 0);
        });
    }, []);

    if (!isMounted) {
        return (
            <DashboardLayout title="اللوحة المالية">
                <AccountantDashboardSkeleton />
            </DashboardLayout>
        );
    }

    const kpis = [
        { title: "فواتير معلقة", value: stats.pendingInvoices.length, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10", isCurrency: false },
        { title: "ديون معلقة", value: pendingDebtsCount, icon: Banknote, color: "text-red-500", bg: "bg-red-500/10", isCurrency: false },
        { title: "إجمالي العُهد المصروفة", value: flow.custodyIssued, icon: HandCoins, color: "text-rose-500", bg: "bg-rose-500/10", isCurrency: true },
        { title: "مُبالغ مُرجَعة من العُهد", value: flow.custodyReturned, icon: ArrowUpToLine, color: "text-emerald-500", bg: "bg-emerald-500/10", isCurrency: true },
        { title: "مصاريف الشركة", value: flow.companyExpenses, icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10", isCurrency: true },
        { title: "فواتير معتمدة", value: flow.invoicesApproved, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", isCurrency: true },
    ];

    const quickActions = [
        { label: "فاتورة جديدة", href: "/invoices/new", icon: FileText, color: "bg-green-50 text-green-700 border-green-100" },
        { label: "سجل العهدة", href: "/deposits", icon: Wallet, color: "bg-blue-50 text-blue-700 border-blue-100" },
        { label: "الديون", href: "/debts", icon: Banknote, color: "bg-red-50 text-red-700 border-red-100" },
        { label: "طلب مالي", href: "/finance-requests", icon: BadgeDollarSign, color: "bg-amber-50 text-amber-700 border-amber-100" },
    ];

    return (
        <DashboardLayout title="اللوحة المالية">
            <div className="space-y-6 md:space-y-8 pb-6">
                {/* الملخص المالي الموحد */}
                <ManagerFinancialOverview />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                    {quickActions.map((action, i) => (
                        <button
                            key={i}
                            onClick={() => router.push(action.href)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs md:text-sm font-bold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 ${action.color}`}
                        >
                            <action.icon className="w-4 h-4 shrink-0" />
                            {action.label}
                        </button>
                    ))}
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {kpis.map((kpi, i) => (
                        <Card key={i} className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 group cursor-default shadow-sm border-gray-100">
                            <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl transition-transform duration-300 md:group-hover:scale-110 shrink-0 ${kpi.bg}`}>
                                <kpi.icon className={`h-5 w-5 md:h-6 md:w-6 ${kpi.color}`} aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm font-bold text-gray-500 mb-1 leading-snug">{kpi.title}</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-sm md:text-xl font-black text-gray-900 drop-shadow-sm">
                                        <AnimatedNumber value={kpi.value} delay={0.08 * i} />
                                    </p>
                                    {kpi.isCurrency && <span className="text-[10px] font-bold text-gray-400"><CurrencyDisplay /></span>}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* آخر المشاريع */}
                    <Card className="p-0 overflow-hidden flex flex-col h-[350px] md:h-[400px] shadow-sm border-gray-100">
                        <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100/50 bg-gray-50/50">
                            <h3 className="font-bold text-base md:text-lg text-gray-900">آخر المشاريع</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-3 custom-scrollbar bg-white">
                            {stats.recentProjects.length > 0 ? stats.recentProjects.map(p => (
                                <div
                                    key={p.id}
                                    className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors cursor-pointer"
                                    onClick={() => router.push(`/projects/${p.id}`)}
                                >
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                                            ميزانية: {(p.budgetAllocated ?? 0).toLocaleString('en-US')} <CurrencyDisplay />
                                            {" • "}عُهد: {(p.custodyIssued ?? 0).toLocaleString('en-US')} <CurrencyDisplay />
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {p.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                                    </span>
                                </div>
                            )) : (
                                <div className="flex justify-center items-center h-full text-gray-400 text-sm font-medium">لا توجد مشاريع</div>
                            )}
                        </div>
                    </Card>

                    {/* الفواتير المعلقة */}
                    <Card className="p-0 overflow-hidden flex flex-col h-[350px] md:h-[400px] shadow-sm border-gray-100">
                        <div className="p-5 md:p-6 border-b border-gray-100/50 bg-gray-50/50">
                            <h3 className="font-bold text-base md:text-lg text-gray-900">الفواتير المعلقة</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-white">
                            {stats.pendingInvoices.length > 0 ? stats.pendingInvoices.map((invoice) => (
                                <div key={invoice.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between sm:items-center group p-3 md:p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors">
                                    <div className="flex gap-3 md:gap-4 items-center">
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${invoice.type === 'SALES' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                                            <FileText className={`w-4 h-4 md:w-5 md:h-5 ${invoice.type === 'SALES' ? 'text-emerald-600' : 'text-orange-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm font-bold text-gray-900">
                                                {invoice.type === 'SALES' ? 'مبيعات' : 'مشتريات'} — {(invoice.amount || 0).toLocaleString('en-US')} <CurrencyDisplay />
                                            </p>
                                            <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5">{invoice.project?.name || 'بدون مشروع'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Button
                                            variant="primary"
                                            className="flex-1 sm:flex-none h-8 md:h-9 px-4 text-[11px] md:text-xs bg-[#102550] hover:bg-[#102550]/90 font-bold rounded-lg shadow-sm"
                                            onClick={() => router.push(`/invoices/${invoice.id}`)}
                                        >
                                            مراجعة
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs md:text-sm text-gray-400 font-medium text-center py-8">لا توجد فواتير معلقة.</p>
                            )}
                        </div>
                        <div className="p-4 md:p-6 pt-0 bg-white">
                            <Button onClick={() => router.push('/invoices')} variant="secondary" className="w-full text-[11px] md:text-xs h-10 font-bold bg-gray-50 hover:bg-gray-100 text-[#102550] border-none transition-colors">
                                عرض كل الفواتير <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
