"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustodyBalanceCard from "@/components/dashboard/CustodyBalanceCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    FolderKanban, CheckCircle, ChevronLeft, AlertTriangle, Wallet, Receipt,
    Camera, RefreshCw, ShoppingCart, FileCheck, PackageSearch
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, getFlowStats } from '@/actions/dashboard';
import { getMyCustodies } from '@/actions/custody';
import { getPurchases } from '@/actions/purchases';
import { getInvoices } from '@/actions/invoices';
import { Project, User, ProjectMember, Notification } from '@prisma/client';
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useRouter } from "next/navigation";
import { useProjectRoles } from "@/context/ProjectRolesContext";
import { EmployeeDashboardSkeleton } from "@/components/ui/SkeletonCard";
import { PullToRefreshIndicator } from "@/components/ui/PullToRefreshIndicator";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProjectRoleFlags {
    isProjectManager: boolean;
    isProjectAccountant: boolean;
    isProjectEmployee: boolean;
    canAddInvoice: boolean;
    hasAnyProject: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const { setFlags: setContextFlags } = useProjectRoles();

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

    const [flow, setFlow] = useState({ received: 0, spent: 0, remaining: 0 });

    // Project role flags — all false until loaded
    const [projectRoles, setProjectRoles] = useState<ProjectRoleFlags>({
        isProjectManager: false,
        isProjectAccountant: false,
        isProjectEmployee: false,
        canAddInvoice: false,
        hasAnyProject: false,
    });
    const [rolesLoaded, setRolesLoaded] = useState(false);

    const [unconfirmedCustodies, setUnconfirmedCustodies] = useState<any[]>([]);
    const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const [statsData, flowData, custodiesData] = await Promise.all([
            getDashboardStats(),
            getFlowStats(),
            getMyCustodies(),
        ]);

        setStats(statsData);

        if (flowData && flowData.role === "USER") {
            const fd = flowData as any;
            setFlow({
                received: fd.personalReceived ?? 0,
                spent: fd.personalSpent ?? 0,
                remaining: fd.personalRemaining ?? 0,
            });
            // Set project role flags from same response (EC8: no extra round-trip → no flash)
            const flags = {
                isProjectManager: fd.isProjectManager ?? false,
                isProjectAccountant: fd.isProjectAccountant ?? false,
                isProjectEmployee: fd.isProjectEmployee ?? false,
                canAddInvoice: fd.canAddInvoice ?? false,
                hasAnyProject: fd.hasAnyProject ?? false,
            };
            setProjectRoles(flags);
            // Share into global context so MobileBottomNav can consume without re-fetching
            setContextFlags({ ...flags, loaded: true });
        }
        setRolesLoaded(true);

        setUnconfirmedCustodies((custodiesData as any[]).filter((c: any) => !c.isConfirmed && !c.isClosed));
    }, []);

    // Load purchases for coordinator widget & invoices for accountant widget
    const loadRoleData = useCallback(async (roles: ProjectRoleFlags) => {
        const promises: Promise<any>[] = [];

        if (roles.isProjectManager) {
            promises.push(
                getPurchases().then(data => {
                    const items = Array.isArray(data) ? data : [];
                    setPendingPurchases(
                        items.filter((p: any) => p.status === "REQUESTED" || p.status === "IN_PROGRESS").slice(0, 5)
                    );
                })
            );
        }

        if (roles.isProjectAccountant) {
            promises.push(
                getInvoices().then(data => {
                    const items = Array.isArray(data) ? data : [];
                    setPendingApprovals(
                        items.filter((inv: any) => inv.status === "PENDING").slice(0, 5)
                    );
                })
            );
        }

        await Promise.all(promises);
    }, []);

    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, [loadData]);

    // Once roles are loaded, fetch role-specific data
    useEffect(() => {
        if (rolesLoaded) {
            loadRoleData(projectRoles);
        }
    }, [rolesLoaded, projectRoles, loadRoleData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    }, [loadData]);

    const { onTouchStart, onTouchMove, onTouchEnd, pullProgress, isRefreshing: isPullRefreshing } = usePullToRefresh(handleRefresh);

    // ─── KPI cards for personal financial summary ──────────────────────────────
    const kpis = [
        { title: "إجمالي العُهد الواردة", value: flow.received, icon: Wallet, color: "text-[#102550]", bg: "bg-[#102550]/10", isCurrency: true },
        { title: "مُنفَّق (فواتير مقبولة)", value: flow.spent, icon: Receipt, color: "text-rose-500", bg: "bg-rose-500/10", isCurrency: true },
        { title: "المشاريع المسندة إليك", value: stats.totalProjects, icon: FolderKanban, color: "text-amber-500", bg: "bg-amber-500/10", isCurrency: false },
    ];

    // ─── Loading skeleton ──────────────────────────────────────────────────────
    if (!isMounted || !rolesLoaded) {
        return (
            <DashboardLayout title="مساحة العمل">
                <EmployeeDashboardSkeleton />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="مساحة العمل">
            <div
                className="space-y-6 md:space-y-8 pb-6"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Pull-to-refresh visual indicator */}
                <PullToRefreshIndicator pullProgress={pullProgress} isRefreshing={isPullRefreshing} />

                {/* ── EC1: No projects at all → welcome / empty state ─────────────── */}
                {!projectRoles.hasAnyProject ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-[#102550]/10 flex items-center justify-center">
                            <PackageSearch className="w-10 h-10 text-[#102550]" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-gray-900 mb-1">أهلاً بك في منظومة المشاريع! 👋</h2>
                            <p className="text-gray-400 text-sm font-medium max-w-xs mx-auto">
                                لم تُضَف لأي مشروع بعد. ستظهر هنا بياناتك ومهامك بمجرد أن يضمّك مدير النظام لأحد المشاريع.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── EC4 / EC2: Add Invoice CTA — only shown if canAddInvoice ── */}
                        {projectRoles.canAddInvoice && (
                            <button
                                onClick={() => router.push('/invoices/new')}
                                className="w-full flex items-center gap-4 bg-gradient-to-l from-blue-700 to-blue-500 text-white rounded-2xl p-5 shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                            >
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <div className="text-right flex-1">
                                    <p className="text-xl font-black">رفع فاتورة</p>
                                    <p className="text-blue-200 text-sm mt-0.5">صوّر أو ارفع فاتورة الآن ←</p>
                                </div>
                            </button>
                        )}

                        {/* ── Unconfirmed custody alert ──────────────────────────────── */}
                        {unconfirmedCustodies.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
                                <div className="flex gap-4 items-start md:items-center">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-amber-900 text-sm">يوجد لديك {unconfirmedCustodies.length} عهدة بانتظار تأكيدك</p>
                                        <p className="text-xs text-amber-700 mt-1">يرجى مراجعة العهد وتأكيد استلامها أو رفضها للبدء باستخدامها</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => router.push('/my-custodies')}
                                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl h-10 px-5 shrink-0 w-full md:w-auto"
                                >
                                    إدارة عهدي
                                </Button>
                            </div>
                        )}

                        {/* ── Personal custody balance ───────────────────────────────── */}
                        <CustodyBalanceCard />

                        {/* ── Personal KPIs ─────────────────────────────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {kpis.map((kpi, i) => (
                                <Card key={i} className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 group cursor-default shadow-sm border-gray-100">
                                    <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl transition-transform duration-300 md:group-hover:scale-110 shrink-0 ${kpi.bg}`}>
                                        <kpi.icon className={`h-5 w-5 md:h-6 md:w-6 ${kpi.color}`} aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-sm font-bold text-gray-500 mb-1">{kpi.title}</p>
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

                        {/* ── EC3: Accountant Widget — Invoices Pending Approval ─────── */}
                        {projectRoles.isProjectAccountant && (
                            <Card className="p-0 overflow-hidden shadow-sm border border-emerald-100">
                                <div className="flex justify-between items-center p-4 md:p-5 border-b border-emerald-100/60 bg-emerald-50/50">
                                    <div className="flex items-center gap-2">
                                        <FileCheck className="w-5 h-5 text-emerald-600" />
                                        <h3 className="font-bold text-base text-gray-900">فواتير بانتظار تدقيقك</h3>
                                    </div>
                                    <Button
                                        onClick={() => router.push('/invoices')}
                                        variant="secondary"
                                        className="text-[11px] h-8 px-3 font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-none"
                                    >
                                        كل الفواتير <ChevronLeft className="w-3 h-3 ml-0.5" />
                                    </Button>
                                </div>
                                <div className="p-4 md:p-5 space-y-3">
                                    {pendingApprovals.length > 0 ? pendingApprovals.map((inv: any) => (
                                        <div
                                            key={inv.id}
                                            className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors cursor-pointer"
                                            onClick={() => router.push(`/invoices/${inv.id}`)}
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{inv.reference}</p>
                                                <p className="text-xs text-gray-400 font-medium mt-0.5">{inv.project?.name || 'بدون مشروع'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-emerald-700">{(inv.amount || 0).toLocaleString()} <CurrencyDisplay /></p>
                                                <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-md">بانتظار التدقيق</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400 font-medium text-center py-4">لا توجد فواتير معلقة في مشاريعك. ✅</p>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* ── EC3: Coordinator Widget — Purchases Tracking ───────────── */}
                        {projectRoles.isProjectManager && (
                            <Card className="p-0 overflow-hidden shadow-sm border border-blue-100">
                                <div className="flex justify-between items-center p-4 md:p-5 border-b border-blue-100/60 bg-blue-50/50">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-base text-gray-900">المشتريات النشطة في مشاريعك</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => router.push('/purchases/new')}
                                            variant="primary"
                                            className="text-[11px] h-8 px-3 font-bold bg-blue-600 hover:bg-blue-700 border-none text-white"
                                        >
                                            + طلب شراء
                                        </Button>
                                        <Button
                                            onClick={() => router.push('/purchases')}
                                            variant="secondary"
                                            className="text-[11px] h-8 px-3 font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border-none"
                                        >
                                            الكل <ChevronLeft className="w-3 h-3 ml-0.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4 md:p-5 space-y-3">
                                    {pendingPurchases.length > 0 ? pendingPurchases.map((p: any) => (
                                        <div
                                            key={p.id}
                                            className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors cursor-pointer"
                                            onClick={() => router.push(`/purchases`)}
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{p.itemName}</p>
                                                <p className="text-xs text-gray-400 font-medium mt-0.5">{p.project?.name || 'بدون مشروع'}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {p.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 'طلب جديد'}
                                            </span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400 font-medium text-center py-4">لا توجد مشتريات نشطة حالياً. ✅</p>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* ── Projects & Notifications grid ──────────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Notifications */}
                            <Card className="p-0 lg:col-span-1 overflow-hidden flex flex-col h-[350px] md:h-[400px] shadow-sm border-gray-100">
                                <div className="p-5 md:p-6 border-b border-gray-100/50 bg-gray-50/50">
                                    <h3 className="font-bold text-base md:text-lg text-gray-900">إشعارات المهام</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">
                                    {stats.recentNotifications.length > 0 ? stats.recentNotifications.map((n) => (
                                        <div key={n.id} className="flex gap-3 md:gap-4 items-start group hover:bg-gray-50/50 p-2 -mx-2 rounded-xl transition-colors cursor-default">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center shrink-0 shadow-sm transition-transform md:group-hover:scale-110">
                                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs md:text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors leading-relaxed">{n.title}</p>
                                                <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-1">{new Date(n.createdAt).toLocaleDateString('en-GB')}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs md:text-sm text-gray-400 font-medium text-center py-8">لا توجد إشعارات حديثة.</p>
                                    )}
                                </div>
                                <div className="p-4 md:p-6 pt-0">
                                    <Button onClick={() => router.push('/notifications')} variant="secondary" className="w-full text-[11px] md:text-xs h-10 font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 border-none transition-colors">
                                        عرض كل الإشعارات <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                                    </Button>
                                </div>
                            </Card>

                            {/* My Projects */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className="font-bold text-lg md:text-xl text-gray-900">المشاريع الحالية</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {stats.recentProjects.slice(0, 4).map(project => (
                                        <Card key={project.id} className="p-4 md:p-5 flex flex-col hover:border-[#102550]/30 transition-colors relative overflow-hidden group shadow-sm border border-gray-100 rounded-2xl">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-sm md:text-base text-gray-900 line-clamp-1 group-hover:text-[#102550] transition-colors">{project.name}</h4>
                                                    <p className="text-[10px] md:text-xs font-semibold mt-1 text-gray-400">
                                                        {project.endDate ? new Date(project.endDate).toLocaleDateString('en-GB') : 'تاريخ غير محدد'}
                                                    </p>
                                                </div>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ${project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {project.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="bg-rose-50 rounded-xl p-2 text-center">
                                                    <p className="text-[9px] text-gray-500 font-semibold">العُهد المصروفة</p>
                                                    <p className="text-xs font-black text-rose-700">{((project as any).custodyIssued ?? 0).toLocaleString()} <CurrencyDisplay /></p>
                                                </div>
                                                <div className="bg-emerald-50 rounded-xl p-2 text-center">
                                                    <p className="text-[9px] text-gray-500 font-semibold">الأعضاء</p>
                                                    <p className="text-xs font-black text-emerald-700">{project.members.length}</p>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-3 border-t border-gray-50">
                                                <Button onClick={() => router.push(`/projects/${project.id}`)} variant="secondary" className="w-full text-[11px] md:text-xs h-10 font-bold bg-[#102550]/5 text-[#102550] hover:bg-[#102550]/10 border-none transition-colors rounded-xl">
                                                    عرض التفاصيل
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {stats.recentProjects.length === 0 && (
                                        <div className="col-span-1 sm:col-span-2 text-center bg-gray-50 rounded-2xl p-8">
                                            <p className="text-gray-500 text-sm font-medium">لا توجد مشاريع مسندة حاليا.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
