"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
    FileText,
    Wallet,
    Banknote,
    HandCoins,
    FolderKanban,
    ShoppingCart,
    BadgeDollarSign,
    Building2,
    FileSpreadsheet,
    Download,
    Loader2,
    ExternalLink,
    BarChart3,
} from "lucide-react";

// Server actions for export data
import {
    getInvoicesExportData,
    getWalletExportData,
    getDebtsExportData,
    getCustodiesExportData,
    getProjectsExportData,
    getProjectFinancialExportData,
    getPurchasesExportData,
    getFinanceRequestsExportData,
} from "@/actions/exports";

// Export utilities
import {
    downloadExcel,
    generatePrintableReport,
    openPrintWindow,
    formatDate,
    formatCurrency,
    invoiceStatusLabel,
    paymentSourceLabel,
    custodyStatusLabel,
    purchaseStatusLabel,
    purchasePriorityLabel,
    walletEntryTypeLabel,
    financeRequestTypeLabel,
    financeRequestStatusLabel,
    type ExportColumn,
} from "@/lib/export-utils";

interface ExportCard {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgGradient: string;
    handleExcel: () => Promise<void>;
    handlePDF: () => Promise<void>;
}

export default function ExportsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const canExport = useCanDo("exports", "view");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [loadingType, setLoadingType] = useState<"excel" | "pdf" | null>(null);

    useEffect(() => {
        if (user && !canExport) {
            router.push("/");
        }
    }, [user, canExport, router]);

    if (!user || !canExport) return null;

    // ─── Column Definitions ────────────────────────────────────────────────

    const invoiceColumns: ExportColumn[] = [
        { key: "reference", label: "المرجع" },
        { key: "type", label: "النوع" },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "status", label: "الحالة", format: (v) => invoiceStatusLabel[v as string] || String(v) },
        { key: "paymentSource", label: "مصدر الدفع", format: (v) => paymentSourceLabel[v as string] || String(v) },
        { key: "projectName", label: "المشروع" },
        { key: "categoryName", label: "التصنيف" },
        { key: "creatorName", label: "المنشئ" },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const walletColumns: ExportColumn[] = [
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
        { key: "type", label: "نوع الحركة", format: (v) => walletEntryTypeLabel[v as string] || String(v) },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "creatorName", label: "بواسطة" },
        { key: "note", label: "ملاحظات" },
    ];

    const debtColumns: ExportColumn[] = [
        { key: "employeeName", label: "الموظف" },
        { key: "projectName", label: "المشروع" },
        { key: "invoiceRef", label: "مرجع الفاتورة" },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const custodyColumns: ExportColumn[] = [
        { key: "employeeName", label: "المستلم" },
        { key: "projectName", label: "المشروع" },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "balance", label: "المتبقي", format: (v) => formatCurrency(v as number) },
        { key: "status", label: "الحالة", format: (v) => custodyStatusLabel[v as string] || String(v) },
        { key: "totalReturned", label: "المرجع", format: (v) => formatCurrency(v as number) },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const projectColumns: ExportColumn[] = [
        { key: "name", label: "اسم المشروع" },
        { key: "status", label: "الحالة" },
        { key: "budget", label: "الميزانية", format: (v) => formatCurrency(v as number) },
        { key: "budgetAllocated", label: "المخصص", format: (v) => formatCurrency(v as number) },
        { key: "custodyIssued", label: "عهد مصروفة", format: (v) => formatCurrency(v as number) },
        { key: "managerName", label: "المدير" },
        { key: "invoicesCount", label: "فواتير" },
        { key: "purchasesCount", label: "مشتريات" },
    ];

    const purchaseColumns: ExportColumn[] = [
        { key: "orderNumber", label: "رقم الطلب" },
        { key: "description", label: "الوصف" },
        { key: "status", label: "الحالة", format: (v) => purchaseStatusLabel[v as string] || String(v) },
        { key: "priority", label: "الأولوية", format: (v) => purchasePriorityLabel[v as string] || String(v) },
        { key: "projectName", label: "المشروع" },
        { key: "creatorName", label: "الطالب" },
        { key: "deadline", label: "الموعد", format: (v) => v ? formatDate(v as string) : "-" },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const frColumns: ExportColumn[] = [
        { key: "type", label: "النوع", format: (v) => financeRequestTypeLabel[v as string] || String(v) },
        { key: "status", label: "الحالة", format: (v) => financeRequestStatusLabel[v as string] || String(v) },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "requesterName", label: "الطالب" },
        { key: "approverName", label: "الموافق" },
        { key: "note", label: "ملاحظات" },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    // ─── Export Cards ──────────────────────────────────────────────────────

    const exportCards: ExportCard[] = [
        {
            id: "invoices",
            title: "تقرير الفواتير",
            description: "كل الفواتير مع تفاصيلها (معلقة / معتمدة / مرفوضة)",
            icon: FileText,
            color: "text-blue-600",
            bgGradient: "from-blue-50 to-white border-blue-100",
            handleExcel: async () => {
                const data = await getInvoicesExportData();
                downloadExcel([{ name: "الفواتير", columns: invoiceColumns, data: data as Record<string, unknown>[] }], "تقرير_الفواتير");
            },
            handlePDF: async () => {
                const data = await getInvoicesExportData();
                const totalAmount = data.reduce((s, d) => s + d.amount, 0);
                const html = generatePrintableReport({
                    title: "تقرير الفواتير",
                    subtitle: "سبيستون بوكيت — إدارة المشاريع",
                    columns: invoiceColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: "إجمالي الفواتير", value: String(data.length) },
                        { label: "إجمالي المبالغ", value: formatCurrency(totalAmount) },
                        { label: "معتمدة", value: String(data.filter((d) => d.status === "APPROVED").length) },
                        { label: "معلقة", value: String(data.filter((d) => d.status === "PENDING").length) },
                    ],
                });
                openPrintWindow(html);
            },
        },
        {
            id: "wallet",
            title: "كشف حساب الخزنة",
            description: "كل حركات الخزنة مع الأرصدة والإيداعات والمسحوبات",
            icon: Wallet,
            color: "text-emerald-600",
            bgGradient: "from-emerald-50 to-white border-emerald-100",
            handleExcel: async () => {
                const data = await getWalletExportData();
                downloadExcel([{ name: "حركات الخزنة", columns: walletColumns, data: data.entries as Record<string, unknown>[] }], "كشف_حساب_الخزنة");
            },
            handlePDF: async () => {
                const data = await getWalletExportData();
                const html = generatePrintableReport({
                    title: "كشف حساب الخزنة",
                    subtitle: "سبيستون بوكيت — خزنة الشركة الرئيسية",
                    columns: walletColumns,
                    data: data.entries as Record<string, unknown>[],
                    summary: [
                        { label: "الرصيد المتاح", value: formatCurrency(data.balance) },
                        { label: "إجمالي الإيداعات", value: formatCurrency(data.totalIn) },
                        { label: "إجمالي المسحوبات", value: formatCurrency(data.totalOut) },
                    ],
                });
                openPrintWindow(html);
            },
        },
        {
            id: "debts",
            title: "تقرير الديون",
            description: "ديون الموظفين غير المُسوّاة نتيجة الدفع الشخصي",
            icon: Banknote,
            color: "text-red-600",
            bgGradient: "from-red-50 to-white border-red-100",
            handleExcel: async () => {
                const data = await getDebtsExportData();
                downloadExcel([{ name: "ديون الموظفين", columns: debtColumns, data: data as Record<string, unknown>[] }], "تقرير_الديون");
            },
            handlePDF: async () => {
                const data = await getDebtsExportData();
                const totalAmount = data.reduce((s, d) => s + d.amount, 0);
                const html = generatePrintableReport({
                    title: "تقرير ديون الموظفين",
                    subtitle: "المبالغ المستحقة نتيجة الدفع الشخصي",
                    columns: debtColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: "إجمالي الديون", value: formatCurrency(totalAmount) },
                        { label: "عدد الفواتير", value: String(data.length) },
                    ],
                });
                openPrintWindow(html);
            },
        },
        {
            id: "custodies",
            title: "تقرير العهدات",
            description: "كل العهدات (داخلية + خارجية + شركة) مع الأرصدة",
            icon: HandCoins,
            color: "text-amber-600",
            bgGradient: "from-amber-50 to-white border-amber-100",
            handleExcel: async () => {
                const data = await getCustodiesExportData("all");
                downloadExcel([{ name: "العهدات", columns: custodyColumns, data: data as Record<string, unknown>[] }], "تقرير_العهدات");
            },
            handlePDF: async () => {
                const data = await getCustodiesExportData("all");
                const totalAmount = data.reduce((s, d) => s + d.amount, 0);
                const totalBalance = data.reduce((s, d) => s + d.balance, 0);
                const html = generatePrintableReport({
                    title: "تقرير العهدات الشامل",
                    subtitle: "داخلية + خارجية + مصاريف شركة",
                    columns: custodyColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: "إجمالي المصروفات", value: formatCurrency(totalAmount) },
                        { label: "الرصيد المتبقي", value: formatCurrency(totalBalance) },
                        { label: "عدد العهد", value: String(data.length) },
                    ],
                });
                openPrintWindow(html);
            },
        },
        {
            id: "projects",
            title: "تقرير المشاريع",
            description: "ملخص مالي لكل مشروع (ميزانية، فواتير، عهدات)",
            icon: FolderKanban,
            color: "text-purple-600",
            bgGradient: "from-purple-50 to-white border-purple-100",
            handleExcel: async () => {
                const data = await getProjectsExportData();
                downloadExcel([{ name: "المشاريع", columns: projectColumns, data: data as Record<string, unknown>[] }], "تقرير_المشاريع");
            },
            handlePDF: async () => {
                const data = await getProjectsExportData();
                const totalBudget = data.reduce((s, d) => s + d.budget, 0);
                const html = generatePrintableReport({
                    title: "تقرير المشاريع",
                    subtitle: "ملخص مالي لجميع المشاريع",
                    columns: projectColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: "عدد المشاريع", value: String(data.length) },
                        { label: "إجمالي الميزانيات", value: formatCurrency(totalBudget) },
                    ],
                });
                openPrintWindow(html);
            },
        },
        {
            id: "purchases",
            title: "تقرير المشتريات",
            description: "كل أوامر الشراء مع حالاتها وأولوياتها",
            icon: ShoppingCart,
            color: "text-teal-600",
            bgGradient: "from-teal-50 to-white border-teal-100",
            handleExcel: async () => {
                const data = await getPurchasesExportData();
                downloadExcel([{ name: "المشتريات", columns: purchaseColumns, data: data as Record<string, unknown>[] }], "تقرير_المشتريات");
            },
            handlePDF: async () => {
                const data = await getPurchasesExportData();
                const html = generatePrintableReport({
                    title: "تقرير المشتريات",
                    subtitle: "أوامر الشراء عبر جميع المشاريع",
                    columns: purchaseColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: "إجمالي الطلبات", value: String(data.length) },
                        { label: "تم الشراء", value: String(data.filter((d) => d.status === "PURCHASED").length) },
                        { label: "قيد التنفيذ", value: String(data.filter((d) => d.status === "IN_PROGRESS").length) },
                    ],
                });
                openPrintWindow(html);
            },
        },
        {
            id: "finance-requests",
            title: "تقرير الطلبات المالية",
            description: "سجل الطلبات المالية والموافقات",
            icon: BadgeDollarSign,
            color: "text-orange-600",
            bgGradient: "from-orange-50 to-white border-orange-100",
            handleExcel: async () => {
                const data = await getFinanceRequestsExportData();
                downloadExcel([{ name: "الطلبات المالية", columns: frColumns, data: data as Record<string, unknown>[] }], "تقرير_الطلبات_المالية");
            },
            handlePDF: async () => {
                const data = await getFinanceRequestsExportData();
                const html = generatePrintableReport({
                    title: "تقرير الطلبات المالية",
                    subtitle: "سجل الطلبات والموافقات",
                    columns: frColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: "إجمالي الطلبات", value: String(data.length) },
                        { label: "معلقة", value: String(data.filter((d) => d.status === "PENDING").length) },
                    ],
                });
                openPrintWindow(html);
            },
        },
        {
            id: "comprehensive",
            title: "التقرير المالي الشامل",
            description: "كل البيانات في ملف Excel واحد (متعدد Sheets)",
            icon: BarChart3,
            color: "text-indigo-600",
            bgGradient: "from-indigo-50 to-white border-indigo-100",
            handleExcel: async () => {
                const [invoices, wallet, debts, custodies, projects, purchases, finReqs] = await Promise.all([
                    getInvoicesExportData(),
                    getWalletExportData(),
                    getDebtsExportData(),
                    getCustodiesExportData("all"),
                    getProjectsExportData(),
                    getPurchasesExportData(),
                    getFinanceRequestsExportData(),
                ]);
                downloadExcel(
                    [
                        { name: "الفواتير", columns: invoiceColumns, data: invoices as Record<string, unknown>[] },
                        { name: "الخزنة", columns: walletColumns, data: wallet.entries as Record<string, unknown>[] },
                        { name: "الديون", columns: debtColumns, data: debts as Record<string, unknown>[] },
                        { name: "العهدات", columns: custodyColumns, data: custodies as Record<string, unknown>[] },
                        { name: "المشاريع", columns: projectColumns, data: projects as Record<string, unknown>[] },
                        { name: "المشتريات", columns: purchaseColumns, data: purchases as Record<string, unknown>[] },
                        { name: "الطلبات المالية", columns: frColumns, data: finReqs as Record<string, unknown>[] },
                    ],
                    "التقرير_المالي_الشامل"
                );
            },
            handlePDF: async () => {
                const invoices = await getInvoicesExportData();
                const totalAmount = invoices.reduce((s, d) => s + d.amount, 0);
                const html = generatePrintableReport({
                    title: "التقرير المالي الشامل",
                    subtitle: "سبيستون بوكيت — ملخص شامل",
                    columns: invoiceColumns,
                    data: invoices as Record<string, unknown>[],
                    summary: [
                        { label: "إجمالي الفواتير", value: String(invoices.length) },
                        { label: "إجمالي المبالغ", value: formatCurrency(totalAmount) },
                    ],
                });
                openPrintWindow(html);
            },
        },
    ];

    const handleExport = async (card: ExportCard, type: "excel" | "pdf") => {
        setLoadingId(card.id);
        setLoadingType(type);
        try {
            if (type === "excel") await card.handleExcel();
            else await card.handlePDF();
        } catch (error) {
            console.error("Export error:", error);
        } finally {
            setLoadingId(null);
            setLoadingType(null);
        }
    };

    return (
        <DashboardLayout title="مركز التصدير">
            <div className="space-y-6 md:space-y-8 pb-8">
                {/* Header */}
                <div className="bg-gradient-to-l from-[#102550] to-[#1a3a7c] rounded-2xl p-6 md:p-8 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black">مركز التصدير</h1>
                            <p className="text-sm text-white/70 font-medium mt-0.5">
                                صدّر بياناتك المالية بصيغة Excel أو PDF
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">{exportCards.length}</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">أنواع التقارير</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">2</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">صيغ التصدير</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">📊</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">Excel (.xlsx)</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">📄</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">PDF / طباعة</p>
                        </div>
                    </div>
                </div>

                {/* Export Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {exportCards.map((card) => {
                        const isLoading = loadingId === card.id;
                        const Icon = card.icon;

                        return (
                            <Card
                                key={card.id}
                                id={`export-card-${card.id}`}
                                className={`p-5 bg-gradient-to-br ${card.bgGradient} hover:shadow-md transition-all duration-200 group flex flex-col`}
                            >
                                {/* Icon + Title */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 ${card.color} group-hover:scale-105 transition-transform`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{card.title}</h3>
                                        <p className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-2">{card.description}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100/50">
                                    <button
                                        id={`export-${card.id}-excel`}
                                        disabled={isLoading}
                                        onClick={() => handleExport(card, "excel")}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading && loadingType === "excel" ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <FileSpreadsheet className="w-3.5 h-3.5" />
                                        )}
                                        Excel
                                    </button>
                                    <button
                                        id={`export-${card.id}-pdf`}
                                        disabled={isLoading}
                                        onClick={() => handleExport(card, "pdf")}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading && loadingType === "pdf" ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <FileText className="w-3.5 h-3.5" />
                                        )}
                                        PDF
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Quick Links */}
                <Card className="p-5 bg-gray-50/50 border-dashed border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 mb-3">روابط سريعة</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "الفواتير", href: "/invoices" },
                            { label: "الخزنة", href: "/wallet" },
                            { label: "الديون", href: "/debts" },
                            { label: "عهد الموظفين", href: "/employee-custodies" },
                            { label: "العهد الخارجية", href: "/external-custodies" },
                            { label: "مصاريف الشركة", href: "/company-custodies" },
                            { label: "المشاريع", href: "/projects" },
                            { label: "المشتريات", href: "/purchases" },
                            { label: "الطلبات المالية", href: "/finance-requests" },
                            { label: "التقارير", href: "/reports" },
                        ].map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 bg-white rounded-lg border border-gray-200 hover:border-[#102550]/30 hover:text-[#102550] transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                {link.label}
                            </a>
                        ))}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
