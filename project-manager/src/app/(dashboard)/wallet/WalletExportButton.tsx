"use client";

import { ExportButton } from "@/components/ui/ExportButton";
import { getWalletExportData } from "@/actions/exports";
import {
    downloadExcel,
    generatePrintableReport,
    openPrintWindow,
    formatDate,
    formatCurrency,
    walletEntryTypeLabel,
    type ExportColumn,
} from "@/lib/export-utils";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";


export function WalletExportButton() {
    const { user } = useAuth();
    const { locale } = useLanguage();

    const walletColumns: ExportColumn[] = [
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
        { key: "type", label: locale === 'ar' ? "نوع الحركة" : "Type", format: (v) => walletEntryTypeLabel[v as string] || String(v) },
        { key: "amount", label: locale === 'ar' ? "المبلغ" : "Amount", format: (v) => formatCurrency(v as number) },
        { key: "creatorName", label: locale === 'ar' ? "بواسطة" : "By" },
        { key: "note", label: locale === 'ar' ? "ملاحظات" : "Notes" },
    ];

    const handleExportExcel = async () => {
        const data = await getWalletExportData();
        downloadExcel(
            [{ name: locale === 'ar' ? "حركات الخزنة" : "Wallet Entries", columns: walletColumns, data: data.entries as Record<string, unknown>[] }],
            locale === 'ar' ? "كشف_حساب_الخزنة" : "wallet_statement"
        );
    };

    const handleExportPDF = async () => {
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
                { label: locale === 'ar' ? "عدد الحركات" : "Total Entries", value: String(data.entries.length) },
            ],
            branchName: user?.branchName,
            branchFlag: user?.branchFlag,
        });
        openPrintWindow(html);
    };

    return (
        <ExportButton
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            label={locale === 'ar' ? "تصدير كشف الخزنة" : "Export Wallet Statement"}
        />
    );
}
