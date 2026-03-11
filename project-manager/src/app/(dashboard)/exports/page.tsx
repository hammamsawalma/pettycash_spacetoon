"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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
    const { locale } = useLanguage();
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
        { key: "reference", label: locale === 'ar' ? "المرجع" : "Reference" },
        { key: "type", label: locale === 'ar' ? "النوع" : "Type" },
        { key: "amount", label: locale === 'ar' ? "المبلغ" : "Amount", format: (v) => formatCurrency(v as number) },
        { key: "status", label: locale === 'ar' ? "الحالة" : "Status", format: (v) => invoiceStatusLabel[v as string] || String(v) },
        { key: "paymentSource", label: locale === 'ar' ? "مصدر الدفع" : "Payment Source", format: (v) => paymentSourceLabel[v as string] || String(v) },
        { key: "projectName", label: locale === 'ar' ? "المشروع" : "Project" },
        { key: "categoryName", label: locale === 'ar' ? "التصنيف" : "Category" },
        { key: "creatorName", label: locale === 'ar' ? "المنشئ" : "Creator" },
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
    ];

    const walletColumns: ExportColumn[] = [
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
        { key: "type", label: locale === 'ar' ? "نوع الحركة" : "Entry Type", format: (v) => walletEntryTypeLabel[v as string] || String(v) },
        { key: "amount", label: locale === 'ar' ? "المبلغ" : "Amount", format: (v) => formatCurrency(v as number) },
        { key: "creatorName", label: locale === 'ar' ? "بواسطة" : "By" },
        { key: "note", label: locale === 'ar' ? "ملاحظات" : "Notes" },
    ];

    const debtColumns: ExportColumn[] = [
        { key: "employeeName", label: locale === 'ar' ? "الموظف" : "Employee" },
        { key: "projectName", label: locale === 'ar' ? "المشروع" : "Project" },
        { key: "invoiceRef", label: locale === 'ar' ? "مرجع الفاتورة" : "Invoice Ref" },
        { key: "amount", label: locale === 'ar' ? "المبلغ" : "Amount", format: (v) => formatCurrency(v as number) },
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
    ];

    const custodyColumns: ExportColumn[] = [
        { key: "employeeName", label: locale === 'ar' ? "المستلم" : "Recipient" },
        { key: "projectName", label: locale === 'ar' ? "المشروع" : "Project" },
        { key: "amount", label: locale === 'ar' ? "المبلغ" : "Amount", format: (v) => formatCurrency(v as number) },
        { key: "balance", label: locale === 'ar' ? "المتبقي" : "Remaining", format: (v) => formatCurrency(v as number) },
        { key: "status", label: locale === 'ar' ? "الحالة" : "Status", format: (v) => custodyStatusLabel[v as string] || String(v) },
        { key: "totalReturned", label: locale === 'ar' ? "المرجع" : "Returned", format: (v) => formatCurrency(v as number) },
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
    ];

    const projectColumns: ExportColumn[] = [
        { key: "name", label: locale === 'ar' ? "اسم المشروع" : "Project Name" },
        { key: "status", label: locale === 'ar' ? "الحالة" : "Status" },
        { key: "budget", label: locale === 'ar' ? "الميزانية" : "Budget", format: (v) => formatCurrency(v as number) },
        { key: "budgetAllocated", label: locale === 'ar' ? "المخصص" : "Allocated", format: (v) => formatCurrency(v as number) },
        { key: "custodyIssued", label: locale === 'ar' ? "عهد مصروفة" : "Custody Issued", format: (v) => formatCurrency(v as number) },
        { key: "managerName", label: locale === 'ar' ? "المدير" : "Manager" },
        { key: "invoicesCount", label: locale === 'ar' ? "فواتير" : "Invoices" },
        { key: "purchasesCount", label: locale === 'ar' ? "مشتريات" : "Purchases" },
    ];

    const purchaseColumns: ExportColumn[] = [
        { key: "orderNumber", label: locale === 'ar' ? "رقم الطلب" : "Order #" },
        { key: "description", label: locale === 'ar' ? "الوصف" : "Description" },
        { key: "status", label: locale === 'ar' ? "الحالة" : "Status", format: (v) => purchaseStatusLabel[v as string] || String(v) },
        { key: "priority", label: locale === 'ar' ? "الأولوية" : "Priority", format: (v) => purchasePriorityLabel[v as string] || String(v) },
        { key: "projectName", label: locale === 'ar' ? "المشروع" : "Project" },
        { key: "creatorName", label: locale === 'ar' ? "الطالب" : "Requester" },
        { key: "deadline", label: locale === 'ar' ? "الموعد" : "Deadline", format: (v) => v ? formatDate(v as string) : "-" },
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
    ];

    const frColumns: ExportColumn[] = [
        { key: "type", label: locale === 'ar' ? "النوع" : "Type", format: (v) => financeRequestTypeLabel[v as string] || String(v) },
        { key: "status", label: locale === 'ar' ? "الحالة" : "Status", format: (v) => financeRequestStatusLabel[v as string] || String(v) },
        { key: "amount", label: locale === 'ar' ? "المبلغ" : "Amount", format: (v) => formatCurrency(v as number) },
        { key: "requesterName", label: locale === 'ar' ? "الطالب" : "Requester" },
        { key: "approverName", label: locale === 'ar' ? "الموافق" : "Approver" },
        { key: "note", label: locale === 'ar' ? "ملاحظات" : "Notes" },
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
    ];

    // ─── Export Cards ──────────────────────────────────────────────────────

    const exportCards: ExportCard[] = [
        {
            id: "invoices",
            title: locale === 'ar' ? "تقرير الفواتير" : "Invoices Report",
            description: locale === 'ar' ? "كل الفواتير مع تفاصيلها (معلقة / معتمدة / مرفوضة)" : "All invoices with details (pending / approved / rejected)",
            icon: FileText,
            color: "text-blue-600",
            bgGradient: "from-blue-50 to-white border-blue-100",
            handleExcel: async () => {
                const data = await getInvoicesExportData();
                downloadExcel([{ name: locale === 'ar' ? "الفواتير" : "Invoices", columns: invoiceColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_الفواتير" : "Invoices_Report");
            },
            handlePDF: async () => {
                const data = await getInvoicesExportData();
                const totalAmount = data.reduce((s, d) => s + d.amount, 0);
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "تقرير الفواتير" : "Invoices Report",
                    subtitle: locale === 'ar' ? "سبيستون بوكيت — إدارة المشاريع" : "Spacetoon Pocket — Project Management",
                    columns: invoiceColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "إجمالي الفواتير" : "Total Invoices", value: String(data.length) },
                        { label: locale === 'ar' ? "إجمالي المبالغ" : "Total Amount", value: formatCurrency(totalAmount) },
                        { label: locale === 'ar' ? "معتمدة" : "Approved", value: String(data.filter((d) => d.status === "APPROVED").length) },
                        { label: locale === 'ar' ? "معلقة" : "Pending", value: String(data.filter((d) => d.status === "PENDING").length) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
                });
                openPrintWindow(html);
            },
        },
        {
            id: "wallet",
            title: locale === 'ar' ? "كشف حساب الخزنة" : "Wallet Statement",
            description: locale === 'ar' ? "كل حركات الخزنة مع الأرصدة والإيداعات والمسحوبات" : "All wallet transactions with balances, deposits, and withdrawals",
            icon: Wallet,
            color: "text-emerald-600",
            bgGradient: "from-emerald-50 to-white border-emerald-100",
            handleExcel: async () => {
                const data = await getWalletExportData();
                downloadExcel([{ name: locale === 'ar' ? "حركات الخزنة" : "Wallet Entries", columns: walletColumns, data: data.entries as Record<string, unknown>[] }], locale === 'ar' ? "كشف_حساب_الخزنة" : "Wallet_Statement");
            },
            handlePDF: async () => {
                const data = await getWalletExportData();
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "كشف حساب الخزنة" : "Wallet Statement",
                    subtitle: locale === 'ar' ? "سبيستون بوكيت — خزنة الشركة الرئيسية" : "Spacetoon Pocket — Main Company Wallet",
                    columns: walletColumns,
                    data: data.entries as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "الرصيد المتاح" : "Available Balance", value: formatCurrency(data.balance) },
                        { label: locale === 'ar' ? "إجمالي الإيداعات" : "Total Deposits", value: formatCurrency(data.totalIn) },
                        { label: locale === 'ar' ? "إجمالي المسحوبات" : "Total Withdrawals", value: formatCurrency(data.totalOut) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
                });
                openPrintWindow(html);
            },
        },
        {
            id: "debts",
            title: locale === 'ar' ? "تقرير الديون" : "Debts Report",
            description: locale === 'ar' ? "ديون الموظفين غير المُسوّاة نتيجة الدفع الشخصي" : "Unsettled employee debts from personal payments",
            icon: Banknote,
            color: "text-red-600",
            bgGradient: "from-red-50 to-white border-red-100",
            handleExcel: async () => {
                const data = await getDebtsExportData();
                downloadExcel([{ name: locale === 'ar' ? "ديون الموظفين" : "Employee Debts", columns: debtColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_الديون" : "Debts_Report");
            },
            handlePDF: async () => {
                const data = await getDebtsExportData();
                const totalAmount = data.reduce((s, d) => s + d.amount, 0);
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "تقرير ديون الموظفين" : "Employee Debts Report",
                    subtitle: locale === 'ar' ? "المبالغ المستحقة نتيجة الدفع الشخصي" : "Amounts due from personal payments",
                    columns: debtColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "إجمالي الديون" : "Total Debts", value: formatCurrency(totalAmount) },
                        { label: locale === 'ar' ? "عدد الفواتير" : "Invoice Count", value: String(data.length) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
                });
                openPrintWindow(html);
            },
        },
        {
            id: "custodies",
            title: locale === 'ar' ? "تقرير العهدات" : "Custody Report",
            description: locale === 'ar' ? "كل العهدات (داخلية + خارجية + شركة) مع الأرصدة" : "All custodies (internal + external + company) with balances",
            icon: HandCoins,
            color: "text-amber-600",
            bgGradient: "from-amber-50 to-white border-amber-100",
            handleExcel: async () => {
                const data = await getCustodiesExportData("all");
                downloadExcel([{ name: locale === 'ar' ? "العهدات" : "Custodies", columns: custodyColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_العهدات" : "Custody_Report");
            },
            handlePDF: async () => {
                const data = await getCustodiesExportData("all");
                const totalAmount = data.reduce((s, d) => s + d.amount, 0);
                const totalBalance = data.reduce((s, d) => s + d.balance, 0);
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "تقرير العهدات الشامل" : "Comprehensive Custody Report",
                    subtitle: locale === 'ar' ? "داخلية + خارجية + مصاريف شركة" : "Internal + External + Company Expenses",
                    columns: custodyColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "إجمالي المصروفات" : "Total Expenses", value: formatCurrency(totalAmount) },
                        { label: locale === 'ar' ? "الرصيد المتبقي" : "Remaining Balance", value: formatCurrency(totalBalance) },
                        { label: locale === 'ar' ? "عدد العهد" : "Custody Count", value: String(data.length) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
                });
                openPrintWindow(html);
            },
        },
        {
            id: "projects",
            title: locale === 'ar' ? "تقرير المشاريع" : "Projects Report",
            description: locale === 'ar' ? "ملخص مالي لكل مشروع (ميزانية، فواتير، عهدات)" : "Financial summary per project (budget, invoices, custodies)",
            icon: FolderKanban,
            color: "text-purple-600",
            bgGradient: "from-purple-50 to-white border-purple-100",
            handleExcel: async () => {
                const data = await getProjectsExportData();
                downloadExcel([{ name: locale === 'ar' ? "المشاريع" : "Projects", columns: projectColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_المشاريع" : "Projects_Report");
            },
            handlePDF: async () => {
                const data = await getProjectsExportData();
                const totalBudget = data.reduce((s, d) => s + d.budget, 0);
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "تقرير المشاريع" : "Projects Report",
                    subtitle: locale === 'ar' ? "ملخص مالي لجميع المشاريع" : "Financial summary for all projects",
                    columns: projectColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "عدد المشاريع" : "Project Count", value: String(data.length) },
                        { label: locale === 'ar' ? "إجمالي الميزانيات" : "Total Budgets", value: formatCurrency(totalBudget) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
                });
                openPrintWindow(html);
            },
        },
        {
            id: "purchases",
            title: locale === 'ar' ? "تقرير المشتريات" : "Purchases Report",
            description: locale === 'ar' ? "كل أوامر الشراء مع حالاتها وأولوياتها" : "All purchase orders with statuses and priorities",
            icon: ShoppingCart,
            color: "text-teal-600",
            bgGradient: "from-teal-50 to-white border-teal-100",
            handleExcel: async () => {
                const data = await getPurchasesExportData();
                downloadExcel([{ name: locale === 'ar' ? "المشتريات" : "Purchases", columns: purchaseColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_المشتريات" : "Purchases_Report");
            },
            handlePDF: async () => {
                const data = await getPurchasesExportData();
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "تقرير المشتريات" : "Purchases Report",
                    subtitle: locale === 'ar' ? "أوامر الشراء عبر جميع المشاريع" : "Purchase orders across all projects",
                    columns: purchaseColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "إجمالي الطلبات" : "Total Orders", value: String(data.length) },
                        { label: locale === 'ar' ? "تم الشراء" : "Purchased", value: String(data.filter((d) => d.status === "PURCHASED").length) },
                        { label: locale === 'ar' ? "قيد التنفيذ" : "In Progress", value: String(data.filter((d) => d.status === "IN_PROGRESS").length) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
                });
                openPrintWindow(html);
            },
        },
        {
            id: "finance-requests",
            title: locale === 'ar' ? "تقرير الطلبات المالية" : "Finance Requests Report",
            description: locale === 'ar' ? "سجل الطلبات المالية والموافقات" : "Finance request and approval log",
            icon: BadgeDollarSign,
            color: "text-orange-600",
            bgGradient: "from-orange-50 to-white border-orange-100",
            handleExcel: async () => {
                const data = await getFinanceRequestsExportData();
                downloadExcel([{ name: locale === 'ar' ? "الطلبات المالية" : "Finance Requests", columns: frColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_الطلبات_المالية" : "Finance_Requests_Report");
            },
            handlePDF: async () => {
                const data = await getFinanceRequestsExportData();
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "تقرير الطلبات المالية" : "Finance Requests Report",
                    subtitle: locale === 'ar' ? "سجل الطلبات والموافقات" : "Request and approval log",
                    columns: frColumns,
                    data: data as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "إجمالي الطلبات" : "Total Requests", value: String(data.length) },
                        { label: locale === 'ar' ? "معلقة" : "Pending", value: String(data.filter((d) => d.status === "PENDING").length) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
                });
                openPrintWindow(html);
            },
        },
        {
            id: "comprehensive",
            title: locale === 'ar' ? "التقرير المالي الشامل" : "Comprehensive Financial Report",
            description: locale === 'ar' ? "كل البيانات في ملف Excel واحد (متعدد Sheets)" : "All data in one Excel file (multi-sheet)",
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
                        { name: locale === 'ar' ? "الفواتير" : "Invoices", columns: invoiceColumns, data: invoices as Record<string, unknown>[] },
                        { name: locale === 'ar' ? "الخزنة" : "Wallet", columns: walletColumns, data: wallet.entries as Record<string, unknown>[] },
                        { name: locale === 'ar' ? "الديون" : "Debts", columns: debtColumns, data: debts as Record<string, unknown>[] },
                        { name: locale === 'ar' ? "العهدات" : "Custodies", columns: custodyColumns, data: custodies as Record<string, unknown>[] },
                        { name: locale === 'ar' ? "المشاريع" : "Projects", columns: projectColumns, data: projects as Record<string, unknown>[] },
                        { name: locale === 'ar' ? "المشتريات" : "Purchases", columns: purchaseColumns, data: purchases as Record<string, unknown>[] },
                        { name: locale === 'ar' ? "الطلبات المالية" : "Finance Requests", columns: frColumns, data: finReqs as Record<string, unknown>[] },
                    ],
                    locale === 'ar' ? "التقرير_المالي_الشامل" : "Comprehensive_Financial_Report"
                );
            },
            handlePDF: async () => {
                const invoices = await getInvoicesExportData();
                const totalAmount = invoices.reduce((s, d) => s + d.amount, 0);
                const html = generatePrintableReport({
                    title: locale === 'ar' ? "التقرير المالي الشامل" : "Comprehensive Financial Report",
                    subtitle: locale === 'ar' ? "سبيستون بوكيت — ملخص شامل" : "Spacetoon Pocket — Full Summary",
                    columns: invoiceColumns,
                    data: invoices as Record<string, unknown>[],
                    summary: [
                        { label: locale === 'ar' ? "إجمالي الفواتير" : "Total Invoices", value: String(invoices.length) },
                        { label: locale === 'ar' ? "إجمالي المبالغ" : "Total Amount", value: formatCurrency(totalAmount) },
                    ],
                    branchName: user?.branchName,
                    branchFlag: user?.branchFlag,
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
        <DashboardLayout title={locale === 'ar' ? "مركز التصدير" : "Export Center"}>
            <div className="space-y-6 md:space-y-8 pb-8">
                {/* Header */}
                <div className="bg-gradient-to-l from-[#102550] to-[#1a3a7c] rounded-2xl p-6 md:p-8 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black">{locale === 'ar' ? 'مركز التصدير' : 'Export Center'}</h1>
                            <p className="text-sm text-white/70 font-medium mt-0.5">
                                {locale === 'ar' ? 'صدّر بياناتك المالية بصيغة Excel أو PDF' : 'Export your financial data in Excel or PDF format'}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">{exportCards.length}</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">{locale === 'ar' ? 'أنواع التقارير' : 'Report Types'}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">2</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">{locale === 'ar' ? 'صيغ التصدير' : 'Export Formats'}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">📊</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">Excel (.xlsx)</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">📄</p>
                            <p className="text-[10px] text-white/60 font-bold mt-0.5">{locale === 'ar' ? 'PDF / طباعة' : 'PDF / Print'}</p>
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
                    <h3 className="text-sm font-bold text-gray-500 mb-3">{locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: locale === 'ar' ? "الفواتير" : "Invoices", href: "/invoices" },
                            { label: locale === 'ar' ? "الخزنة" : "Wallet", href: "/wallet" },
                            { label: locale === 'ar' ? "الديون" : "Debts", href: "/debts" },
                            { label: locale === 'ar' ? "عهد الموظفين" : "Employee Custodies", href: "/employee-custodies" },
                            { label: locale === 'ar' ? "العهد الخارجية" : "External Custodies", href: "/external-custodies" },
                            { label: locale === 'ar' ? "مصاريف الشركة" : "Company Expenses", href: "/company-custodies" },
                            { label: locale === 'ar' ? "المشاريع" : "Projects", href: "/projects" },
                            { label: locale === 'ar' ? "المشتريات" : "Purchases", href: "/purchases" },
                            { label: locale === 'ar' ? "الطلبات المالية" : "Finance Requests", href: "/finance-requests" },
                            { label: locale === 'ar' ? "التقارير" : "Reports", href: "/reports" },
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
