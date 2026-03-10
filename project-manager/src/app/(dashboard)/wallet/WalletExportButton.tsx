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

const walletColumns: ExportColumn[] = [
    { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    { key: "type", label: "نوع الحركة", format: (v) => walletEntryTypeLabel[v as string] || String(v) },
    { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
    { key: "creatorName", label: "بواسطة" },
    { key: "note", label: "ملاحظات" },
];

export function WalletExportButton() {
    const { user } = useAuth();
    const handleExportExcel = async () => {
        const data = await getWalletExportData();
        downloadExcel(
            [{ name: "حركات الخزنة", columns: walletColumns, data: data.entries as Record<string, unknown>[] }],
            "كشف_حساب_الخزنة"
        );
    };

    const handleExportPDF = async () => {
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
                { label: "عدد الحركات", value: String(data.entries.length) },
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
            label="تصدير كشف الخزنة"
        />
    );
}
