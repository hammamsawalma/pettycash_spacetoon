"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { issueCompanyCustody } from "@/actions/custody";
import toast from "react-hot-toast";
import { Building2, Plus, Wallet, Clock, FileOutput, User, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { ExportButton } from "@/components/ui/ExportButton";
import { getCustodiesExportData } from "@/actions/exports";
import { downloadExcel, generatePrintableReport, openPrintWindow, formatDate, formatCurrency, type ExportColumn } from "@/lib/export-utils";
import { useCanDo } from "@/components/auth/Protect";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface CompanyCustodyData {
    id: string;
    amount: number;
    balance: number;
    method: string;
    isConfirmed: boolean;
    isClosed: boolean;
    status: string;
    rejectedReason?: string | null;
    createdAt: Date;
    note: string | null;
    employee: { id: string; name: string; image?: string | null };
}

export default function CompanyCustodiesClient({ custodies, role, accountants = [] }: { custodies: CompanyCustodyData[]; role: string; accountants?: { id: string; name: string | null }[] }) {
    const router = useRouter();
    const { user } = useAuth();
    const { locale } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        const res = await issueCompanyCustody(prev, formData);
        if (res?.error) {
            toast.error(res.error);
            return res;
        }
        toast.success(locale === 'ar' ? "تم صرف عهدة مصاريف الشركة بنجاح ✅" : "Company expense custody issued ✅");
        setShowForm(false);
        router.refresh();
        return res;
    }, null);

    const active = custodies.filter(c => c.status !== 'REJECTED' && !c.isClosed);
    const closed = custodies.filter(c => c.isClosed && c.status !== 'REJECTED');
    const rejected = custodies.filter(c => c.status === 'REJECTED');
    const totalActive = active.reduce((sum, c) => sum + c.balance, 0);
    const canExport = useCanDo('exports', 'view');
    const canReturn = ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT", "ACCOUNTANT"].includes(role);

    const [returnModal, setReturnModal] = useState<{ id: string, balance: number } | null>(null);
    const [isReturning, setIsReturning] = useState(false);

    const handleReturn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!returnModal) return;
        setIsReturning(true);
        const fd = new FormData(e.currentTarget);
        const amount = parseFloat(fd.get("amount") as string);
        const note = fd.get("note") as string;
        
        try {
            const { returnCustodyBalance } = await import("@/actions/custody");
            const res = await returnCustodyBalance(returnModal.id, amount, note);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(locale === 'ar' ? "تم تسجيل المرتجع بنجاح ✅" : "Return recorded successfully ✅");
                setReturnModal(null);
                router.refresh();
            }
        } catch (err) {
            toast.error("Error returning balance");
        } finally {
            setIsReturning(false);
        }
    };

    const compColumns: ExportColumn[] = [
        { key: "employeeName", label: locale === 'ar' ? "المستلم" : "Recipient" },
        { key: "amount", label: locale === 'ar' ? "المبلغ" : "Amount", format: (v) => formatCurrency(v as number) },
        { key: "balance", label: locale === 'ar' ? "المتبقي" : "Remaining", format: (v) => formatCurrency(v as number) },
        { key: "method", label: locale === 'ar' ? "طريقة الدفع" : "Payment Method" },
        { key: "status", label: locale === 'ar' ? "الحالة" : "Status" },
        { key: "note", label: locale === 'ar' ? "ملاحظة" : "Note" },
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
    ];

    const handleExportExcel = async () => {
        const data = await getCustodiesExportData("company");
        downloadExcel([{ name: locale === 'ar' ? "مصاريف الشركة" : "Company Expenses", columns: compColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_مصاريف_الشركة" : "Company_Expenses_Report");
    };

    const handleExportPDF = async () => {
        const data = await getCustodiesExportData("company");
        const totalAmount = data.reduce((s, d) => s + d.amount, 0);
        const html = generatePrintableReport({
            title: locale === 'ar' ? "تقرير عهد مصاريف الشركة" : "Company Expense Custodies",
            subtitle: locale === 'ar' ? "عهد مصاريف الشركة العامة" : "General company expense custodies",
            columns: compColumns,
            data: data as Record<string, unknown>[],
            summary: [
                { label: locale === 'ar' ? "إجمالي العهد" : "Total Custodies", value: formatCurrency(totalAmount) },
                { label: locale === 'ar' ? "الرصيد النشط" : "Active Balance", value: formatCurrency(totalActive) },
                { label: locale === 'ar' ? "عدد العهد" : "Count", value: String(data.length) },
            ],
            branchName: user?.branchName,
            branchFlag: user?.branchFlag,
        });
        openPrintWindow(html);
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "عهد مصاريف الشركة" : "Company Expense Custodies"}>
            <div className="space-y-8 pb-10">
                {/* Header with Export */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">{locale === 'ar' ? 'عهد مصاريف الشركة' : 'Company Expense Custodies'}</h2>
                    {canExport && (
                        <ExportButton
                            onExportExcel={handleExportExcel}
                            onExportPDF={handleExportPDF}
                            label={locale === 'ar' ? "تصدير مصاريف الشركة" : "Export Company Expenses"}
                        />
                    )}
                </div>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold">{locale === 'ar' ? 'إجمالي العهد النشطة' : 'Total Active Custodies'}</p>
                                <p className="text-xl font-black text-gray-900">{totalActive.toLocaleString('en-US')} <span className="text-xs font-bold text-gray-400"><CurrencyDisplay /></span></p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold">{locale === 'ar' ? 'مغلقة' : 'Closed'}</p>
                                <p className="text-xl font-black text-gray-900">{closed.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold">{locale === 'ar' ? 'مرفوضة' : 'Rejected'}</p>
                                <p className="text-xl font-black text-gray-900">{rejected.length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Issue Form (ADMIN and ACCOUNTANT) */}
                {(role === "ADMIN" || role === "GLOBAL_ACCOUNTANT" || role === "ACCOUNTANT") && (
                    <div>
                        {!showForm ? (
                            <Button onClick={() => setShowForm(true)} className="bg-[#102550] hover:bg-[#0d1d40] text-white">
                                <Plus className="w-4 h-4 ml-2" /> {locale === 'ar' ? 'صرف عهدة مصاريف شركة' : 'Issue Company Expense Custody'}
                            </Button>
                        ) : (
                            <Card className="p-6 border-blue-200 bg-blue-50/30">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    {locale === 'ar' ? 'صرف عهدة مصاريف الشركة' : 'Issue Company Expense Custody'}
                                </h3>
                                <form action={formAction} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'ar' ? 'المحاسب المستلم' : 'Receiving Accountant'}</label>
                                        <select name="employeeId" required
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                                            <option value="">{locale === 'ar' ? 'اختر المحاسب...' : 'Select Accountant...'}</option>
                                            {accountants.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'ar' ? 'المبلغ' : 'Amount'}</label>
                                            <input type="number" name="amount" step="0.01" min="1" required
                                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder={locale === 'ar' ? "أدخل المبلغ" : "Enter amount"} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                                            <select name="method" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                                                <option value="CASH">{locale === 'ar' ? 'نقداً' : 'Cash'}</option>
                                                <option value="BANK">{locale === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                                        <textarea name="note" rows={2}
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder={locale === 'ar' ? "الغرض من العهدة..." : "Purpose of the custody..."} />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            {isPending ? (locale === 'ar' ? "جاري..." : "Processing...") : (locale === 'ar' ? "صرف العهدة" : "Issue Custody")}
                                        </Button>
                                        <Button type="button" onClick={() => setShowForm(false)} variant="secondary">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>
                )}

                {/* Active Custodies */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[#102550]" /> {locale === 'ar' ? 'العهد النشطة' : 'Active Custodies'}
                    </h2>
                    {active.length === 0 ? (
                        <Card className="p-8 text-center bg-gray-50 border-dashed">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">{locale === 'ar' ? 'لا توجد عهد مصاريف شركة نشطة' : 'No active company expense custodies'}</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {active.map(c => (
                                <Card key={c.id} className="p-5 hover:border-blue-200 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                                                <User className="w-3 h-3" /> {c.employee.name}
                                            </p>
                                            <h3 className="text-xl font-black text-gray-900">
                                                {c.balance.toLocaleString('en-US')} <span className="text-xs text-gray-400 font-bold"><CurrencyDisplay /></span>
                                            </h3>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${c.isConfirmed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {c.isConfirmed ? (locale === 'ar' ? 'مؤكدة' : 'Confirmed') : (locale === 'ar' ? 'بانتظار التأكيد' : 'Pending')}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date(c.createdAt).toLocaleDateString('en-GB')}</span>
                                        </div>
                                        {c.note && <p className="text-xs text-gray-500 line-clamp-2">{c.note}</p>}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end gap-2">
                                        {canReturn && (
                                            <Button 
                                                onClick={() => setReturnModal({ id: c.id, balance: c.balance })} 
                                                variant="outline" 
                                                className="h-8 text-xs font-bold border-gray-200"
                                            >
                                                {locale === 'ar' ? 'تسجيل مرتجع' : 'Record Return'}
                                            </Button>
                                        )}
                                        <a href={`/api/vouchers/${c.id}`} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-[#102550] border border-[#102550]/20 hover:bg-blue-50 rounded-xl transition-colors">
                                            <FileOutput className="w-3.5 h-3.5" /> {locale === 'ar' ? 'سند الصرف' : 'Voucher'}
                                        </a>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Rejected Custodies */}
                {rejected.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" /> {locale === 'ar' ? 'العهد المرفوضة' : 'Rejected Custodies'}
                        </h2>
                        <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-red-50/50 text-gray-500 font-semibold border-b border-red-100">
                                        <tr>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'المستلم' : 'Recipient'}</th>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</th>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-50">
                                        {rejected.map(c => (
                                            <tr key={c.id} className="hover:bg-red-50/30">
                                                <td className="px-4 py-3 font-semibold">{c.employee.name}</td>
                                                <td className="px-4 py-3 font-bold">{c.amount.toLocaleString('en-US')} <span className="text-[10px]"><CurrencyDisplay /></span></td>
                                                <td className="px-4 py-3 text-red-600 text-xs">{c.rejectedReason || '—'}</td>
                                                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* Closed Custodies */}
                {closed.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-gray-500" /> {locale === 'ar' ? 'العهد المغلقة' : 'Closed Custodies'}
                        </h2>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'المستلم' : 'Recipient'}</th>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                                            <th className="px-4 py-3">{locale === 'ar' ? 'السند' : 'Voucher'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {closed.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 font-semibold">{c.employee.name}</td>
                                                <td className="px-4 py-3 font-bold">{c.amount.toLocaleString('en-US')} <span className="text-[10px]"><CurrencyDisplay /></span></td>
                                                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                                                <td className="px-4 py-3">
                                                    <a href={`/api/vouchers/${c.id}`} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#102550] hover:underline">
                                                        <FileOutput className="w-3 h-3" /> {locale === 'ar' ? 'عرض' : 'View'}
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Return Modal Overlay */}
            {returnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md p-6 bg-white shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                            {locale === 'ar' ? 'تسجيل مرتجع مصاريف' : 'Record Expenses Return'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {locale === 'ar' ? 'الرصيد المتبقي للعهدة:' : 'Remaining custody balance:'} <strong className="text-gray-900">{returnModal.balance.toLocaleString('en-US')} <CurrencyDisplay /></strong>
                        </p>
                        <form onSubmit={handleReturn} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'ar' ? 'مبلغ المرتجع' : 'Return Amount'}</label>
                                <input type="number" name="amount" step="0.01" min="1" max={returnModal.balance} required
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    placeholder={locale === 'ar' ? "أدخل المبلغ المسترجع" : "Enter returned amount"} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{locale === 'ar' ? 'ملاحظات والتفاصيل' : 'Notes & Details'}</label>
                                <textarea name="note" rows={2} required
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none"
                                    placeholder={locale === 'ar' ? "مثال: فواتير بقيمة ٢٥٠٠ ومرتجع نقدي ٥٠٠" : "E.g: Invoices for 2500 and cash return 500"} />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setReturnModal(null)}>
                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button type="submit" disabled={isReturning} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isReturning ? (locale === 'ar' ? "جاري الحفظ..." : "Processing...") : (locale === 'ar' ? "تأكيد المرتجع" : "Confirm Return")}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
