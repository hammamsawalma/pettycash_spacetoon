"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { getAllEmployeeCustodies } from "@/actions/custody";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import {
    Users,
    Wallet,
    Calendar,
    FolderKanban,
    Lock,
    Unlock,
    Download,
    FileOutput,
    Search,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    HandCoins,
    FileText,
} from "lucide-react";
import { ExportButton } from "@/components/ui/ExportButton";
import { getCustodiesExportData } from "@/actions/exports";
import { downloadExcel, generatePrintableReport, openPrintWindow, formatDate, formatCurrency, custodyStatusLabel, type ExportColumn } from "@/lib/export-utils";

interface EmployeeCustody {
    id: string;
    amount: number;
    balance: number;
    method: string;
    isConfirmed: boolean;
    isClosed: boolean;
    status?: string;
    rejectedReason?: string | null;
    note: string | null;
    createdAt: string;
    employee: { id: string; name: string; image: string | null };
    project: { id: string; name: string } | null;
    confirmation: { signatureFile: string | null } | null;
    returns: { id: string; amount: number; createdAt: string }[];
}

type StatusFilter = "all" | "pending" | "confirmed" | "closed" | "rejected";

export default function EmployeeCustodiesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const canViewReports = useCanDo("reports", "viewAll");
    const [custodies, setCustodies] = useState<EmployeeCustody[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [projectFilter, setProjectFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const custodyColumns: ExportColumn[] = [
        { key: "employeeName", label: "الموظف" },
        { key: "projectName", label: "المشروع" },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "balance", label: "المتبقي", format: (v) => formatCurrency(v as number) },
        { key: "status", label: "الحالة", format: (v) => custodyStatusLabel[v as string] || String(v) },
        { key: "method", label: "طريقة الدفع" },
        { key: "totalReturned", label: "المرجع", format: (v) => formatCurrency(v as number) },
        { key: "note", label: "ملاحظة" },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const handleExportExcel = async () => {
        const data = await getCustodiesExportData("employee");
        downloadExcel([{ name: "عهد الموظفين", columns: custodyColumns, data: data as Record<string, unknown>[] }], "تقرير_عهد_الموظفين");
    };

    const handleExportPDF = async () => {
        const data = await getCustodiesExportData("employee");
        const totalAmount = data.reduce((s, d) => s + d.amount, 0);
        const totalBalance = data.reduce((s, d) => s + d.balance, 0);
        const html = generatePrintableReport({
            title: "تقرير عهد الموظفين",
            subtitle: "جميع العهد الصادرة للموظفين عبر كل المشاريع",
            columns: custodyColumns,
            data: data as Record<string, unknown>[],
            summary: [
                { label: "إجمالي المصروفات", value: formatCurrency(totalAmount) },
                { label: "الرصيد المتبقي", value: formatCurrency(totalBalance) },
                { label: "عدد العهد", value: String(data.length) },
            ],
            branchName: user?.branchName,
            branchFlag: user?.branchFlag,
        });
        openPrintWindow(html);
    };

    // Redirect unauthorized users
    useEffect(() => {
        if (user && !canViewReports) {
            router.push("/");
        }
    }, [user, canViewReports, router]);

    // Fetch data
    useEffect(() => {
        if (canViewReports) {
            getAllEmployeeCustodies().then((data: any) => {
                setCustodies(data);
                setIsLoading(false);
            });
        }
    }, [canViewReports]);

    // Unique projects for filter dropdown
    const projects = useMemo(() => {
        const map = new Map<string, string>();
        custodies.forEach((c) => {
            if (c.project) map.set(c.project.id, c.project.name);
        });
        return Array.from(map, ([id, name]) => ({ id, name }));
    }, [custodies]);

    // Filtered data
    const filtered = useMemo(() => {
        return custodies.filter((c) => {
            // Status filter
            if (statusFilter === "pending" && (c.isConfirmed || c.isClosed || c.status === "REJECTED")) return false;
            if (statusFilter === "confirmed" && (!c.isConfirmed || c.isClosed || c.status === "REJECTED")) return false;
            if (statusFilter === "closed" && (!c.isClosed || c.status === "REJECTED")) return false;
            if (statusFilter === "rejected" && c.status !== "REJECTED") return false;

            // Project filter
            if (projectFilter !== "all" && c.project?.id !== projectFilter) return false;

            // Search by employee name
            if (searchQuery.trim()) {
                const q = searchQuery.trim().toLowerCase();
                if (!c.employee?.name?.toLowerCase().includes(q)) return false;
            }

            return true;
        });
    }, [custodies, statusFilter, projectFilter, searchQuery]);

    // KPIs
    const totalAmount = custodies.reduce((s, c) => s + c.amount, 0);
    const totalBalance = custodies.reduce((s, c) => s + c.balance, 0);
    const pendingCount = custodies.filter((c) => !c.isConfirmed && !c.isClosed && c.status !== "REJECTED").length;
    const activeCount = custodies.filter((c) => c.isConfirmed && !c.isClosed && c.status !== "REJECTED").length;
    const closedCount = custodies.filter((c) => c.isClosed && c.status !== "REJECTED").length;
    const rejectedCount = custodies.filter((c) => c.status === "REJECTED").length;

    if (!user || !canViewReports) return null;

    const statusTabs: { value: StatusFilter; label: string; count: number }[] = [
        { value: "all", label: "الكل", count: custodies.length },
        { value: "pending", label: "بانتظار التأكيد", count: pendingCount },
        { value: "confirmed", label: "نشطة", count: activeCount },
        { value: "closed", label: "مغلقة", count: closedCount },
        { value: "rejected", label: "مرفوضة", count: rejectedCount },
    ];

    const getStatusBadge = (c: EmployeeCustody) => {
        if (c.status === "REJECTED") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600">
                    <XCircle className="w-2.5 h-2.5" /> مرفوضة
                </span>
            );
        }
        if (c.isClosed) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                    <Lock className="w-2.5 h-2.5" /> مغلقة
                </span>
            );
        }
        if (c.isConfirmed) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    <CheckCircle className="w-2.5 h-2.5" /> نشطة
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">
                <Clock className="w-2.5 h-2.5" /> بانتظار التأكيد
            </span>
        );
    };

    return (
        <DashboardLayout title="عهد الموظفين">
            <div className="space-y-6 md:space-y-8 pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h2 className="text-base md:text-lg font-bold text-gray-900">
                            سندات صرف عهد الموظفين
                        </h2>
                        <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">
                            جميع العهد الصادرة للموظفين عبر كل المشاريع
                        </p>
                    </div>
                    <ExportButton
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                        label="تصدير عهد الموظفين"
                    />
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Card className="p-4 md:p-5 shadow-sm border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#102550] flex items-center justify-center shrink-0">
                                <HandCoins className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-0.5">
                                    إجمالي المصروفات
                                </p>
                                <p className="text-lg md:text-xl font-black text-gray-900">
                                    {isLoading ? "..." : <AnimatedNumber value={totalAmount} />}{" "}
                                    <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span>
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 md:p-5 shadow-sm border-red-100 bg-gradient-to-br from-white to-red-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-0.5">
                                    الرصيد المتبقي
                                </p>
                                <p className="text-lg md:text-xl font-black text-red-600">
                                    {isLoading ? "..." : <AnimatedNumber value={totalBalance} />}{" "}
                                    <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span>
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 md:p-5 shadow-sm border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <Unlock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-0.5">
                                    عهد نشطة
                                </p>
                                <p className="text-lg md:text-xl font-black text-emerald-600">
                                    {isLoading ? "..." : activeCount}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 md:p-5 shadow-sm border-amber-100 bg-gradient-to-br from-white to-amber-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-0.5">
                                    بانتظار التأكيد
                                </p>
                                <p className="text-lg md:text-xl font-black text-amber-600">
                                    {isLoading ? "..." : pendingCount}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${statusFilter === tab.value
                                    ? "bg-[#102550] text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                {tab.label}{" "}
                                <span className="opacity-70">({tab.count})</span>
                            </button>
                        ))}
                    </div>

                    {/* Project Filter */}
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="h-10 px-3 text-xs font-bold border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-[#102550]/20 focus:border-[#102550] transition-all"
                    >
                        <option value="all">كل المشاريع</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Employee Search */}
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث باسم الموظف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pe-3 ps-10 text-xs font-medium border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-[#102550]/20 focus:border-[#102550] transition-all"
                            dir="rtl"
                        />
                    </div>
                </div>

                {/* Table */}
                <Card className="p-0 overflow-hidden shadow-sm border-gray-100">
                    <div className="overflow-x-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="py-16 text-center text-gray-400 text-sm font-medium">
                                جاري تحميل البيانات...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-12">
                                <EmptyState
                                    title="لا توجد عهد موظفين"
                                    description="لم يتم العثور على عهد مطابقة للفلتر المحدد."
                                    icon={HandCoins}
                                />
                            </div>
                        ) : (
                            <table className="w-full text-xs md:text-sm text-right min-w-[900px]">
                                <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                                    <tr>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                الموظف
                                            </div>
                                        </th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <FolderKanban className="w-3.5 h-3.5" />
                                                المشروع
                                            </div>
                                        </th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">المبلغ</th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">المتبقي</th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">الحالة</th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                التاريخ
                                            </div>
                                        </th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">ملاحظة</th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">السندات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-[#102550]/10 text-[#102550] flex items-center justify-center font-black text-xs shrink-0">
                                                        {c.employee?.name?.charAt(0) || "؟"}
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-xs">
                                                        {c.employee?.name || "—"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                {c.project ? (
                                                    <a
                                                        href={`/projects/${c.project.id}?tab=team`}
                                                        className="font-bold text-[#102550] hover:underline text-xs"
                                                    >
                                                        {c.project.name}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 font-black text-gray-900">
                                                {c.amount.toLocaleString('en-US')}{" "}
                                                <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                <span className={`font-black ${c.balance > 0 ? "text-red-600" : "text-gray-400"}`}>
                                                    {c.balance.toLocaleString('en-US')}{" "}
                                                    <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span>
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                {getStatusBadge(c)}
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 text-gray-500 font-medium">
                                                {new Date(c.createdAt).toLocaleDateString("en-GB")}
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 text-gray-600 max-w-[150px]">
                                                <span className="line-clamp-1 text-[10px]" title={c.note || ""}>
                                                    {c.note || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`/api/vouchers/${c.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#102550] hover:text-blue-700 hover:underline"
                                                        title="سند صرف"
                                                    >
                                                        <FileOutput className="w-3 h-3" />
                                                        صرف
                                                    </a>
                                                    {c.returns && c.returns.length > 0 && (
                                                        <a
                                                            href={`/api/vouchers/${c.id}?type=receipt`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                                                            title="سند قبض"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            قبض
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Footer Totals */}
                                <tfoot className="bg-gray-50/80 border-t-2 border-gray-200">
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-4 md:px-5 py-3 md:py-4 font-black text-gray-700 text-xs"
                                        >
                                            الإجمالي ({filtered.length} عهدة)
                                        </td>
                                        <td className="px-4 md:px-5 py-3 md:py-4 font-black text-gray-900">
                                            {filtered.reduce((s, c) => s + c.amount, 0).toLocaleString('en-US')}{" "}
                                            <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3 md:py-4 font-black text-red-600">
                                            {filtered.reduce((s, c) => s + c.balance, 0).toLocaleString('en-US')}{" "}
                                            <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span>
                                        </td>
                                        <td colSpan={4} />
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
