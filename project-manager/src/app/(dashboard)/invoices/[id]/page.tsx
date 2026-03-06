"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { Download, FileText, CheckCircle, Printer, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState, use } from "react";
import { getInvoiceById, updateInvoiceStatus } from "@/actions/invoices";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type InvoiceItem = {
    id: string;
    name: string;
    itemNumber: string | null;
    description: string | null;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number;
};

type FullInvoice = {
    id: string;
    reference: string;
    amount: number;
    status: string;
    date: Date;
    notes: string | null;
    filePath: string | null;
    paymentSource: string;
    rejectionReason: string | null;
    approvedBy: string | null;     // I10: audit trail
    approvedAt: Date | null;
    rejectedBy: string | null;
    rejectedAt: Date | null;
    project: { id: string; name: string } | null;
    creator: { name: string; id: string };
    category: { name: string; icon: string | null } | null;
    items: InvoiceItem[];
    custody: { employee: { name: string } } | null;
    // I9: packed project role for the current viewer (injected client-side after fetch)
    viewerProjectRole?: string | null;
};

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { role, user } = useAuth();
    const router = useRouter();
    // Admins who can settle debts are the ones who need to see the personal-expense warning
    const canViewDebtWarning = useCanDo('debts', 'settle');


    const [invoice, setInvoice] = useState<FullInvoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const REJECTION_PRESETS = [
        { id: "unclear_image", label: "الصورة المرفقة غير واضحة أو تالفة", icon: "🖼️" },
        { id: "missing_docs", label: "نقص في المستندات المطلوبة", icon: "📄" },
        { id: "amount_mismatch", label: "المبالغ لا تتطابق مع التنسيقات", icon: "🔢" },
        { id: "no_stamp", label: "الفاتورة غير مختومة أو غير رسمية", icon: "🔖" },
        { id: "no_approval", label: "المصروف لم يُعتمد مسبقاً", icon: "📋" },
        { id: "wrong_project", label: "تم تحميلها على المشروع الخطأ", icon: "📁" },
        { id: "duplicate", label: "فاتورة مكررة (تم صرفها مسبقاً)", icon: "🔁" },
        { id: "custom", label: "سبب آخر", icon: "✏️" },
    ];

    const handlePresetSelect = (preset: typeof REJECTION_PRESETS[0]) => {
        setSelectedPreset(preset.id);
        if (preset.id === "custom") {
            setRejectionReason("");
        } else {
            setRejectionReason(preset.label);
        }
    };

    const handleCloseRejectModal = () => {
        setIsRejectModalOpen(false);
        setSelectedPreset(null);
        setRejectionReason("");
    };

    useEffect(() => {
        getInvoiceById(id).then(data => {
            setInvoice(data as unknown as FullInvoice);
            setIsLoading(false);
        });
    }, [id]);

    // I4: Re-open handler — transitions APPROVED or REJECTED back to PENDING
    const handleReopen = async () => {
        if (!confirm("هل تريد إعادة الفاتورة إلى حالة مراجعة (معلقة)؟")) return;
        setIsUpdating(true);
        const res = await updateInvoiceStatus(id, "PENDING");
        setIsUpdating(false);
        if (res?.error) toast.error(res.error);
        else {
            toast.success("تمت إعادة الفاتورة إلى قائمة المراجعة");
            window.location.reload();
        }
    };

    const handleApprove = async () => {
        if (!confirm("هل أنت متأكد من اعتماد وصرف هذه الفاتورة؟")) return;
        setIsUpdating(true);
        const res = await updateInvoiceStatus(id, "APPROVED");
        setIsUpdating(false);
        if (res?.error) toast.error(res.error);
        else {
            toast.success("تم اعتماد الفاتورة بنجاح");
            window.location.reload();
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("سبب الرفض إجباري");
            return;
        }
        setIsUpdating(true);
        const res = await updateInvoiceStatus(id, "REJECTED", rejectionReason);
        setIsUpdating(false);
        if (res?.error) toast.error(res.error);
        else {
            toast.success("تم رفض الفاتورة وإرسال السبب للموظف");
            handleCloseRejectModal();
            window.location.reload();
        }
    };

    if (isLoading) return <DashboardLayout title="تفاصيل الفاتورة"><div className="p-10 text-center">جاري التحميل...</div></DashboardLayout>;
    if (!invoice) return <DashboardLayout title="خطأ"><div className="p-10 text-center text-red-500">الفاتورة غير موجودة</div></DashboardLayout>;

    // I8: GM is view-only — removed from canReview
    // I9: Also allow PROJECT_ACCOUNTANT (role=USER but has project accountant role)
    // Since project role info isn't in the user object, we check if the user
    // is neither the creator, is not GM, and is either a global finance role OR
    // has been marked as a project accountant (the backend will enforce authz either way)
    const isGlobalApprover = role === "ADMIN" || role === "GLOBAL_ACCOUNTANT";
    const canReview = isGlobalApprover && invoice.status === "PENDING" && invoice.creator.id !== user?.id;
    // PROJECT_ACCOUNTANT: role=USER without being the creator — backend will validate actual project role
    const isProjectAccountant = role === "USER" && invoice.creator.id !== user?.id;
    const canReviewAsProjectAccountant = isProjectAccountant && invoice.status === "PENDING";
    // I4: Re-open capability — available to same set as canReview
    const canReopen = (isGlobalApprover || isProjectAccountant) &&
        (invoice.status === "APPROVED" || invoice.status === "REJECTED") &&
        invoice.creator.id !== user?.id;

    return (
        <DashboardLayout title={`تفاصيل الفاتورة #${invoice.reference}`}>
            <div className="flex flex-col lg:flex-row gap-6 relative" dir="rtl">

                {/* Main Invoice Card */}
                <Card className="flex-1 p-5 md:p-8 space-y-6 md:space-y-8">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">فاتورة مشتريات #{invoice.reference}</h2>
                            <p className="text-gray-500 mt-2 text-sm">أُضيفت في {new Date(invoice.date).toLocaleDateString('en-GB')} بواسطة {invoice.creator.name}</p>
                        </div>
                        <StatusBadge status={invoice.status} />
                    </div>

                    {invoice.status === "REJECTED" && invoice.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-800 font-bold text-sm">سبب رفض الفاتورة:</h4>
                                <p className="text-red-600 text-sm mt-1 leading-relaxed">{invoice.rejectionReason}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">المشروع</h3>
                            <p className="font-bold text-base md:text-lg text-[#7F56D9]">{invoice.project?.name || "مشروع عام"}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">جهة الدفع</h3>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${invoice.paymentSource === 'PERSONAL' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {invoice.paymentSource === 'PERSONAL' ? 'شخصي (من الجيب)' : 'من العهدة'}
                                </span>
                                {invoice.paymentSource === 'PERSONAL' && <span className="text-xs text-orange-600">(تُحسب كدين)</span>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">التصنيف</h3>
                            <p className="font-bold text-gray-800 flex items-center gap-2">
                                {invoice.category ? <>{invoice.category.icon} {invoice.category.name}</> : "غير مصنف"}
                            </p>
                        </div>
                    </div>

                    {/* Financial Warning for Admins */}
                    {canViewDebtWarning && invoice.status === "APPROVED" && invoice.paymentSource === "PERSONAL" && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-orange-800 text-sm font-medium">
                            ⚠️ تم اعتماد الفاتورة كمصروف شخصي. يجب تسوية الدين للموظف عبر قسم الديون.
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">التنسيقات (بنود الفاتورة)</h3>
                        {invoice.items.length === 0 ? (
                            <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-500 text-sm border border-gray-100 border-dashed">
                                لم يتم إدراج بنود وتنسيقات مفصلة. الفاتورة مسجلة كمبلغ إجمالي واحد.
                                <div className="mt-4 text-2xl font-bold text-gray-900">{invoice.amount.toLocaleString("en-GB")} <span className="text-sm text-gray-500">QAR</span></div>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                        <tr>
                                            <th className="p-3 text-right">#</th>
                                            <th className="p-3 text-right">البند / السلعة</th>
                                            <th className="p-3 text-center">الكمية</th>
                                            <th className="p-3 text-left">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.items.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="p-3 text-gray-500 w-10">{idx + 1}</td>
                                                <td className="p-3 font-medium text-gray-800">
                                                    {item.name}
                                                    {item.itemNumber && <span className="block text-xs text-gray-400 mt-0.5">كود: {item.itemNumber}</span>}
                                                </td>
                                                <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                                                <td className="p-3 text-left font-bold text-purple-700">{item.totalPrice.toLocaleString("en-GB")} ﷼</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-purple-50/50 border-t border-purple-100">
                                        <tr>
                                            <td colSpan={3} className="p-4 text-left font-bold text-gray-700">الإجمالي الكلي:</td>
                                            <td className="p-4 text-left font-bold text-xl text-purple-800">{invoice.amount.toLocaleString("en-GB")} ﷼</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {invoice.notes && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">ملاحظات عامة</h3>
                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed text-sm border border-gray-100">
                                {invoice.notes}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">صورة الفاتورة المرفقة</h3>
                        {invoice.filePath ? (
                            <div className="flex gap-4">
                                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition w-full md:w-auto pr-6 group">
                                    <FileText className="w-8 h-8 text-red-500" />
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm" dir="ltr">{invoice.filePath.split('/').pop()}</p>
                                        <p className="text-xs text-gray-500">مرفق معتمد</p>
                                    </div>
                                    <a href={invoice.filePath} target="_blank" download className="mr-auto text-gray-400 hover:text-[#7F56D9] bg-white p-2 border border-gray-100 rounded-md shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition">
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">لا يوجد مرفقات</p>
                        )}
                    </div>
                </Card>

                {/* Accountant / Actions Sidebar */}
                <div className="w-full lg:w-80 space-y-4">
                    {/* Approve/Reject panel — PENDING invoices only */}
                    {(canReview || canReviewAsProjectAccountant) && (
                        <Card className="p-5 space-y-3 bg-purple-50/50 border-purple-100 shadow-md">
                            <h3 className="font-bold text-purple-900 flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-purple-600" />
                                مراجعة المحاسب
                            </h3>
                            <p className="text-xs text-purple-700 leading-relaxed mb-4">هذه الفاتورة تتطلب تدقيق واعتماد قبل أن تُخصم من الرصيد.</p>

                            <Button onClick={handleApprove} disabled={isUpdating} variant="primary" className="w-full gap-2 bg-green-600 hover:bg-green-700 py-3 shadow-sm font-bold border-green-700">
                                <CheckCircle className="w-5 h-5" />
                                اعتماد وتأكيد
                            </Button>
                            <Button onClick={() => { setIsRejectModalOpen(true); setSelectedPreset(null); setRejectionReason(""); }} disabled={isUpdating} variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 py-3 font-bold bg-white">
                                <XCircle className="w-5 h-5" />
                                رفض الفاتورة
                            </Button>
                        </Card>
                    )}

                    {/* I4: Re-open panel — APPROVED or REJECTED invoices */}
                    {canReopen && (
                        <Card className="p-5 space-y-3 bg-amber-50/50 border-amber-100 shadow-md">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                إعادة المراجعة
                            </h3>
                            <p className="text-xs text-amber-700 leading-relaxed mb-4">يمكنك إعادة الفاتورة إلى قائمة المراجعة لتصحيحها أو إعادة تقييمها.</p>
                            <Button onClick={handleReopen} disabled={isUpdating} variant="outline" className="w-full gap-2 text-amber-700 border-amber-300 hover:bg-amber-50 py-3 font-bold bg-white">
                                <AlertTriangle className="w-5 h-5" />
                                إعادة فتح للمراجعة
                            </Button>
                        </Card>
                    )}

                    <Card className="p-6 space-y-3 flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="w-full gap-2 py-3 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            onClick={() => window.print()}
                        >
                            <Printer className="w-5 h-5 text-gray-400" />
                            طباعة الإيصال
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-2 py-3 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                                const prev = document.title;
                                document.title = `فاتورة-${invoice.reference ?? invoice.id}`;
                                window.print();
                                document.title = prev;
                            }}
                        >
                            <Download className="w-5 h-5 text-gray-400" />
                            تحميل نسخة PDF
                        </Button>
                    </Card>
                </div>

                {/* Rejection Modal */}
                {isRejectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center gap-3 text-red-600 mb-4 border-b border-gray-100 pb-3">
                                <AlertTriangle className="w-6 h-6" />
                                <h3 className="text-lg font-bold">رفض الفاتورة</h3>
                            </div>

                            <div className="space-y-5">
                                <p className="text-gray-600 text-sm leading-relaxed">اختر سبباً من الأسباب الشائعة أو اكتب سبباً مخصصاً. سيصل السبب للموظف مباشرة.</p>

                                {/* Preset Reasons */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 block">أسباب شائعة — اختر واحداً</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {REJECTION_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handlePresetSelect(preset)}
                                                className={`flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${selectedPreset === preset.id
                                                    ? preset.id === 'custom'
                                                        ? 'border-gray-400 bg-gray-50 text-gray-800'
                                                        : 'border-red-400 bg-red-50 text-red-800'
                                                    : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <span className="text-base shrink-0">{preset.icon}</span>
                                                <span className="flex-1">{preset.label}</span>
                                                {selectedPreset === preset.id && (
                                                    <span className="shrink-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text area — shown always so user can edit preset or write custom */}
                                {selectedPreset && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                                            {selectedPreset === 'custom' ? 'اكتب السبب المخصص *' : 'السبب (يمكنك التعديل) *'}
                                        </label>
                                        <textarea
                                            rows={3}
                                            autoFocus
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                            placeholder={selectedPreset === 'custom' ? 'اكتب سبب الرفض بالتفصيل...' : ''}
                                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-400 outline-none resize-none text-sm"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={handleReject}
                                        disabled={isUpdating || !rejectionReason.trim() || !selectedPreset}
                                        variant="primary"
                                        className="flex-1 bg-red-600 hover:bg-red-700 border-red-700 py-3"
                                    >
                                        {isUpdating ? "جاري الرفض..." : "تأكيد الرفض والإرسال"}
                                    </Button>
                                    <Button onClick={handleCloseRejectModal} disabled={isUpdating} variant="outline" className="flex-1 py-3 text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100">
                                        إلغاء
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
