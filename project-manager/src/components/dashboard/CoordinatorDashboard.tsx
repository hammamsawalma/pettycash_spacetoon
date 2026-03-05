"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustodyBalanceCard from "@/components/dashboard/CustodyBalanceCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FolderKanban, Wallet, ArrowUpToLine, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDashboardStats, getFlowStats } from '@/actions/dashboard';
import { Project, User, ProjectMember, Notification } from '@prisma/client';
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

export default function CoordinatorDashboard() {
    const [isMounted, setIsMounted] = useState(false);

    const [stats, setStats] = useState({
        totalProjects: 0,
        completedProjects: 0,
        employees: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        todayRevenue: 0,
        todayWithdrawals: 0,
        pendingInvoices: [] as any[],
        recentProjects: [] as Array<Project & { manager: User | null, members: ProjectMember[] }>,
        recentNotifications: [] as Notification[],
        chartData: { monthly: [] as any[], yearly: [] as any[] }
    });

    const [flow, setFlow] = useState({
        received: 0,
        issued: 0,
        spent: 0,
        remaining: 0,
    });

    useEffect(() => {
        setIsMounted(true);
        getDashboardStats().then(setStats);
        getFlowStats().then(data => {
            if (data && data.role === "USER") {
                setFlow({
                    received: (data as any).received ?? 0,
                    issued: (data as any).issued ?? 0,
                    spent: (data as any).spent ?? 0,
                    remaining: (data as any).remaining ?? 0,
                });
            }
        });
    }, []);

    if (!isMounted) {
        return <DashboardLayout title="لوحة التنسيق"><div className="min-h-screen flex items-center justify-center p-8"><span className="animate-pulse">جاري التحميل...</span></div></DashboardLayout>;
    }

    const kpis = [
        { title: "ميزانية مشاريعي (وصل)", value: flow.received, icon: FolderKanban, color: "text-[#7F56D9]", bg: "bg-[#7F56D9]/10", isCurrency: true },
        { title: "عُهد صُرفت للموظفين", value: flow.issued, icon: Wallet, color: "text-rose-500", bg: "bg-rose-500/10", isCurrency: true },
        { title: "إنفاق فعلي (فواتير)", value: flow.spent, icon: Receipt, color: "text-amber-500", bg: "bg-amber-500/10", isCurrency: true },
        { title: "المتبقي في المشاريع", value: flow.remaining, icon: ArrowUpToLine, color: "text-emerald-500", bg: "bg-emerald-500/10", isCurrency: true },
    ];

    return (
        <DashboardLayout title="لوحة التنسيق">
            <div className="space-y-6 md:space-y-8 pb-6">
                <CustodyBalanceCard />

                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {kpis.map((kpi, i) => (
                        <Card key={i} className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 group cursor-default shadow-sm border-gray-100">
                            <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl transition-transform duration-300 md:group-hover:scale-110 shrink-0 ${kpi.bg}`}>
                                <kpi.icon className={`h-5 w-5 md:h-6 md:w-6 ${kpi.color}`} aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm font-bold text-gray-500 mb-1 leading-snug">{kpi.title}</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-xl md:text-2xl font-black text-gray-900 drop-shadow-sm">
                                        <AnimatedNumber value={kpi.value} delay={0.08 * i} />
                                    </p>
                                    {kpi.isCurrency && <span className="text-[10px] font-bold text-gray-400"><CurrencyDisplay /></span>}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* متابعة سير المشاريع */}
                    <Card className="p-0 lg:col-span-2 overflow-hidden flex flex-col h-[350px] md:h-[400px] shadow-sm border-gray-100">
                        <div className="p-5 md:p-6 border-b border-gray-100/50 bg-gray-50/50">
                            <h3 className="font-bold text-base md:text-lg text-gray-900">متابعة سير المشاريع</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar bg-white">
                            {stats.recentProjects.slice(0, 4).map(project => (
                                <div key={project.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 md:p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors gap-3">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-50 flex items-center justify-center text-[#7F56D9] font-bold shrink-0">
                                            {project.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm md:text-base text-gray-900">{project.name}</h4>
                                            <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">
                                                {project.manager?.name || 'بدون مدير'}
                                                {" • "}ميزانية: {((project as any).budgetAllocated ?? 0).toLocaleString()} <CurrencyDisplay />
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={() => window.location.href = `/projects/${project.id}`} variant="outline" className="w-full sm:w-auto h-8 px-4 text-[11px] md:text-xs font-bold border-gray-200">تفاصيل المشروع</Button>
                                </div>
                            ))}
                            {stats.recentProjects.length === 0 && (
                                <div className="flex justify-center items-center h-full text-gray-400 font-medium text-xs md:text-sm">لا توجد مشاريع للمتابعة.</div>
                            )}
                        </div>
                    </Card>

                    {/* الإشعارات */}
                    <Card className="p-0 overflow-hidden flex flex-col h-[350px] md:h-[400px] shadow-sm border-gray-100">
                        <div className="p-5 md:p-6 border-b border-gray-100/50 bg-gray-50/50">
                            <h3 className="font-bold text-base md:text-lg text-gray-900">آخر الإشعارات</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar bg-white">
                            {stats.recentNotifications.length > 0 ? stats.recentNotifications.map(n => (
                                <div key={n.id} className="flex gap-3 items-start p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                        <FolderKanban className="w-4 h-4 text-[#7F56D9]" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 leading-snug">{n.title}</p>
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(n.createdAt).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 font-medium text-center py-8">لا توجد إشعارات جديدة.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
