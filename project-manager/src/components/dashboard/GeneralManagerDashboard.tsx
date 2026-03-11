"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { getGMDashboardStats, getFlowStats, getBranchesForGM, getGMBranchComparison } from '@/actions/dashboard';
import {
    Wallet, FolderKanban, Users, FileText, ShoppingCart,
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    Clock, ArrowRight, Building2, BarChart3, Star, Filter,
    ChevronDown, Globe
} from 'lucide-react';
import { GeneralManagerDashboardSkeleton } from "@/components/ui/SkeletonCard";
import { useLanguage } from "@/context/LanguageContext";

type GMStats = Awaited<ReturnType<typeof getGMDashboardStats>>;
type FlowStats = Awaited<ReturnType<typeof getFlowStats>>;
type BranchItem = { id: string; name: string; code: string; flag: string | null };
type BranchComparison = Awaited<ReturnType<typeof getGMBranchComparison>>;

// Narrowed type for wallet flow (returned when role is ADMIN/ACC/GM)
type WalletFlow = NonNullable<FlowStats> & {
    walletRemaining: number;
    walletReceived: number;
    projectsAllocated: number;
    custodyIssued: number;
    custodyReturned: number;
    invoicesApproved: number;
    companyExpenses: number;
};

// Types for pending invoices with included relations
type PendingInvoice = {
    id: string;
    reference: string;
    amount: number;
    status: string;
    creator?: { id: string; name: string } | null;
    project?: { id: string; name: string } | null;
};

// Types for urgent purchases with included relations
type UrgentPurchase = {
    id: string;
    description: string;
    amount: number;
    status: string;
    orderNumber: string;
    project?: { id: string; name: string } | null;
};

// Types for recent projects with included relations
type RecentProject = {
    id: string;
    name: string;
    status: string;
    budgetAllocated?: number | null;
    custodyIssued?: number | null;
    manager?: { id: string; name: string } | null;
    members: { id?: string }[];
};

const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } }
};

