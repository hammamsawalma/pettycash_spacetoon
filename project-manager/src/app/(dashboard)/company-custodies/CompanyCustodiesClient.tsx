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

export default function CompanyCustodiesClient({ custodies, role }: { custodies: CompanyCustodyData[]; role: string }) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
        const res = await issueCompanyCustody(prev, formData);
        if (res?.error) {
            toast.error(res.error);
            return res;
        }
        toast.success("تم صرف عهدة مصاريف الشركة بنجاح ✅");
        setShowForm(false);
        router.refresh();
        return res;
    }, null);

    const active = custodies.filter(c => c.status !== 'REJECTED' && !c.isClosed);
    const closed = custodies.filter(c => c.isClosed && c.status !== 'REJECTED');
    const rejected = custodies.filter(c => c.status === 'REJECTED');
    const totalActive = active.reduce((sum, c) => sum + c.balance, 0);
    const canExport = useCanDo('exports', 'view');

    const compColumns: ExportColumn[] = [
        { key: "employeeName", label: "المستلم" },
        { key: "amount", label: "المبلغ", format: (v) => formatCurrency(v as number) },
        { key: "balance", label: "المتبقي", format: (v) => formatCurrency(v as number) },
        { key: "method", label: "طريقة الدفع" },
        { key: "status", label: "الحالة" },
        { key: "note", label: "ملاحظة" },
        { key: "createdAt", label: "التاريخ", format: (v) => formatDate(v as string) },
    ];

    const handleExportExcel = async () => {
        const data = await getCustodiesExportData("company");
        downloadExcel([{ name: "مصاريف الشركة", columns: compColumns, data: data as Record<string, unknown>[] }], "تقرير_مصاريف_الشركة");
    };

    const handleExportPDF = async () => {
        const data = await getCustodiesExportData("company");
        const totalAmount = data.reduce((s, d) => s + d.amount, 0);
        const html = generatePrintableReport({
            title: "تقرير عهد مصاريف الشركة",
            subtitle: "عهد مصاريف الشركة العامة",
            columns: compColumns,
            data: data as Record<string, unknown>[],
            summary: [
                { label: "إجمالي العهد", value: formatCurrency(totalAmount) },
                { label: "الرصيد النشط", value: formatCurrency(totalActive) },
                { label: "عدد العهد", value: String(data.length) },
            ],
        });
        openPrintWindow(html);
    };

    return (
        <DashboardLayout title="عهد مصاريف الشركة">
            <div className="space-y-8 pb-10">
                {/* Header with Export */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">عهد مصاريف الشركة</h2>
                    {canExport && (
                        <ExportButton
                            onExportExcel={handleExportExcel}
                            onExportPDF={handleExportPDF}
                            label="تصدير مصاريف الشركة"
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
                                <p className="text-xs text-gray-500 font-bold">إجمالي العهد النشطة</p>
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
                                <p className="text-xs text-gray-500 font-bold">مغلقة</p>
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
                                <p className="text-xs text-gray-500 font-bold">مرفوضة</p>
                                <p className="text-xl font-black text-gray-900">{rejected.length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Issue Form (ADMIN only) */}
                {role === "ADMIN" && (
                    <div>
                        {!showForm ? (
                            <Button onClick={() => setShowForm(true)} className="bg-[#102550] hover:bg-[#0d1d40] text-white">
                                <Plus className="w-4 h-4 ml-2" /> صرف عهدة مصاريف شركة
                            </Button>
                        ) : (
                            <Card className="p-6 border-blue-200 bg-blue-50/30">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    صرف عهدة مصاريف الشركة
                                </h3>
                                <form action={formAction} className="space-y-4">
                                    <input type="hidden" name="employeeId" value="" id="company-custody-employee" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ</label>
                                            <input type="number" name="amount" step="0.01" min="1" required
                                                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="أدخل المبلغ" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">طريقة الدفع</label>
                                            <select name="method" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                                                <option value="CASH">نقداً</option>
                                                <option value="BANK">تحويل بنكي</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
                                        <textarea name="note" rows={2}
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="الغرض من العهدة..." />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            {isPending ? "جاري..." : "صرف العهدة"}
                                        </Button>
                                        <Button type="button" onClick={() => setShowForm(false)} variant="secondary">إلغاء</Button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>
                )}

                {/* Active Custodies */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[#102550]" /> العهد النشطة
                    </h2>
                    {active.length === 0 ? (
                        <Card className="p-8 text-center bg-gray-50 border-dashed">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">لا توجد عهد مصاريف شركة نشطة</p>
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
                                            {c.isConfirmed ? 'مؤكدة' : 'بانتظار التأكيد'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{new Date(c.createdAt).toLocaleDateString('en-GB')}</span>
                                        </div>
                                        {c.note && <p className="text-xs text-gray-500 line-clamp-2">{c.note}</p>}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                                        <a href={`/api/vouchers/${c.id}`} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-[#102550] border border-[#102550]/20 hover:bg-blue-50 rounded-xl transition-colors">
                                            <FileOutput className="w-3.5 h-3.5" /> سند الصرف
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
                            <AlertTriangle className="w-5 h-5 text-red-500" /> العهد المرفوضة
                        </h2>
                        <div className="bg-white rounded-2xl border border-red-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-red-50/50 text-gray-500 font-semibold border-b border-red-100">
                                        <tr>
                                            <th className="px-4 py-3">المستلم</th>
                                            <th className="px-4 py-3">المبلغ</th>
                                            <th className="px-4 py-3">سبب الرفض</th>
                                            <th className="px-4 py-3">التاريخ</th>
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
                            <CheckCircle className="w-5 h-5 text-gray-500" /> العهد المغلقة
                        </h2>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3">المستلم</th>
                                            <th className="px-4 py-3">المبلغ</th>
                                            <th className="px-4 py-3">التاريخ</th>
                                            <th className="px-4 py-3">السند</th>
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
                                                        <FileOutput className="w-3 h-3" /> عرض
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
        </DashboardLayout>
    );
}
