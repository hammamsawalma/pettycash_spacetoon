"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { getExternalCustodiesReport } from "@/actions/custody";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import {
    Building2,
    Phone,
    Target,
    Wallet,
    Calendar,
    FolderKanban,
    Lock,
    Unlock,
    Download,
    FileOutput,
} from "lucide-react";
import { ExportButton } from "@/components/ui/ExportButton";
import { getCustodiesExportData } from "@/actions/exports";
import { downloadExcel, generatePrintableReport, openPrintWindow, formatDate, formatCurrency, type ExportColumn } from "@/lib/export-utils";

interface ExternalCustody {
    id: string;
    amount: number;
    balance: number;
    isClosed: boolean;
    externalName: string | null;
    externalPhone: string | null;
    externalPurpose: string | null;
    createdAt: string;
    project: { id: string; name: string };
    returns: { id: string; amount: number; createdAt: string }[];
}

export default function ExternalCustodiesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const canViewReports = useCanDo("reports", "viewAll");
    const [custodies, setCustodies] = useState<ExternalCustody[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

    const extColumns: ExportColumn[] = [
        { key: "externalName", label: "الطرف الخارجي" },
        { key: "projectName", label: "المشروع" },
        { key: "externalPhone", label: "الهاتف" },
        { key: "externalPurpose", label: "الغرض" },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "balance", label: "المتبقي", format: (v) => formatCurrency(v as number) },
        { key: "isClosed", label: "الحالة", format: (v) => v ? "مغلقة" : "مفتوحة" },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const handleExportExcel = async () => {
        const data = await getCustodiesExportData("external");
        downloadExcel([{ name: "العهد الخارجية", columns: extColumns, data: data as Record<string, unknown>[] }], "تقرير_العهد_الخارجية");
    };

    const handleExportPDF = async () => {
        const data = await getCustodiesExportData("external");
        const totalAmount = data.reduce((s, d) => s + d.amount, 0);
        const totalBalance = data.reduce((s, d) => s + d.balance, 0);
        const html = generatePrintableReport({
            title: "تقرير العهد الخارجية",
            subtitle: "العهد المصروفة لأطراف خارجية عبر جميع المشاريع",
            columns: extColumns,
            data: data as Record<string, unknown>[],
            summary: [
                { label: "إجمالي العهد", value: formatCurrency(totalAmount) },
                { label: "الرصيد المتبقي", value: formatCurrency(totalBalance) },
                { label: "عدد العهد", value: String(data.length) },
            ],
        });
        openPrintWindow(html);
    };

    useEffect(() => {
        if (user && !canViewReports) {
            router.push("/");
        }
    }, [user, canViewReports, router]);

    useEffect(() => {
        if (canViewReports) {
            getExternalCustodiesReport().then((data: any) => {
                setCustodies(data);
                setIsLoading(false);
            });
        }
    }, [canViewReports]);

    if (!user || !canViewReports) return null;

    const filtered = custodies.filter((c) => {
        if (filter === "open") return !c.isClosed;
        if (filter === "closed") return c.isClosed;
        return true;
    });

    const totalAmount = custodies.reduce((s, c) => s + c.amount, 0);
    const totalBalance = custodies.reduce((s, c) => s + c.balance, 0);
    const openCount = custodies.filter((c) => !c.isClosed).length;
    const closedCount = custodies.filter((c) => c.isClosed).length;

    return (
        <DashboardLayout title="تقرير العهد الخارجية">
            <div className="space-y-6 md:space-y-8 pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h2 className="text-base md:text-lg font-bold text-gray-900">
                            العهد الخارجية عبر جميع المشاريع
                        </h2>
                        <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">
                            تتبع وإدارة كل العهد المصروفة لأطراف خارجية
                        </p>
                    </div>
                    <ExportButton
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                        label="تصدير العهد الخارجية"
                    />
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Card className="p-4 md:p-5 shadow-sm border-orange-100 bg-gradient-to-br from-white to-orange-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-0.5">
                                    إجمالي العهد الخارجية
                                </p>
                                <p className="text-lg md:text-xl font-black text-gray-900">
                                    {isLoading ? "..." : <AnimatedNumber value={totalAmount} />}{" "}
                                    <span className="text-[10px] text-gray-400">
                                        <CurrencyDisplay />
                                    </span>
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
                                    <span className="text-[10px] text-gray-400">
                                        <CurrencyDisplay />
                                    </span>
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
                                    عهد مفتوحة
                                </p>
                                <p className="text-lg md:text-xl font-black text-emerald-600">
                                    {isLoading ? "..." : openCount}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 md:p-5 shadow-sm border-gray-100 bg-gradient-to-br from-white to-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-gray-400 font-bold mb-0.5">
                                    عهد مغلقة
                                </p>
                                <p className="text-lg md:text-xl font-black text-gray-600">
                                    {isLoading ? "..." : closedCount}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit">
                    {(
                        [
                            ["all", "الكل"],
                            ["open", "مفتوحة"],
                            ["closed", "مغلقة"],
                        ] as const
                    ).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilter(val)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === val
                                ? "bg-[#102550] text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            {label}{" "}
                            <span className="opacity-70">
                                ({val === "all" ? custodies.length : val === "open" ? openCount : closedCount})
                            </span>
                        </button>
                    ))}
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
                                    title="لا توجد عهد خارجية"
                                    description="لم يتم العثور على أي عهد خارجية مطابقة للفلتر المحدد."
                                    icon={Building2}
                                />
                            </div>
                        ) : (
                            <table className="w-full text-xs md:text-sm text-right min-w-[800px]">
                                <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                                    <tr>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <FolderKanban className="w-3.5 h-3.5" />
                                                المشروع
                                            </div>
                                        </th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5" />
                                                الطرف الخارجي
                                            </div>
                                        </th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5" />
                                                الهاتف
                                            </div>
                                        </th>
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <Target className="w-3.5 h-3.5" />
                                                الغرض
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
                                        <th className="px-4 md:px-5 py-3 md:py-4 font-bold">السند</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                <a
                                                    href={`/projects/${c.project.id}?tab=team`}
                                                    className="font-bold text-[#102550] hover:underline"
                                                >
                                                    {c.project.name}
                                                </a>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 font-bold text-gray-900">
                                                {c.externalName || "—"}
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 text-gray-500 font-medium" dir="ltr">
                                                {c.externalPhone || "—"}
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 text-gray-600 max-w-[200px]">
                                                <span className="line-clamp-1" title={c.externalPurpose || ""}>
                                                    {c.externalPurpose || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 font-black text-gray-900">
                                                {c.amount.toLocaleString('en-US')}{" "}
                                                <span className="text-[10px] text-gray-400">
                                                    <CurrencyDisplay />
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                <span
                                                    className={`font-black ${c.balance > 0 ? "text-red-600" : "text-gray-400"
                                                        }`}
                                                >
                                                    {c.balance.toLocaleString('en-US')}{" "}
                                                    <span className="text-[10px] text-gray-400">
                                                        <CurrencyDisplay />
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${c.isClosed
                                                        ? "bg-gray-100 text-gray-600"
                                                        : "bg-emerald-50 text-emerald-700"
                                                        }`}
                                                >
                                                    {c.isClosed ? (
                                                        <>
                                                            <Lock className="w-2.5 h-2.5" /> مغلقة
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Unlock className="w-2.5 h-2.5" /> مفتوحة
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4 text-gray-500 font-medium">
                                                {new Date(c.createdAt).toLocaleDateString("en-GB")}
                                            </td>
                                            <td className="px-4 md:px-5 py-3 md:py-4">
                                                <a
                                                    href={`/api/vouchers/${c.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#102550] hover:text-blue-700 hover:underline"
                                                >
                                                    <FileOutput className="w-3 h-3" />
                                                    عرض
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Footer Totals */}
                                <tfoot className="bg-gray-50/80 border-t-2 border-gray-200">
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 md:px-5 py-3 md:py-4 font-black text-gray-700 text-xs"
                                        >
                                            الإجمالي ({filtered.length} عهدة)
                                        </td>
                                        <td className="px-4 md:px-5 py-3 md:py-4 font-black text-gray-900">
                                            {filtered
                                                .reduce((s, c) => s + c.amount, 0)
                                                .toLocaleString('en-US')}{" "}
                                            <span className="text-[10px] text-gray-400">
                                                <CurrencyDisplay />
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3 md:py-4 font-black text-red-600">
                                            {filtered
                                                .reduce((s, c) => s + c.balance, 0)
                                                .toLocaleString('en-US')}{" "}
                                            <span className="text-[10px] text-gray-400">
                                                <CurrencyDisplay />
                                            </span>
                                        </td>
                                        <td colSpan={3} />
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
