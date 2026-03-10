"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import ManagerFinancialOverview from "@/components/dashboard/ManagerFinancialOverview";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { FolderKanban, Users, BellRing, ArrowUpToLine, TrendingUp, Building2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardStats, getFlowStats } from '@/actions/dashboard';
import { Project, User, ProjectMember, Notification } from '@prisma/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { AdminDashboardSkeleton } from "@/components/ui/SkeletonCard";

export default function AdminDashboard() {
    const router = useRouter();
    const [chartPeriod, setChartPeriod] = useState("شهري");
    const [isMounted, setIsMounted] = useState(false);

    const [stats, setStats] = useState({
        totalProjects: 0,
        completedProjects: 0,
        employees: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        todayRevenue: 0,
        todayWithdrawals: 0,
        pendingInvoices: [] as Array<{ id: string; amount: number; status: string }>,
        recentProjects: [] as Array<Project & { manager: User | null, members: ProjectMember[] }>,
        recentNotifications: [] as Notification[],
        chartData: { monthly: [] as { name: string, value: number }[], yearly: [] as { name: string, value: number }[] }
    });

    const [flow, setFlow] = useState({
        walletReceived: 0,
        walletSpent: 0,
        walletRemaining: 0,
        projectsAllocated: 0,
        custodyIssued: 0,
        custodyReturned: 0,
        invoicesApproved: 0,
        companyExpenses: 0,
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = () => {
        getDashboardStats().then(setStats);
        getFlowStats().then(data => {
            if (data && (data.role === "ADMIN" || data.role === "GLOBAL_ACCOUNTANT" || data.role === "GENERAL_MANAGER")) {
                setFlow({
                    walletReceived: data.walletReceived ?? 0,
                    walletSpent: data.walletSpent ?? 0,
                    walletRemaining: data.walletRemaining ?? 0,
                    projectsAllocated: data.projectsAllocated ?? 0,
                    custodyIssued: data.custodyIssued ?? 0,
                    custodyReturned: data.custodyReturned ?? 0,
                    invoicesApproved: data.invoicesApproved ?? 0,
                    companyExpenses: data.companyExpenses ?? 0,
                });
            }
        });
    };

    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        loadData();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    if (!isMounted) {
        return (
            <DashboardLayout title="الرئيسية">
                <AdminDashboardSkeleton />
            </DashboardLayout>
        );
    }

    const kpis = [
        { title: "عدد المشاريع", value: stats.totalProjects, icon: FolderKanban, color: "text-primary", bg: "bg-primary/10" },
        { title: "إجمالي الموظفين", value: stats.employees, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "العُهد المصروفة للموظفين", value: flow.custodyIssued, icon: ArrowUpToLine, color: "text-rose-500", bg: "bg-rose-500/10", isCurrency: true },
        { title: "مصاريف الشركة", value: flow.companyExpenses, icon: Building2, color: "text-purple-600", bg: "bg-purple-100", isCurrency: true },
    ];

    const chartData = chartPeriod === "شهري"
        ? stats.chartData.monthly
        : stats.chartData.yearly;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <DashboardLayout title="الرئيسية">
            <div className="space-y-6 md:space-y-8">

                {/* الملخص المالي الموحد */}
                <div className="flex justify-between items-center">
                    <div />
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        className="gap-2 text-xs h-8 px-3"
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>
                </div>
                <ManagerFinancialOverview />

                {/* KPI Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {kpis.map((kpi, i) => (
                        <Card key={i} className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 group cursor-default">
                            <div className="flex justify-between items-start w-full md:w-auto">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${kpi.bg} order-2 md:order-1 shadow-inner shadow-white/50`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} aria-hidden="true" />
                                </div>
                                <div className="order-1 md:order-2">
                                    <p className="text-xs md:text-sm font-semibold text-gray-500">{kpi.title}</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <p className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                            <AnimatedNumber value={kpi.value} delay={0.1 * i} />
                                        </p>
                                        {kpi.isCurrency && <span className="text-xs font-bold text-gray-400"><CurrencyDisplay /></span>}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </motion.div>

                {/* Charts Area */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* نسبة الإنجاز */}
                    <Card className="p-5 md:p-6 group cursor-default flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-6">
                            <h3 className="font-bold text-sm md:text-lg text-gray-800">نسبة الإنجاز</h3>
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="relative aspect-square w-[120px] md:w-full max-w-[160px] flex flex-col items-center justify-center rounded-full border-[12px] border-blue-100 border-t-primary shadow-inner shadow-blue-500/10 my-2 bg-gradient-to-tr from-white to-blue-50">
                            <span className="text-gray-900 font-black text-2xl md:text-4xl drop-shadow-sm">
                                {stats.totalProjects ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%
                            </span>
                        </div>
                    </Card>

                    {/* عدد المشاريع */}
                    <Card className="p-5 md:p-6 group cursor-default flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-6">
                            <h3 className="font-bold text-sm md:text-lg text-gray-800">المشاريع الكلية</h3>
                            <FolderKanban className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="relative aspect-square w-[120px] md:w-full max-w-[160px] flex flex-col items-center justify-center rounded-full border-[12px] border-blue-100 border-t-blue-500 shadow-inner shadow-blue-500/10 my-2 bg-gradient-to-tr from-white to-blue-50">
                            <span className="text-gray-900 font-black text-2xl md:text-4xl drop-shadow-sm">{stats.totalProjects}</span>
                        </div>
                    </Card>

                    {/* الإشعارات */}
                    <Card className="p-0 col-span-2 lg:col-span-1 lg:row-span-2 overflow-hidden flex flex-col">
                        <div className="p-5 md:p-6 border-b border-gray-100/50 bg-white/40 backdrop-blur-md">
                            <h3 className="font-bold text-base md:text-xl text-gray-900">آخر الإشعارات</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 custom-scrollbar">
                            {stats.recentNotifications.length > 0 ? stats.recentNotifications.map((n) => (
                                <div key={n.id} className="flex gap-4 items-start group hover:bg-white/50 p-2 -mx-2 rounded-xl transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-hover/20 flex items-center justify-center shrink-0 shadow-inner shadow-white/50 group-hover:scale-105 transition-transform duration-300">
                                        <BellRing className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="pt-1 flex-1 min-w-0">
                                        <p className="text-sm md:text-base font-bold text-gray-800 leading-snug">{n.title}</p>
                                        {n.content && (
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.content}</p>
                                        )}
                                        <p className="text-[11px] md:text-xs font-semibold text-gray-500 mt-1">{new Date(n.createdAt).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 flex flex-col items-center justify-center text-gray-500">
                                    <BellRing className="w-12 h-12 mb-3 opacity-20" />
                                    <span className="text-sm font-semibold">لا توجد إشعارات حديثة</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Bar Chart */}
                    <Card className="p-5 md:p-6 col-span-2 lg:col-span-2 flex flex-col min-h-[300px] h-80 md:h-[350px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-base md:text-xl text-gray-900">عدد المشاريع حسب الفترة</h3>
                            <select
                                className="text-xs md:text-sm font-semibold border-none text-primary bg-primary/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                                value={chartPeriod}
                                onChange={(e) => setChartPeriod(e.target.value)}
                            >
                                <option value="شهري">شهري</option>
                                <option value="سنوي">سنوي</option>
                            </select>
                        </div>
                        <div className="flex-1 w-full h-full pb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip cursor={{ fill: '#f3f4f6', radius: 8 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }} />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
                                        {chartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#102550" : "#2563eb"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* آخر المشاريع */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg md:text-xl">آخر المشاريع</h3>
                        <Button onClick={() => router.push('/projects')} className="text-xs text-primary hover:bg-primary/10 bg-transparent border-none shadow-none">الكل</Button>
                    </div>
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {stats.recentProjects.length > 0 ? stats.recentProjects.map(project => (
                            <Card key={project.id} className="p-5 md:p-6 space-y-4 relative overflow-hidden w-full hover:shadow-xl hover:shadow-primary/10 cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
                                <FolderKanban className="absolute -top-4 -start-4 w-32 h-32 text-gray-100 opacity-50 pointer-events-none rotate-12" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-base md:text-lg text-gray-900">{project.name}</h4>
                                        <span className={`inline-block px-2.5 py-0.5 text-[10px] md:text-xs font-bold rounded-md ${project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-primary'}`}>
                                            {project.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                                        <FolderKanban className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                <div className="relative z-10 grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-emerald-50 rounded-xl p-2">
                                        <p className="text-[10px] text-gray-500 font-semibold">الميزانية</p>
                                        <p className="text-xs font-black text-emerald-700">{(project.budgetAllocated ?? 0).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-2">
                                        <p className="text-[10px] text-gray-500 font-semibold">العُهد</p>
                                        <p className="text-xs font-black text-rose-700">{(project.custodyIssued ?? 0).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-2">
                                        <p className="text-[10px] text-gray-500 font-semibold">الأعضاء</p>
                                        <p className="text-xs font-black text-amber-700">{project.members.length}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 font-medium z-10 relative">
                                    {project.endDate ? `ينتهي: ${new Date(project.endDate).toLocaleDateString('en-GB')}` : 'تاريخ الانتهاء: غير محدد'}
                                </p>
                            </Card>
                        )) : (
                            <div className="col-span-3 text-center py-12 text-gray-400 font-medium">لا توجد مشاريع حديثة</div>
                        )}
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
