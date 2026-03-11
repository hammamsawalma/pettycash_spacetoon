"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { getRootDashboardStats } from '@/actions/dashboard';
import {
    Wallet, FolderKanban, Users, FileText,
    Globe2, TrendingUp, Building2, Shield,
    ArrowRight
} from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext";

type RootStats = NonNullable<Awaited<ReturnType<typeof getRootDashboardStats>>>;

const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } }
};

export default function RootDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<RootStats | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { locale } = useLanguage();

    useEffect(() => {
        setIsMounted(true);
        getRootDashboardStats().then(setStats);
    }, []);

    if (!isMounted || !stats) {
        return (
            <DashboardLayout title={locale === 'ar' ? "لوحة تحكم ROOT" : "ROOT Dashboard"}>
                <div className="space-y-6">
                    {/* Skeleton */}
                    <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />)}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const kpis = [
        {
            title: locale === 'ar' ? "إجمالي المشاريع" : "Total Projects",
            value: stats.totals.projects,
            icon: FolderKanban,
            bg: "from-blue-500 to-blue-600",
            sub: locale === 'ar' ? `${stats.totals.activeProjects} نشط` : `${stats.totals.activeProjects} active`,
        },
        {
            title: locale === 'ar' ? "إجمالي الموظفين" : "Total Employees",
            value: stats.totals.employees,
            icon: Users,
            bg: "from-[#102550] to-[#2563eb]",
            sub: locale === 'ar' ? `عبر ${stats.branches.length} فرع` : `Across ${stats.branches.length} branches`,
        },
        {
            title: locale === 'ar' ? "رصيد الخزن الموحّد" : "Consolidated Wallet Balance",
            value: stats.totals.walletBalance,
            icon: Wallet,
            bg: "from-emerald-500 to-emerald-600",
            sub: `${locale === 'ar' ? 'وارد' : 'Incoming'}: ${stats.totals.walletTotalIn.toLocaleString('en-US')}`,
            isCurrency: true,
        },
        {
            title: locale === 'ar' ? "فواتير معلّقة" : "Pending Invoices",
            value: stats.totals.pendingInvoices,
            icon: FileText,
            bg: "from-amber-500 to-orange-500",
            sub: `${locale === 'ar' ? 'بقيمة' : 'Worth'}: ${stats.totals.pendingInvoiceAmount.toLocaleString('en-US')}`,
        },
    ];

    // Find max wallet for chart scale
    const maxWallet = Math.max(...stats.branches.map(b => b.walletBalance), 1);

    return (
        <DashboardLayout title={locale === 'ar' ? "لوحة تحكم ROOT" : "ROOT Dashboard"}>
            <div className="space-y-6 md:space-y-8">

                {/* Welcome Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-[#16213e] p-6 md:p-8 text-white shadow-xl shadow-gray-900/30"
                >
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-32 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between gap-4 flex-col sm:flex-row">
                        <div className="space-y-1 text-center sm:text-right">
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <Shield className="w-5 h-5 text-amber-400" />
                                <p className="text-amber-400/90 text-sm font-bold">ROOT ACCESS</p>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{locale === 'ar' ? 'لوحة التحكم المركزية' : 'Central Dashboard'}</h1>
                            <p className="text-white/50 text-sm">{locale === 'ar' ? `نظرة شاملة على جميع فروع الشركة — ${stats.branches.length} فروع نشطة` : `Overview of all company branches — ${stats.branches.length} active branches`}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <Globe2 className="w-7 h-7 text-white" />
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

                {/* Branch Cards Grid */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900">{locale === 'ar' ? 'الفروع النشطة' : 'Active Branches'}</h3>
                        <button
                            onClick={() => router.push('/branches')}
                            className="text-xs text-[#102550] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            {locale === 'ar' ? 'إدارة الفروع' : 'Manage Branches'} <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    >
                        {stats.branches.map((branch) => (
                            <motion.div key={branch.id} variants={fadeUp}>
                                <Card className="p-5 hover:shadow-xl hover:shadow-[#102550]/10 cursor-pointer group transition-all duration-200 relative overflow-hidden">
                                    <Building2 className="absolute -top-4 -right-4 w-28 h-28 text-gray-100 rotate-12 pointer-events-none" />
                                    <div className="relative z-10 space-y-4">
                                        {/* Branch Header */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                                                {branch.flag}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-[#102550] transition-colors">{branch.name}</h4>
                                                <p className="text-xs text-gray-400 font-medium">{branch.country} · {branch.currency}</p>
                                            </div>
                                        </div>

                                        {/* Branch Stats */}
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-blue-50 rounded-lg p-2">
                                                <p className="text-[10px] text-gray-500 font-semibold">{locale === 'ar' ? 'المشاريع' : 'Projects'}</p>
                                                <p className="text-sm font-black text-blue-700">{branch.projects}</p>
                                            </div>
                                            <div className="bg-[#102550]/5 rounded-lg p-2">
                                                <p className="text-[10px] text-gray-500 font-semibold">{locale === 'ar' ? 'الموظفون' : 'Employees'}</p>
                                                <p className="text-sm font-black text-[#102550]">{branch.employees}</p>
                                            </div>
                                            <div className="bg-emerald-50 rounded-lg p-2">
                                                <p className="text-[10px] text-gray-500 font-semibold">{locale === 'ar' ? 'الخزنة' : 'Wallet'}</p>
                                                <p className="text-sm font-black text-emerald-700">{branch.walletBalance.toLocaleString('en-US')}</p>
                                            </div>
                                        </div>

                                        {/* Pending indicator */}
                                        {branch.pendingInvoices > 0 && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                                <span className="text-amber-600 font-semibold">{locale === 'ar' ? `${branch.pendingInvoices} فاتورة معلّقة` : `${branch.pendingInvoices} pending invoices`}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Branch Wallet Comparison */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="p-5 md:p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-lg text-gray-900">{locale === 'ar' ? 'مقارنة رصيد الخزنة بين الفروع' : 'Wallet Balance Comparison'}</h3>
                            <TrendingUp className="w-5 h-5 text-[#102550]" />
                        </div>
                        <div className="space-y-3">
                            {stats.branches.map((branch) => {
                                const pct = Math.round((branch.walletBalance / maxWallet) * 100);
                                return (
                                    <div key={branch.id} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{branch.flag}</span>
                                                <span className="text-sm font-bold text-gray-700">{branch.name}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">({branch.currency})</span>
                                            </div>
                                            <span className="text-sm font-black text-gray-900">{branch.walletBalance.toLocaleString('en-US')}</span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                                className="h-full rounded-full bg-gradient-to-r from-[#102550] to-[#2563eb]"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </motion.div>

                {/* Financial Overview */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="p-5 md:p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-lg text-gray-900">{locale === 'ar' ? 'التدفق المالي الموحّد' : 'Consolidated Financial Flow'}</h3>
                            <Wallet className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: locale === 'ar' ? "إجمالي الوارد" : "Total Incoming", value: stats.totals.walletTotalIn, color: "text-emerald-600", bg: "bg-emerald-50" },
                                { label: locale === 'ar' ? "إجمالي المنصرف" : "Total Outgoing", value: stats.totals.walletTotalOut, color: "text-rose-600", bg: "bg-rose-50" },
                                { label: locale === 'ar' ? "الرصيد الحالي" : "Current Balance", value: stats.totals.walletBalance, color: "text-emerald-700", bg: "bg-emerald-100 ring-1 ring-emerald-200" },
                                { label: locale === 'ar' ? "فواتير معلّقة" : "Pending Invoices", value: stats.totals.pendingInvoiceAmount, color: "text-amber-600", bg: "bg-amber-50" },
                            ].map((item, i) => (
                                <div key={i} className={`rounded-xl p-4 text-center ${item.bg}`}>
                                    <p className={`text-lg font-black ${item.color}`}>
                                        {item.value.toLocaleString('en-US')}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-semibold mt-1">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
