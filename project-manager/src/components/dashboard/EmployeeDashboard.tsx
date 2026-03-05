"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustodyBalanceCard from "@/components/dashboard/CustodyBalanceCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FolderKanban, CheckCircle, ChevronLeft, AlertTriangle, Wallet, Receipt, Camera, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, getFlowStats } from '@/actions/dashboard';
import { getMyCustodies, confirmCustodyReceipt } from '@/actions/custody';
import { Project, User, ProjectMember, Notification } from '@prisma/client';
import toast from 'react-hot-toast';
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

export default function EmployeeDashboard() {
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
        chartData: { monthly: [] as { name: string, value: number }[], yearly: [] as { name: string, value: number }[] }
    });

    const [flow, setFlow] = useState({ received: 0, spent: 0, remaining: 0 });
    const [unconfirmedCustodies, setUnconfirmedCustodies] = useState<any[]>([]);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        const [statsData, flowData, custodiesData] = await Promise.all([
            getDashboardStats(),
            getFlowStats(),
            getMyCustodies(),
        ]);
        setStats(statsData);
        if (flowData && flowData.role === "USER") {
            setFlow({
                received: (flowData as any).received ?? 0,
                spent: (flowData as any).spent ?? 0,
                remaining: (flowData as any).remaining ?? 0,
            });
        }
        setUnconfirmedCustodies((custodiesData as any[]).filter((c: any) => !c.isConfirmed && !c.isClosed));
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    }, [loadData]);

    const { onTouchStart, onTouchEnd } = usePullToRefresh(handleRefresh);

    const kpis = [
        { title: "إجمالي العُهد الواردة", value: flow.received, icon: Wallet, color: "text-[#7F56D9]", bg: "bg-[#7F56D9]/10", isCurrency: true },
        { title: "مُنفَّق (فواتير مقبولة)", value: flow.spent, icon: Receipt, color: "text-rose-500", bg: "bg-rose-500/10", isCurrency: true },
        { title: "المشاريع المسندة إليك", value: stats.totalProjects, icon: FolderKanban, color: "text-amber-500", bg: "bg-amber-500/10", isCurrency: false },
    ];

    return (
        <DashboardLayout title="مساحة العمل">
            <div
                className="space-y-6 md:space-y-8 pb-6"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {/* Pull-to-refresh indicator */}
                {isRefreshing && (
                    <div className="flex justify-center py-2">
                        <RefreshCw className="w-5 h-5 text-[#7F56D9] animate-spin" />
                    </div>
                )}

                {/* زر رفع الفاتورة البارز */}
                <button
                    onClick={() => window.location.href = '/invoices/new'}
                    className="w-full flex items-center gap-4 bg-gradient-to-l from-purple-700 to-purple-500 text-white rounded-2xl p-5 shadow-lg shadow-purple-200 active:scale-95 transition-transform"
                >
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                        <Camera className="w-8 h-8" />
                    </div>
                    <div className="text-right flex-1">
                        <p className="text-xl font-black">رفع فاتورة</p>
                        <p className="text-purple-200 text-sm mt-0.5">صوّر أو ارفع فاتورة الآن ←</p>
                    </div>
                </button>

                {/* تنبيه العُهد غير المؤكدة */}
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
                            onClick={() => window.location.href = '/my-custodies'}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl h-10 px-5 shrink-0 w-full md:w-auto"
                        >
                            إدارة عهدي
                        </Button>
                    </div>
                )}

                {/* بطاقة التدفق المالي */}
                <CustodyBalanceCard />

                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* إشعارات المهام */}
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
                            <Button onClick={() => window.location.href = '/notifications'} variant="secondary" className="w-full text-[11px] md:text-xs h-10 font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 border-none transition-colors">
                                عرض كل الإشعارات <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                            </Button>
                        </div>
                    </Card>

                    {/* المشاريع المسندة */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="font-bold text-lg md:text-xl text-gray-900">المشاريع الحالية</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.recentProjects.slice(0, 4).map(project => (
                                <Card key={project.id} className="p-4 md:p-5 flex flex-col hover:border-[#7F56D9]/30 transition-colors relative overflow-hidden group shadow-sm border border-gray-100 rounded-2xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-sm md:text-base text-gray-900 line-clamp-1 group-hover:text-[#7F56D9] transition-colors">{project.name}</h4>
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
                                            <p className="text-[9px] text-gray-500 font-semibold">عُهدتي</p>
                                            <p className="text-xs font-black text-rose-700">{((project as any).custodyIssued ?? 0).toLocaleString()} <CurrencyDisplay /></p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-2 text-center">
                                            <p className="text-[9px] text-gray-500 font-semibold">الأعضاء</p>
                                            <p className="text-xs font-black text-emerald-700">{project.members.length}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-gray-50">
                                        <Button onClick={() => window.location.href = `/projects/${project.id}`} variant="secondary" className="w-full text-[11px] md:text-xs h-10 font-bold bg-[#7F56D9]/5 text-[#7F56D9] hover:bg-[#7F56D9]/10 border-none transition-colors rounded-xl">
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
            </div>
        </DashboardLayout>
    );
}