function StatusBadge({ status }: { status: string }) {
    const { locale } = useLanguage();
    const map: Record<string, { label: string; class: string }> = {
        REQUESTED: { label: locale === 'ar' ? "مطلوب" : "Requested", class: "bg-amber-100 text-amber-700" },
        IN_PROGRESS: { label: locale === 'ar' ? "جارٍ" : "In Progress", class: "bg-blue-100 text-blue-700" },
        PURCHASED: { label: locale === 'ar' ? "تم الشراء" : "Purchased", class: "bg-emerald-100 text-emerald-700" },
        CANCELLED: { label: locale === 'ar' ? "ملغى" : "Cancelled", class: "bg-red-100 text-red-700" },
        PENDING: { label: locale === 'ar' ? "معلّق" : "Pending", class: "bg-yellow-100 text-yellow-700" },
        APPROVED: { label: locale === 'ar' ? "معتمد" : "Approved", class: "bg-emerald-100 text-emerald-700" },
        REJECTED: { label: locale === 'ar' ? "مرفوض" : "Rejected", class: "bg-red-100 text-red-700" },
        IN_PROGRESS_PROJECT: { label: locale === 'ar' ? "قيد التنفيذ" : "In Progress", class: "bg-blue-100 text-blue-700" },
        CLOSED: { label: locale === 'ar' ? "مغلق" : "Closed", class: "bg-gray-100 text-gray-600" },
    };
    const badge = map[status] ?? { label: status, class: "bg-gray-100 text-gray-600" };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${badge.class}`}>
            {badge.label}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════
// Branch Selector Dropdown
// ═══════════════════════════════════════════════════════════════
function BranchSelector({
    branches,
    selectedBranchId,
    onSelect,
    loading
}: {
    branches: BranchItem[];
    selectedBranchId: string | null;
    onSelect: (id: string | null) => void;
    loading: boolean;
}) {
    const { locale } = useLanguage();
    const [open, setOpen] = useState(false);
    const selectedBranch = branches.find(b => b.id === selectedBranchId);

    return (
        <div className="relative" id="gm-branch-selector">
            <button
                onClick={() => setOpen(!open)}
                disabled={loading}
                className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 
                    ${selectedBranchId ? 'border-[#102550] bg-[#102550]/5' : 'border-gray-200 bg-white'}
                    hover:border-[#102550] transition-all duration-200 shadow-sm
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                {selectedBranch ? (
                    <>
                        <span className="text-lg">{selectedBranch.flag || '🏢'}</span>
                        <span className="font-bold text-sm text-[#102550]">{selectedBranch.name}</span>
                    </>
                ) : (
                    <>
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="font-bold text-sm text-gray-700">{locale === 'ar' ? 'كل الفروع' : 'All Branches'}</span>
                    </>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[200px]"
                    >
                        <button
                            onClick={() => { onSelect(null); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors
                                ${!selectedBranchId ? 'bg-[#102550]/5 border-r-2 border-[#102550]' : ''}`}
                        >
                            <Globe className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-sm">{locale === 'ar' ? 'كل الفروع' : 'All Branches'}</span>
                        </button>
                        {branches.map(branch => (
                            <button
                                key={branch.id}
                                onClick={() => { onSelect(branch.id); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors
                                    ${selectedBranchId === branch.id ? 'bg-[#102550]/5 border-r-2 border-[#102550]' : ''}`}
                            >
                                <span className="text-lg">{branch.flag || '🏢'}</span>
                                <div>
                                    <span className="font-semibold text-sm block">{branch.name}</span>
                                    <span className="text-[10px] text-gray-400">{branch.code}</span>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop to close */}
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Branch Comparison Table
// ═══════════════════════════════════════════════════════════════
function BranchComparisonTable({ data }: { data: BranchComparison }) {
    const { locale } = useLanguage();
    if (!data || data.length === 0) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-0 overflow-hidden" id="gm-branch-comparison">
                <div className="p-5 border-b border-gray-100/60 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#102550]/10 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-[#102550]" />
                    </div>
                    <h3 className="font-bold text-gray-900">{locale === 'ar' ? 'مقارنة أداء الفروع' : 'Branch Performance Comparison'}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500">
                                <th className="py-3 px-4 text-right font-semibold">{locale === 'ar' ? 'الفرع' : 'Branch'}</th>
                                <th className="py-3 px-3 text-center font-semibold">{locale === 'ar' ? 'المشاريع' : 'Projects'}</th>
                                <th className="py-3 px-3 text-center font-semibold">{locale === 'ar' ? 'النشطة' : 'Active'}</th>
                                <th className="py-3 px-3 text-center font-semibold">{locale === 'ar' ? 'الموظفون' : 'Employees'}</th>
                                <th className="py-3 px-3 text-center font-semibold">{locale === 'ar' ? 'رصيد الخزنة' : 'Wallet'}</th>
                                <th className="py-3 px-3 text-center font-semibold">{locale === 'ar' ? 'الفواتير' : 'Invoices'}</th>
                                <th className="py-3 px-3 text-center font-semibold">{locale === 'ar' ? 'العُهد' : 'Custody'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map((branch) => (
                                <tr key={branch.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{branch.flag || '🏢'}</span>
                                            <div>
                                                <p className="font-bold text-gray-800">{branch.name}</p>
                                                <p className="text-[10px] text-gray-400">{branch.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span className="font-black text-blue-700">{branch.projects}</span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-lg">
                                            {branch.activeProjects}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span className="font-black text-gray-700">{branch.employees}</span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span className="font-black text-emerald-700">
                                            {branch.walletBalance.toLocaleString('en-US')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <span className="font-black text-rose-600">
                                            {branch.totalInvoices.toLocaleString('en-US')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-amber-600 text-xs">
                                                {branch.custodyIssued.toLocaleString('en-US')}
                                            </span>
                                            <span className="text-[9px] text-gray-400">{locale === 'ar' ? 'مصروف' : 'Spent'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* Totals row */}
                            <tr className="bg-[#102550]/5 font-bold">
                                <td className="py-3 px-4 text-[#102550]">{locale === 'ar' ? '📊 المجموع' : '📊 Total'}</td>
                                <td className="py-3 px-3 text-center text-blue-800">
                                    {data.reduce((s, b) => s + b.projects, 0)}
                                </td>
                                <td className="py-3 px-3 text-center text-blue-800">
                                    {data.reduce((s, b) => s + b.activeProjects, 0)}
                                </td>
                                <td className="py-3 px-3 text-center text-gray-800">
                                    {data.reduce((s, b) => s + b.employees, 0)}
                                </td>
                                <td className="py-3 px-3 text-center text-emerald-800">
                                    {data.reduce((s, b) => s + b.walletBalance, 0).toLocaleString('en-US')}
                                </td>
                                <td className="py-3 px-3 text-center text-rose-700">
                                    {data.reduce((s, b) => s + b.totalInvoices, 0).toLocaleString('en-US')}
                                </td>
                                <td className="py-3 px-3 text-center text-amber-700">
                                    {data.reduce((s, b) => s + b.custodyIssued, 0).toLocaleString('en-US')}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Main Dashboard Component
// ═══════════════════════════════════════════════════════════════
export default function GeneralManagerDashboard() {
    const router = useRouter();
    const { locale: gmLocale } = useLanguage();
    const [stats, setStats] = useState<GMStats>(null);
    const [flow, setFlow] = useState<FlowStats>(null);
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [comparison, setComparison] = useState<BranchComparison>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load branches once
    useEffect(() => {
        setIsMounted(true);
        getBranchesForGM().then(setBranches).catch(err => console.error("[GMDashboard] getBranchesForGM failed:", err));
        getGMBranchComparison().then(setComparison).catch(err => console.error("[GMDashboard] getGMBranchComparison failed:", err));
    }, []);

    // Load stats whenever branch changes
    const loadStats = useCallback(async (branchId: string | null) => {
        setIsLoading(true);
        try {
            const [statsData, flowData] = await Promise.all([
                getGMDashboardStats(branchId || undefined),
                getFlowStats(),
            ]);
            setStats(statsData);
            setFlow(flowData);
        } catch (err) {
            console.error("[GMDashboard] loadStats failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isMounted) loadStats(selectedBranchId);
    }, [isMounted, selectedBranchId, loadStats]);

    const handleBranchChange = (branchId: string | null) => {
        setSelectedBranchId(branchId);
    };

    if (!isMounted || !stats) {
        return (
            <DashboardLayout title={gmLocale === 'ar' ? "لوحة المدير العام" : "General Manager Dashboard"}>
                <GeneralManagerDashboardSkeleton />
            </DashboardLayout>
        );
    }

    const walletFlow: WalletFlow | null = (flow && 'walletRemaining' in flow) ? flow as WalletFlow : null;
    const selectedBranch = branches.find(b => b.id === selectedBranchId);

    const kpis = [
        {
            title: gmLocale === 'ar' ? "رصيد الخزنة" : "Wallet Balance",
            value: stats.wallet.balance,
            icon: Wallet,
            color: "text-emerald-600",
            bg: "from-emerald-500 to-emerald-600",
            isCurrency: true,
            sub: gmLocale === 'ar' ? `إجمالي الإيداعات: ${stats.wallet.totalIn.toLocaleString('en-US')}` : `Total deposits: ${stats.wallet.totalIn.toLocaleString('en-US')}`,
        },
        {
            title: gmLocale === 'ar' ? "المشاريع النشطة" : "Active Projects",
            value: stats.projects.inProgress,
            icon: FolderKanban,
            color: "text-blue-600",
            bg: "from-blue-500 to-blue-600",
            isCurrency: false,
            sub: gmLocale === 'ar' ? `إجمالي: ${stats.projects.total} مشروع` : `Total: ${stats.projects.total} projects`,
        },
        {
            title: gmLocale === 'ar' ? "الموظفون" : "Employees",
            value: stats.employees,
            icon: Users,
            color: "text-blue-600",
            bg: "from-[#102550] to-[#2563eb]",
            isCurrency: false,
            sub: selectedBranch ? (gmLocale === 'ar' ? `فرع ${selectedBranch.name}` : `Branch ${selectedBranch.name}`) : (gmLocale === 'ar' ? "العدد الكلي للموظفين" : "Total employees"),
        },
        {
            title: gmLocale === 'ar' ? "الفواتير المعلّقة" : "Pending Invoices",
            value: stats.invoices.pendingCount,
            icon: FileText,
            color: "text-amber-600",
            bg: "from-amber-500 to-orange-500",
            isCurrency: false,
            sub: gmLocale === 'ar' ? `بقيمة: ${stats.invoices.pending.toLocaleString('en-US')}` : `Worth: ${stats.invoices.pending.toLocaleString('en-US')}`,
        },
    ];

    return (
        <DashboardLayout title={gmLocale === 'ar' ? "لوحة المدير العام" : "General Manager Dashboard"}>
            <div className="space-y-6 md:space-y-8">

                {/* Welcome Banner + Branch Selector */}
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
                            <p className="text-white/70 text-sm font-medium">{gmLocale === 'ar' ? 'مرحباً بك' : 'Welcome'}</p>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{gmLocale === 'ar' ? 'لوحة المدير العام' : 'General Manager Dashboard'}</h1>
                            <p className="text-white/60 text-sm">
                                {selectedBranch
                                    ? (gmLocale === 'ar' ? `${selectedBranch.flag || '🏢'} عرض بيانات فرع ${selectedBranch.name}` : `${selectedBranch.flag || '🏢'} Viewing ${selectedBranch.name} branch data`)
                                    : (gmLocale === 'ar' ? 'نظرة شاملة على أداء الشركة — كل الفروع' : 'Company performance overview — all branches')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <BranchSelector
                                branches={branches}
                                selectedBranchId={selectedBranchId}
                                onSelect={handleBranchChange}
                                loading={isLoading}
                            />
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Loading overlay */}
                {isLoading && (
                    <div className="flex justify-center py-2">
                        <div className="flex items-center gap-2 bg-[#102550]/10 px-4 py-2 rounded-xl">
                            <div className="w-4 h-4 border-2 border-[#102550] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-semibold text-[#102550]">{gmLocale === 'ar' ? 'جاري التحديث...' : 'Updating...'}</span>
                        </div>
                    </div>
                )}

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

                {/* Branch Comparison Table — only when showing all branches */}
                {!selectedBranchId && comparison.length > 0 && (
                    <BranchComparisonTable data={comparison} />
                )}

                {/* Financial Flow Row */}
                {walletFlow && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="p-5 md:p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-bold text-lg text-gray-900">{gmLocale === 'ar' ? 'التدفق المالي الشامل' : 'Comprehensive Financial Flow'}</h3>
                                <TrendingUp className="w-5 h-5 text-[#102550]" />
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {[
                                    { label: gmLocale === 'ar' ? "وارد الخزنة" : "Wallet Incoming", value: walletFlow.walletReceived, color: "text-emerald-600", bg: "bg-emerald-50" },
                                    { label: gmLocale === 'ar' ? "موزَّع للمشاريع" : "Allocated to Projects", value: walletFlow.projectsAllocated, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: gmLocale === 'ar' ? "عهد للموظفين" : "Employee Custody", value: walletFlow.custodyIssued, color: "text-amber-600", bg: "bg-amber-50" },
                                    { label: gmLocale === 'ar' ? "عهد مُرجَعة" : "Custody Returns", value: walletFlow.custodyReturned, color: "text-blue-600", bg: "bg-blue-50" },
                                    { label: gmLocale === 'ar' ? "فواتير معتمدة" : "Approved Invoices", value: walletFlow.invoicesApproved, color: "text-rose-600", bg: "bg-rose-50" },
                                    { label: gmLocale === 'ar' ? "مصاريف شركة" : "Company Expenses", value: walletFlow.companyExpenses ?? 0, color: "text-purple-600", bg: "bg-purple-50" },
                                    { label: gmLocale === 'ar' ? "رصيد الخزنة" : "Wallet Balance", value: walletFlow.walletRemaining, color: "text-emerald-700", bg: "bg-emerald-100 ring-1 ring-emerald-200" },
                                ].map((item, i) => (
                                    <div key={i} className={`rounded-xl p-3 text-center ${item.bg}`}>
                                        <p className={`text-base font-black ${item.color}`}>
                                            {item.value.toLocaleString('en-US')}
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
                                <h3 className="font-bold text-gray-900">{gmLocale === 'ar' ? 'الفواتير المعلّقة' : 'Pending Invoices'}</h3>
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
                                {gmLocale === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight className="w-3 h-3" />
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
                                                <p className="text-xs text-gray-500">{(inv as PendingInvoice).creator?.name ?? '—'} · {(inv as PendingInvoice).project?.name ?? (gmLocale === 'ar' ? 'بدون مشروع' : 'No project')}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-gray-900">{inv.amount.toLocaleString('en-US')}</p>
                                                <StatusBadge status={inv.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
                                    <p className="font-semibold text-sm">{gmLocale === 'ar' ? 'لا توجد فواتير معلقة' : 'No pending invoices'}</p>
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
                                <h3 className="font-bold text-gray-900">{gmLocale === 'ar' ? 'المشتريات' : 'Purchases'}</h3>
                            </div>
                            <div className="space-y-2.5">
                                {[
                                    { label: gmLocale === 'ar' ? "مطلوب" : "Requested", value: stats.purchaseStats.requested, color: "bg-amber-400" },
                                    { label: gmLocale === 'ar' ? "جارٍ" : "In Progress", value: stats.purchaseStats.inProgress, color: "bg-blue-400" },
                                    { label: gmLocale === 'ar' ? "تم الشراء" : "Purchased", value: stats.purchaseStats.purchased, color: "bg-emerald-400" },
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
                                    {gmLocale === 'ar' ? 'عرض كل المشتريات' : 'View All Purchases'} <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </Card>

                        {/* العهد */}
                        <Card className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-gray-900">{gmLocale === 'ar' ? 'العُهَد' : 'Custody'}</h3>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: gmLocale === 'ar' ? "موزَّع للمشاريع" : "Allocated to Projects", value: stats.custody.allocated, color: "text-blue-600" },
                                    { label: gmLocale === 'ar' ? "مصروف للموظفين" : "Issued to Employees", value: stats.custody.issued, color: "text-rose-600" },
                                    { label: gmLocale === 'ar' ? "مُرجَع من الموظفين" : "Returned by Employees", value: stats.custody.returned, color: "text-emerald-600" },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                                        <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                                        <span className={`text-sm font-black ${item.color}`}>
                                            {item.value.toLocaleString('en-US')} <span className="text-[10px] text-gray-400 font-bold"><CurrencyDisplay /></span>
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
                                <h3 className="font-bold text-gray-900">{gmLocale === 'ar' ? 'الفواتير' : 'Invoices'}</h3>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { label: gmLocale === 'ar' ? "معتمدة" : "Approved", value: stats.invoices.approved, color: "text-emerald-600", icon: CheckCircle2 },
                                    { label: gmLocale === 'ar' ? "معلّقة" : "Pending", value: stats.invoices.pending, color: "text-amber-600", icon: Clock },
                                    { label: gmLocale === 'ar' ? "مرفوضة" : "Rejected", value: stats.invoices.rejected, color: "text-red-500", icon: TrendingDown },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-1.5">
                                            <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                            <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                                        </div>
                                        <span className={`text-sm font-black ${item.color}`}>
                                            {item.value.toLocaleString('en-US')}
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
                                        <h3 className="font-bold text-gray-900">{gmLocale === 'ar' ? 'مشترياتي العاجلة' : 'My Urgent Purchases'}</h3>
                                        <p className="text-xs text-gray-500">{gmLocale === 'ar' ? 'الطلبات ذات الأولوية القصوى' : 'Top priority requests'}</p>
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
                                            <p className="text-xs text-gray-400">{(p as UrgentPurchase).project?.name ?? (gmLocale === 'ar' ? 'بدون مشروع' : 'No project')} · {p.orderNumber}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-gray-900">{p.amount > 0 ? `${p.amount.toLocaleString('en-US')}` : '—'}</p>
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
                        <h3 className="font-bold text-lg text-gray-900">{gmLocale === 'ar' ? 'آخر المشاريع' : 'Recent Projects'}</h3>
                        <button
                            onClick={() => router.push('/projects')}
                            className="text-xs text-[#102550] font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            {gmLocale === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight className="w-3 h-3" />
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
                                            <p className="text-xs text-gray-500 mt-0.5">{(project as RecentProject).manager?.name ?? (gmLocale === 'ar' ? 'بلا مدير' : 'No manager')}</p>
                                        </div>
                                        <StatusBadge status={project.status} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-blue-50 rounded-lg p-2">
                                                <p className="text-[10px] text-gray-500 font-semibold">{gmLocale === 'ar' ? 'الميزانية' : 'Budget'}</p>
                                            <p className="text-xs font-black text-blue-700">{((project as RecentProject).budgetAllocated ?? 0).toLocaleString('en-US')}</p>
                                        </div>
                                        <div className="bg-rose-50 rounded-lg p-2">
                                                <p className="text-[10px] text-gray-500 font-semibold">{gmLocale === 'ar' ? 'العُهد' : 'Custody'}</p>
                                            <p className="text-xs font-black text-rose-700">{((project as RecentProject).custodyIssued ?? 0).toLocaleString('en-US')}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-lg p-2">
                                                <p className="text-[10px] text-gray-500 font-semibold">{gmLocale === 'ar' ? 'الأعضاء' : 'Members'}</p>
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
