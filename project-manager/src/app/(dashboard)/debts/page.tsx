"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { getPendingDebts, settleDebt } from "@/actions/debts";
import { useAuth } from "@/context/AuthContext";
import { Banknote, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { ExportButton } from "@/components/ui/ExportButton";
import { getDebtsExportData } from "@/actions/exports";
import { downloadExcel, generatePrintableReport, openPrintWindow, formatDate, formatCurrency, type ExportColumn } from "@/lib/export-utils";
import { useCanDo } from "@/components/auth/Protect";

export default function DebtsPage() {
    const { role } = useAuth();
    const [debts, setDebts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettling, setIsSettling] = useState<string | null>(null);
    const canExport = useCanDo('exports', 'view');

    const debtColumns: ExportColumn[] = [
        { key: "employeeName", label: "الموظف" },
        { key: "projectName", label: "المشروع" },
        { key: "categoryName", label: "القسم" },
        { key: "invoiceRef", label: "مرجع الفاتورة" },
        { key: "amount", label: "المبلغ المستحق", format: (v) => formatCurrency(v as number) },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const handleExportExcel = async () => {
        const data = await getDebtsExportData();
        downloadExcel([{ name: "ديون الموظفين", columns: debtColumns, data: data as Record<string, unknown>[] }], "تقرير_الديون");
    };

    const handleExportPDF = async () => {
        const data = await getDebtsExportData();
        const totalAmount = data.reduce((s, d) => s + d.amount, 0);
        const html = generatePrintableReport({
            title: "تقرير ديون الموظفين",
            subtitle: "المبالغ المستحقة للموظفين نتيجة الدفع الشخصي",
            columns: debtColumns,
            data: data as Record<string, unknown>[],
            summary: [
                { label: "إجمالي الديون", value: formatCurrency(totalAmount) },
                { label: "عدد الفواتير", value: String(data.length) },
            ],
        });
        openPrintWindow(html);
    };

    const loadDebts = () => {
        setIsLoading(true);
        getPendingDebts().then((data) => {
            setDebts(data);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        loadDebts();
    }, []);

    const handleSettle = async (debtId: string) => {
        if (!confirm("هل أنت متأكد من تسوية هذا الدين للموظف؟")) return;

        setIsSettling(debtId);
        const res = await settleDebt(debtId);
        setIsSettling(null);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("تم تسوية الدين بنجاح");
            loadDebts();
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout title="ديون الموظفين (الدفع الشخصي)">
                <div className="py-20 text-center text-gray-500">جاري تحميل الديون...</div>
            </DashboardLayout>
        );
    }

    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);

    return (
        <DashboardLayout title="ديون الموظفين (الدفع الشخصي)">
            <div className="space-y-6 md:space-y-8 pb-10" dir="rtl">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                            {role === "USER" ? "ديوني الشخصية" : "ديون الموظفين (الدفع الشخصي)"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {role === "USER"
                                ? "المبالغ التي دفعتها من حسابك الشخصي بانتظار تعويض الشركة"
                                : "المبالغ المستحقة للموظفين نتيجة دفعهم من حسابهم الخاص للفواتير"}
                        </p>
                    </div>
                    {canExport && (
                        <ExportButton
                            onExportExcel={handleExportExcel}
                            onExportPDF={handleExportPDF}
                            label="تصدير الديون"
                        />
                    )}
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card className="p-6 md:p-8 flex items-center gap-4 border-r-4 border-r-red-500 shadow-sm rounded-l-2xl rounded-r-none border-l-0 border-y-0 relative overflow-hidden">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <Banknote className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">
                                {role === "USER" ? "إجمالي ديوني عند الشركة" : "إجمالي الديون المعلقة للموظفين"}
                            </p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900">{totalDebts.toLocaleString()} <span className="text-sm font-bold text-gray-400"><CurrencyDisplay /></span></p>
                        </div>
                    </Card>

                    <Card className="p-6 md:p-8 flex items-center gap-4 shadow-sm rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">عدد الفواتير المعلقة بانتظار التسوية</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{debts.length} <span className="text-xs font-bold text-gray-400">فواتير</span></p>
                        </div>
                    </Card>
                </div>

                {/* Debts List */}
                <Card className="overflow-hidden shadow-sm border-gray-100 rounded-2xl">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h3 className="text-lg font-bold text-gray-900">سجل الديون المستحقة</h3>
                    </div>

                    {debts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right divide-y divide-gray-100">
                                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        {role !== "USER" && <th scope="col" className="px-6 py-4">الموظف</th>}
                                        <th scope="col" className="px-6 py-4">المشروع</th>
                                        <th scope="col" className="px-6 py-4">القسم</th>
                                        <th scope="col" className="px-6 py-4">المبلغ المستحق</th>
                                        <th scope="col" className="px-6 py-4">تاريخ الفاتورة</th>
                                        <th scope="col" className="px-6 py-4">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {debts.map((debt: any) => (
                                        <tr key={debt.id} className="hover:bg-gray-50/50 transition-colors">
                                            {role !== "USER" && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xs">
                                                                {debt.employee?.name?.charAt(0) || 'U'}
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">{debt.employee?.name}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                {debt.invoice?.project?.name || 'عام'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
                                                    {debt.invoice?.category?.name || 'غير محدد'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-black text-sm text-red-600">
                                                    {debt.amount.toLocaleString()} <span className="text-[10px] font-bold"><CurrencyDisplay /></span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                {new Date(debt.createdAt).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {(role === "GLOBAL_ACCOUNTANT" || role === "ADMIN") ? (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        isLoading={isSettling === debt.id}
                                                        disabled={isSettling === debt.id}
                                                        onClick={() => handleSettle(debt.id)}
                                                        className="h-8 rounded-lg font-bold text-xs bg-green-600 hover:bg-green-700 border-green-700"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 ml-1.5" />
                                                        تسوية (تعويض)
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                                        {role === "GENERAL_MANAGER" ? "بانتظار المحاسب العام" : "بانتظار التعويض"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Banknote className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-sm font-bold">لا توجد ديون مستحقة مسجلة حالياً</p>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
