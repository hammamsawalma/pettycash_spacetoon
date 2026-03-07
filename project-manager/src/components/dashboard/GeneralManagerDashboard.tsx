"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { getGMDashboardStats, getFlowStats } from '@/actions/dashboard';
import {
    Wallet, FolderKanban, Users, FileText, ShoppingCart,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    Clock, ArrowRight, Building2, BarChart3, Star
} from 'lucide-react';
import { GeneralManagerDashboardSkeleton } from "@/components/ui/SkeletonCard";

type GMStats = Awaited<ReturnType<typeof getGMDashboardStats>>;
type FlowStats = Awaited<ReturnType<typeof getFlowStats>>;

const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } }
};

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; class: string }> = {
        REQUESTED: { label: "مطلوب", class: "bg-amber-100 text-amber-700" },
        IN_PROGRESS: { label: "جارٍ", class: "bg-blue-100 text-blue-700" },
        PURCHASED: { label: "تم الشراء", class: "bg-emerald-100 text-emerald-700" },
        CANCELLED: { label: "ملغى", class: "bg-red-100 text-red-700" },
        PENDING: { label: "معلّق", class: "bg-yellow-100 text-yellow-700" },
        APPROVED: { label: "معتمد", class: "bg-emerald-100 text-emerald-700" },
        REJECTED: { label: "مرفوض", class: "bg-red-100 text-red-700" },
        IN_PROGRESS_PROJECT: { label: "قيد التنفيذ", class: "bg-blue-100 text-blue-700" },
        CLOSED: { label: "مغلق", class: "bg-gray-100 text-gray-600" },
    };
    const badge = map[status] ?? { label: status, class: "bg-gray-100 text-gray-600" };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${badge.class}`}>
            {badge.label}
        </span>
    );
}

export default function GeneralManagerDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<GMStats>(null);
    const [flow, setFlow] = useState<FlowStats>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        getGMDashboardStats().then(setStats);
        getFlowStats().then(setFlow);
    }, []);

    if (!isMounted || !stats) {
        return (
            <DashboardLayout title="لوحة المدير العام">
                <GeneralManagerDashboardSkeleton />
            </DashboardLayout>
        );
    }

    const walletFlow = (flow && 'walletRemaining' in flow) ? flow as any : null;

    const kpis = [
        {
            title: "رصيد الخزنة",
            value: stats.wallet.balance,
            icon: Wallet,
            color: "text-emerald-600",
            bg: "from-emerald-500 to-emerald-600",
            isCurrency: true,
            sub: `إجمالي الإيداعات: ${stats.wallet.totalIn.toLocaleString()}`,
        },
        {
            title: "المشاريع النشطة",
            value: stats.projects.inProgress,
            icon: FolderKanban,
            color: "text-blue-600",
            bg: "from-blue-500 to-blue-600",
            isCurrency: false,
            sub: `إجمالي: ${stats.projects.total} مشروع`,
        },
        {
            title: "الموظفون",
            value: stats.employees,
            icon: Users,
            color: "text-blue-600",
            bg: "from-[#102550] to-[#2563eb]",
            isCurrency: false,
            sub: "العدد الكلي للموظفين",
        },
        {
            title: "الفواتير المعلّقة",
            value: stats.invoices.pendingCount,
            icon: FileText,
            color: "text-amber-600",
            bg: "from-amber-500 to-orange-500",
            isCurrency: false,
            sub: `بقيمة: ${stats.invoices.pending.toLocaleString()}`,
        },
    ];

    return (
        <DashboardLayout title="لوحة المدير العام">
            <div className="space-y-6 md:space-y-8">

                {/* Welcome Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#102550] via-[#1a3a7c] to-[#122b5e] p-6 md:p-8 text-white shadow-xl shadow-[#102550]/25"
                >
                    {/* decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/05 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-32 rounded-full bg-white/05 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between gap-4 flex-col sm:flex-row">
                        <div className="space-y-1 text-center sm:text-right">
                            <p className="text-white/70 text-sm font-medium">مرحباً بك</p>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">لوحة المدير العام</h1>
                            <p className="text-white/60 text-sm">نظرة شاملة على أداء الشركة — كل شيء في مكان واحد</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* KPI Grid */}
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {kpis.map((kpi, i) => (
                        <motion.div key={i} variants={fadeUp}>
                            <Card className="p-5 group cursor-default overflow-hidden relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">{kpi.title}</p>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-2xl font-black text-gray-900">
                                                <AnimatedNumber value={kpi.value} delay={0.1 * i} />
                                            </p>
                                            {kpi.isCurrency && <span className="text-xs font-bold text-gray-400"><CurrencyDisplay /></span>}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{kpi.sub}</p>
                                    </div>
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.bg} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        <kpi.icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Financial Flow Row */}
                {walletFlow && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="p-5 md:p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-lg text-gray-900">التدفق المالي الشامل</h3>
                                <TrendingUp className="w-5 h-5 text-[#102550]" />
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {[
                                    { label: "وارد الخزنة", value: walletFlow.walletReceived, color: "text-emerald-600", bg: "bg-emerald-50" },
                                    { label: "موزَّع للمشاريع", value: walletFlow.projectsAllocated, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: "عهد للموظفين", value: walletFlow.custodyIssued, color: "text-amber-600", bg: "bg-amber-50" },
                                    { label: "عهد مُرجَعة", value: walletFlow.custodyReturned, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: "فواتير معتمدة", value: walletFlow.invoicesApproved, color: "text-rose-600", bg: "bg-rose-50" },
                                    { label: "رصيد الخزنة", value: walletFlow.walletRemaining, color: "text-emerald-700", bg: "bg-emerald-100 ring-1 ring-emerald-200" },
                                ].map((item, i) => (
                                    <div key={i} className={`rounded-xl p-3 text-center ${item.bg}`}>
                                        <p className={`text-base font-black ${item.color}`}>
                                            {item.value.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5 leading-tight">{item.label}</p>
                                        <p className="text-[9px] text-gray-400 font-bold"><CurrencyDisplay /></p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* الفواتير المعلقة */}
                    <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100/60 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">الفواتير المعلّقة</h3>
                                {stats.invoices.pendingCount > 0 && (
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                                        {stats.invoices.pendingCount}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => router.push('/invoices')}
                                className="text-xs text-[#102550] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                عرض الكل <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {stats.pendingInvoices.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {stats.pendingInvoices.map((inv) => (
                                        <div
                                            key={inv.id}
                                            onClick={() => router.push(`/invoices`)}
                                            className="p-4 flex items-center gap-4 hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <FileText className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{inv.reference}</p>
                                                <p className="text-xs text-gray-500">{(inv as any).creator?.name ?? '—'} · {(inv as any).project?.name ?? 'بدون مشروع'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-gray-900">{inv.amount.toLocaleString()}</p>
                                                <StatusBadge status={inv.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="font-semibold text-sm">لا توجد فواتير معلقة</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* إحصائيات سريعة */}
                    <div className="space-y-4">
                        {/* حالة المشتريات */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">المشتريات</h3>
                            </div>
                            <div className="space-y-2.5">
                                {[
                                    { label: "مطلوب", value: stats.purchaseStats.requested, color: "bg-amber-400" },
                                    { label: "جارٍ", value: stats.purchaseStats.inProgress, color: "bg-blue-400" },
                                    { label: "تم الشراء", value: stats.purchaseStats.purchased, color: "bg-emerald-400" },
                                ].map((item, i) => {
                                    const total = stats.purchaseStats.requested + stats.purchaseStats.inProgress + stats.purchaseStats.purchased || 1;
                                    const pct = Math.round((item.value / total) * 100);
                                    return (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                                                <span className="text-xs font-black text-gray-900">{item.value}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                                                    className={`h-full rounded-full ${item.color}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => router.push('/purchases')}
                                    className="w-full mt-2 text-xs text-[#102550] font-semibold flex items-center justify-center gap-1 hover:gap-2 transition-all pt-1"
                                >
                                    عرض كل المشتريات <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </Card>

                        {/* العهد */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">العُهَد</h3>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: "موزَّع للمشاريع", value: stats.custody.allocated, color: "text-blue-600" },
                                    { label: "مصروف للموظفين", value: stats.custody.issued, color: "text-rose-600" },
                                    { label: "مُرجَع من الموظفين", value: stats.custody.returned, color: "text-emerald-600" },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                                        <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                                        <span className={`text-sm font-black ${item.color}`}>
                                            {item.value.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold"><CurrencyDisplay /></span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* الملخص المالي للفواتير */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">الفواتير</h3>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: "معتمدة", value: stats.invoices.approved, color: "text-emerald-600", icon: CheckCircle2 },
                                    { label: "معلّقة", value: stats.invoices.pending, color: "text-amber-600", icon: Clock },
                                    { label: "مرفوضة", value: stats.invoices.rejected, color: "text-red-500", icon: TrendingDown },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-1.5">
                                            <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                            <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                                        </div>
                                        <span className={`text-sm font-black ${item.color}`}>
                                            {item.value.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* المشتريات العاجلة */}
                {stats.urgentPurchases.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <Card className="p-0 overflow-hidden">
                            <div className="p-5 border-b border-gray-100/60 flex justify-between items-center bg-gradient-to-r from-red-50 to-orange-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">مشترياتي العاجلة</h3>
                                        <p className="text-xs text-gray-500">الطلبات ذات الأولوية القصوى</p>
                                    </div>
                                </div>
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                                    URGENT
                                </span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {stats.urgentPurchases.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => router.push('/purchases')}
                                        className="p-4 flex items-center gap-4 hover:bg-red-50/30 transition-colors cursor-pointer group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-red-100">
                                            <ShoppingCart className="w-4 h-4 text-red-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate">{p.description}</p>
                                            <p className="text-xs text-gray-400">{(p as any).project?.name ?? 'بدون مشروع'} · {p.orderNumber}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-gray-900">{p.amount > 0 ? `${p.amount.toLocaleString()}` : '—'}</p>
                                            <StatusBadge status={p.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* آخر المشاريع */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900">آخر المشاريع</h3>
                        <button
                            onClick={() => router.push('/projects')}
                            className="text-xs text-[#102550] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            عرض الكل <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {stats.projects.recent.map((project) => (
                            <Card
                                key={project.id}
                                onClick={() => router.push(`/projects/${project.id}`)}
                                className="p-5 hover:shadow-xl hover:shadow-[#102550]/10 cursor-pointer group transition-all duration-200 relative overflow-hidden"
                            >
                                <FolderKanban className="absolute -top-4 -right-4 w-28 h-28 text-gray-100 rotate-12 pointer-events-none" />
                                <div className="relative z-10 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-[#102550] transition-colors">{project.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{(project as any).manager?.name ?? 'بلا مدير'}</p>
                                        </div>
                                        <StatusBadge status={project.status} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-blue-50 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-500 font-semibold">الميزانية</p>
                                            <p className="text-xs font-black text-blue-700">{((project as any).budgetAllocated ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-rose-50 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-500 font-semibold">العُهد</p>
                                            <p className="text-xs font-black text-rose-700">{((project as any).custodyIssued ?? 0).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-500 font-semibold">الأعضاء</p>
                                            <p className="text-xs font-black text-emerald-700">{project.members.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
