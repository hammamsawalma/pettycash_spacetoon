"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { confirmCustodyReceipt, rejectCustody, returnCustodyBalance } from "@/actions/custody";
import { getUserSignature, saveUserSignature } from "@/actions/employees";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle, XCircle, Wallet, Clock, Check, Briefcase, FileText, ArrowDownLeft, Pen, FileOutput } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { SignaturePad } from "@/components/ui/SignaturePad";

interface CustodyData {
    id: string;
    amount: number;
    balance: number;
    method: string;
    isConfirmed: boolean;
    isClosed: boolean;
    createdAt: Date;
    note: string | null;
    project: {
        id: string;
        name: string;
        manager: { name: string } | null;
    };
}

export default function MyCustodiesClient({ custodies }: { custodies: CustodyData[] }) {
    const router = useRouter();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState<string>("");
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    // Custody Return Modal State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnCustody, setReturnCustody] = useState<CustodyData | null>(null);
    const [returnAmount, setReturnAmount] = useState("");
    const [returnNote, setReturnNote] = useState("");
    const [isReturning, setIsReturning] = useState(false);

    // v5: Signature modal for confirmation
    const [signingCustodyId, setSigningCustodyId] = useState<string | null>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [userSavedSignature, setUserSavedSignature] = useState<string | null>(null);

    // v5: Load saved signature on mount
    useEffect(() => {
        getUserSignature().then(sig => setUserSavedSignature(sig));
    }, []);

    const handleConfirm = async (id: string) => {
        if (!signatureData) {
            toast.error("يرجى التوقيع أولاً");
            return;
        }
        setActionLoading(id);
        const res = await confirmCustodyReceipt(id, signatureData || undefined);
        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("تم تأكيد الاستلام بنجاح ✅");
            setSigningCustodyId(null);
            setSignatureData(null);
            router.refresh();
        }
        setActionLoading(null);
    };

    const handleReject = async (id: string) => {
        if (!rejectReason.trim()) {
            toast.error("يرجى إدخال سبب الرفض");
            return;
        }
        setActionLoading(id);
        const res = await rejectCustody(id, rejectReason);
        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("تم رفض العهدة وإعادتها للمشروع بنجاح ❌");
            setRejectingId(null);
            setRejectReason("");
            router.refresh();
        }
        setActionLoading(null);
    };

    const handleCustodyReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnCustody || !returnAmount || Number(returnAmount) <= 0) {
            toast.error("المبلغ يجب أن يكون أكبر من صفر");
            return;
        }
        if (Number(returnAmount) > returnCustody.balance) {
            toast.error(`المبلغ أكبر من رصيد العهدة (${returnCustody.balance.toLocaleString()} ريال)`);
            return;
        }
        setIsReturning(true);
        const res = await returnCustodyBalance(returnCustody.id, Number(returnAmount), returnNote || undefined);
        setIsReturning(false);
        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("تم تسجيل إرجاع العهدة ✅");
            setShowReturnModal(false);
            setReturnAmount("");
            setReturnNote("");
            setReturnCustody(null);
            router.refresh();
        }
    };

    const unconfirmed = custodies.filter(c => !c.isConfirmed && !c.isClosed);
    const active = custodies.filter(c => c.isConfirmed && !c.isClosed);
    const closed = custodies.filter(c => c.isClosed);

    return (
        <DashboardLayout title="إدارة عهدي">
            <div className="space-y-8 pb-10">

                {/* 1. Pending Custodies Section */}
                {unconfirmed.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">عهد بانتظار التأكيد</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {unconfirmed.map(custody => (
                                <Card key={custody.id} className="p-5 border-amber-200 bg-amber-50/30 flex flex-col relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full -z-10" />

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-semibold text-amber-700 mb-1">{custody.project.name}</p>
                                            <h3 className="text-2xl font-black text-gray-900 drop-shadow-sm">
                                                {custody.amount.toLocaleString()} <span className="text-sm text-gray-500 font-bold"><CurrencyDisplay /></span>
                                            </h3>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl shadow-sm border border-amber-100">
                                            <Wallet className="w-6 h-6 text-amber-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                            <span>المرسِل: <span className="font-semibold">{custody.project.manager?.name || "مدير النظام"}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            <span>التاريخ: <span className="font-semibold">{new Date(custody.createdAt).toLocaleDateString('en-GB')}</span></span>
                                        </div>
                                        {custody.note && (
                                            <div className="flex items-start gap-2 text-xs text-gray-600 bg-white/50 p-2 rounded-lg border border-amber-100">
                                                <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                                <p className="line-clamp-2">{custody.note}</p>
                                            </div>
                                        )}
                                    </div>

                                    {rejectingId === custody.id ? (
                                        <div className="mt-auto space-y-3 bg-white p-3 rounded-xl border border-red-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                            <textarea
                                                placeholder="سبب الرفض (إجباري)..."
                                                className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none h-16"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleReject(custody.id)}
                                                    disabled={actionLoading === custody.id}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-8 font-bold rounded-lg"
                                                >
                                                    {actionLoading === custody.id ? "جاري..." : "تأكيد الرفض"}
                                                </Button>
                                                <Button
                                                    onClick={() => setRejectingId(null)}
                                                    disabled={actionLoading === custody.id}
                                                    variant="secondary"
                                                    className="flex-1 text-xs h-8 font-bold rounded-lg border-gray-200"
                                                >
                                                    تراجع
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-auto flex gap-2">
                                            <Button
                                                onClick={() => { setSigningCustodyId(custody.id); setSignatureData(null); }}
                                                disabled={!!actionLoading}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-bold rounded-xl shadow-sm transition-transform active:scale-95"
                                            >
                                                <Pen className="w-4 h-4 ml-1.5" /> توقيع واستلام
                                            </Button>
                                            <Button
                                                onClick={() => setRejectingId(custody.id)}
                                                disabled={!!actionLoading}
                                                variant="secondary"
                                                className="flex-[0.5] bg-red-50 hover:bg-red-100 text-red-600 border-red-200 text-xs h-9 font-bold rounded-xl transition-transform active:scale-95 hover:border-red-300"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Active Custodies Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#102550]/10 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-[#102550]" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">العهد النشطة</h2>
                    </div>

                    {active.length === 0 ? (
                        <Card className="p-8 text-center bg-gray-50 border-dashed border-gray-200">
                            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">لا توجد عهد نشطة حالياً.</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {active.map(custody => {
                                const spentPercentage = Math.min(((custody.amount - custody.balance) / custody.amount) * 100, 100);
                                return (
                                    <Card key={custody.id} className="p-5 hover:border-[#102550]/30 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 mb-0.5">{custody.project.name}</p>
                                                <h3 className="text-xl font-black text-gray-900 group-hover:text-[#102550] transition-colors line-clamp-1">
                                                    المتبقي: {custody.balance.toLocaleString()} <span className="text-xs text-gray-400 font-bold"><CurrencyDisplay /></span>
                                                </h3>
                                            </div>
                                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                                                نشط
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                                                <span>تم صرف: {(custody.amount - custody.balance).toLocaleString()}</span>
                                                <span>الأصل: {custody.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${spentPercentage > 90 ? 'bg-red-500' : spentPercentage > 75 ? 'bg-amber-500' : 'bg-[#102550]'
                                                        }`}
                                                    style={{ width: `${spentPercentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span>تاريخ الاستلام: <span className="font-semibold">{new Date(custody.createdAt).toLocaleDateString('en-GB')}</span></span>
                                            </div>
                                            {custody.note && (
                                                <div className="flex items-start gap-2 text-xs text-gray-600">
                                                    <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                                    <p className="line-clamp-1 text-gray-500" title={custody.note}>{custody.note}</p>
                                                </div>
                                            )}
                                        </div>

                                        {custody.balance > 0 && (
                                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end gap-2">
                                                <a
                                                    href={`/api/vouchers/${custody.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-[#102550] border border-[#102550]/20 hover:bg-blue-50 rounded-xl transition-colors"
                                                >
                                                    <FileOutput className="w-3.5 h-3.5" />
                                                    سند الصرف
                                                </a>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => { setReturnCustody(custody); setShowReturnModal(true); }}
                                                    className="gap-2 h-8 px-3 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                                                >
                                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                                    إرجاع كاش ({custody.balance.toLocaleString()} ر)
                                                </Button>
                                            </div>
                                        )}
                                        {custody.balance <= 0 && (
                                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                                                <a
                                                    href={`/api/vouchers/${custody.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-[#102550] border border-[#102550]/20 hover:bg-blue-50 rounded-xl transition-colors"
                                                >
                                                    <FileOutput className="w-3.5 h-3.5" />
                                                    سند الصرف
                                                </a>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 3. Closed Custodies History Section (Optional, nice to have) */}
                {closed.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Check className="w-4 h-4 text-gray-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">سجل العهد المغلقة</h2>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3">المشروع</th>
                                            <th className="px-4 py-3">قيمة العهدة</th>
                                            <th className="px-4 py-3">تاريخ الصرف</th>
                                            <th className="px-4 py-3">الحالة</th>
                                            <th className="px-4 py-3">السند</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {closed.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-gray-900">{c.project.name}</td>
                                                <td className="px-4 py-3 font-bold text-gray-600">{c.amount.toLocaleString()} <span className="text-[10px]"><CurrencyDisplay /></span></td>
                                                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600">
                                                        مغلقة
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
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
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* v5: Signature Modal */}
                {signingCustodyId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Pen className="w-5 h-5 text-emerald-600" />
                                توقيع استلام العهدة
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">يرجى التوقيع أدناه لتأكيد استلام العهدة.</p>
                            <SignaturePad
                                label="وقّع هنا"
                                savedSignature={userSavedSignature}
                                onSave={(dataUrl) => {
                                    setSignatureData(dataUrl);
                                    // v5: Save for future reuse if not already saved
                                    if (!userSavedSignature) {
                                        saveUserSignature(dataUrl).then(() => setUserSavedSignature(dataUrl));
                                    }
                                }}
                            />
                            {signatureData && (
                                <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100 text-xs text-green-700 font-bold text-center">
                                    ✅ تم حفظ التوقيع
                                </div>
                            )}
                            <div className="flex gap-3 mt-4">
                                <Button
                                    onClick={() => handleConfirm(signingCustodyId)}
                                    disabled={!signatureData || actionLoading === signingCustodyId}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-bold"
                                >
                                    {actionLoading === signingCustodyId ? "جاري..." : "تأكيد الاستلام"}
                                </Button>
                                <Button
                                    onClick={() => { setSigningCustodyId(null); setSignatureData(null); }}
                                    variant="outline"
                                    className="flex-1 py-3 text-gray-700"
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
