"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import ManagerFinancialOverview from "@/components/dashboard/ManagerFinancialOverview";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Wallet, ArrowDownToLine, ArrowUpToLine, ChevronLeft, FolderKanban } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDashboardStats, getFlowStats } from '@/actions/dashboard';
import { Project, User, Notification, Invoice, ProjectMember } from '@prisma/client';
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useRouter } from "next/navigation";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

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
    });

    useEffect(() => {
        getDashboardStats().then(setStats);
        getFlowStats().then(data => {
            if (data && (data.role === "ADMIN" || data.role === "GLOBAL_ACCOUNTANT" || data.role === "GENERAL_MANAGER")) {
                setFlow({
                    projectsAllocated: (data as any).projectsAllocated ?? 0,
                    custodyIssued: (data as any).custodyIssued ?? 0,
                    custodyReturned: (data as any).custodyReturned ?? 0,
                    invoicesApproved: (data as any).invoicesApproved ?? 0,
                });
            }
        });
    }, []);

    const kpis = [
        { title: "إجمالي العُهد المصروفة", value: flow.custodyIssued, icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10", isCurrency: true },
        { title: "مُبالغ مُرجَعة من العُهد", value: flow.custodyReturned, icon: ArrowUpToLine, color: "text-amber-500", bg: "bg-amber-500/10", isCurrency: true },
    ];

    return (
        <DashboardLayout title="اللوحة المالية">
            <div className="space-y-6 md:space-y-8 pb-6">
                {/* الملخص المالي الموحد */}
                <ManagerFinancialOverview />

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
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
                                            ميزانية: {((p as any).budgetAllocated ?? 0).toLocaleString()} <CurrencyDisplay />
                                            {" • "}عُهد: {((p as any).custodyIssued ?? 0).toLocaleString()} <CurrencyDisplay />
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
                                                {invoice.type === 'SALES' ? 'مبيعات' : 'مشتريات'} — {(invoice.amount || 0).toLocaleString()} <CurrencyDisplay />
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
