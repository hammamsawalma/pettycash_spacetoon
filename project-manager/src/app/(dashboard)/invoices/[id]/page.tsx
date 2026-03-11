"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCanDo } from "@/components/auth/Protect";
import { Download, FileText, CheckCircle, Printer, XCircle, AlertTriangle, Sparkles, Loader2, Trash2 } from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useEffect, useState, use } from "react";
import { getInvoiceById, updateInvoiceStatus, softDeleteInvoice } from "@/actions/invoices";
import { getCategories } from "@/actions/categories";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UserRole } from "@/context/AuthContext";
import { AnimatedCheckmark } from "@/components/ui/AnimatedCheckmark";

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
    const { locale } = useLanguage();
    const router = useRouter();
    // Only GLOBAL_ACCOUNTANT can settle debts (v3 rule)
    const canViewDebtWarning = useCanDo('debts', 'settle');


    const [invoice, setInvoice] = useState<FullInvoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // v5: Accountant mandatory fields
    const [externalNumber, setExternalNumber] = useState("");
    const [spendDate, setSpendDate] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [categories, setCategories] = useState<{ id: string; name: string; icon: string | null }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const REJECTION_PRESETS = locale === 'ar' ? [
        { id: "unclear_image", label: "الصورة المرفقة غير واضحة أو تالفة", icon: "🖼️" },
        { id: "missing_docs", label: "نقص في المستندات المطلوبة", icon: "📄" },
        { id: "amount_mismatch", label: "المبالغ لا تتطابق مع التنسيقات", icon: "🔢" },
        { id: "no_stamp", label: "الفاتورة غير مختومة أو غير رسمية", icon: "🔖" },
        { id: "no_approval", label: "المصروف لم يُعتمد مسبقاً", icon: "📋" },
        { id: "wrong_project", label: "تم تحميلها على المشروع الخطأ", icon: "📁" },
        { id: "duplicate", label: "فاتورة مكررة (تم صرفها مسبقاً)", icon: "🔁" },
        { id: "custom", label: "سبب آخر", icon: "✏️" },
    ] : [
        { id: "unclear_image", label: "Attached image is unclear or damaged", icon: "🖼️" },
        { id: "missing_docs", label: "Missing required documents", icon: "📄" },
        { id: "amount_mismatch", label: "Amounts do not match the items", icon: "🔢" },
        { id: "no_stamp", label: "Invoice is not stamped or unofficial", icon: "🔖" },
        { id: "no_approval", label: "Expense was not pre-approved", icon: "📋" },
        { id: "wrong_project", label: "Charged to the wrong project", icon: "📁" },
        { id: "duplicate", label: "Duplicate invoice (already paid)", icon: "🔁" },
        { id: "custom", label: "Other reason", icon: "✏️" },
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
            // Pre-fill accountant fields if already set (re-open scenario)
            if (data) {
                const d = data as unknown as FullInvoice & { externalNumber?: string; spendDate?: string; categoryId?: string };
                if (d.externalNumber) setExternalNumber(d.externalNumber);
                if (d.spendDate) setSpendDate(new Date(d.spendDate).toISOString().split('T')[0]);
                if (d.categoryId) setSelectedCategoryId(d.categoryId);
            }
        });
        // Load categories for accountant
        getCategories().then(cats => setCategories(cats as { id: string; name: string; icon: string | null }[]));
    }, [id]);

    // ── Animated checkmark state ────────────────────────────────────────────
    const [showCheckmark, setShowCheckmark] = useState(false);
    const [checkmarkLabel, setCheckmarkLabel] = useState("");

    const showSuccessAndReload = (label: string) => {
        setCheckmarkLabel(label);
        setShowCheckmark(true);
        setTimeout(() => window.location.reload(), 1000);
    };

    // I4: Re-open handler
    const handleReopen = async () => {
        if (!confirm(locale === 'ar' ? "هل تريد إعادة الفاتورة إلى حالة مراجعة (معلقة)؟" : "Do you want to reopen this invoice for review?")) return;
        setIsUpdating(true);
        const res = await updateInvoiceStatus(id, "PENDING");
        setIsUpdating(false);
        if (res?.error) toast.error(res.error);
        else {
            toast.success(locale === 'ar' ? "تمت إعادة الفاتورة إلى قائمة المراجعة" : "Invoice returned to review list");
            showSuccessAndReload(locale === 'ar' ? "تمت الإعادة" : "Reopened");
        }
    };

    const handleApprove = async () => {
        if (!externalNumber.trim()) { toast.error(locale === 'ar' ? "رقم الفاتورة الخارجي إلزامي" : "External invoice number is required"); return; }
        if (!spendDate) { toast.error(locale === 'ar' ? "تاريخ الصرف إلزامي" : "Spend date is required"); return; }
        if (!selectedCategoryId) { toast.error(locale === 'ar' ? "تصنيف المصروف إلزامي" : "Expense category is required"); return; }
        if (!confirm(locale === 'ar' ? "هل أنت متأكد من اعتماد وصرف هذه الفاتورة؟" : "Are you sure you want to approve and disburse this invoice?")) return;
        setIsUpdating(true);
        const res = await updateInvoiceStatus(id, "APPROVED", {
            externalNumber,
            spendDate,
            categoryId: selectedCategoryId,
        });
        setIsUpdating(false);
        if (res?.error) toast.error(res.error);
        else {
            toast.success(locale === 'ar' ? "تم اعتماد الفاتورة بنجاح" : "Invoice approved successfully");
            showSuccessAndReload(locale === 'ar' ? "تم الاعتماد ✅" : "Approved ✅");
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error(locale === 'ar' ? "سبب الرفض إجباري" : "Rejection reason is required");
            return;
        }
        setIsUpdating(true);
        const res = await updateInvoiceStatus(id, "REJECTED", { rejectionReason });
        setIsUpdating(false);
        if (res?.error) toast.error(res.error);
        else {
            toast.success(locale === 'ar' ? "تم رفض الفاتورة وإرسال السبب للموظف" : "Invoice rejected and reason sent to employee");
            handleCloseRejectModal();
            showSuccessAndReload(locale === 'ar' ? "تم الرفض" : "Rejected");
        }
    };

    // v5: AI Analysis handler
    const handleAIAnalysis = async () => {
        if (!invoice?.filePath) { toast.error(locale === 'ar' ? "لا توجد صورة للتحليل" : "No image available for analysis"); return; }
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/ai/analyze-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagePath: invoice.filePath })
            });
            const data = await res.json();
            if (data.error) { toast.error(data.error); }
            else {
                if (data.suggestedNumber) setExternalNumber(data.suggestedNumber);
                if (data.suggestedDate) setSpendDate(data.suggestedDate);
                toast.success(locale === 'ar' ? "تم التحليل — راجع الاقتراحات" : "Analysis complete — review suggestions");
            }
        } catch {
            toast.error(locale === 'ar' ? "فشل التحليل بالذكاء الاصطناعي" : "AI analysis failed");
        }
        setIsAnalyzing(false);
    };

    const handleDelete = async () => {
        if (!confirm(locale === 'ar' ? "هل أنت متأكد من نقل هذه الفاتورة إلى سلة المهملات؟" : "Are you sure you want to move this invoice to trash?")) return;
        setIsDeleting(true);
        const res = await softDeleteInvoice(id);
        setIsDeleting(false);
        if (res?.error) toast.error(res.error);
        else {
            toast.success(locale === 'ar' ? "تم نقل الفاتورة إلى سلة المهملات" : "Invoice moved to trash");
            router.push('/invoices');
        }
    };

    if (isLoading) return <DashboardLayout title={locale === 'ar' ? "تفاصيل الفاتورة" : "Invoice Details"}><div className="p-10 text-center">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div></DashboardLayout>;
    if (!invoice) return <DashboardLayout title={locale === 'ar' ? "خطأ" : "Error"}><div className="p-10 text-center text-red-500">{locale === 'ar' ? 'الفاتورة غير موجودة' : 'Invoice not found'}</div></DashboardLayout>;

    // v4 Rules:
    // - ADMIN does NOT approve invoices
    // - GLOBAL_ACCOUNTANT approves all invoices directly (no project-level accountant)
    // - canReview: only GLOBAL_ACCOUNTANT, and not the creator of the invoice
    const projectId = invoice.project?.id ?? null;
    const isApprover = (role as UserRole) === "GLOBAL_ACCOUNTANT";
    const notTheCreator = invoice.creator.id !== user?.id;
    const canReview = isApprover && notTheCreator && invoice.status === "PENDING";
    // Re-open: same set as approve (GLOBAL_ACCOUNTANT)
    const canReopen = isApprover && notTheCreator &&
        (invoice.status === "APPROVED" || invoice.status === "REJECTED");

    return (
        <DashboardLayout title={locale === 'ar' ? `تفاصيل الفاتورة #${invoice.reference}` : `Invoice Details #${invoice.reference}`}>
            <AnimatedCheckmark show={showCheckmark} label={checkmarkLabel} />
            <div className="flex flex-col lg:flex-row gap-6 relative" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

                {/* Main Invoice Card */}
                <Card className="flex-1 p-5 md:p-8 space-y-6 md:space-y-8">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{locale === 'ar' ? `فاتورة مشتريات #${invoice.reference}` : `Purchase Invoice #${invoice.reference}`}</h2>
                            <p className="text-gray-500 mt-2 text-sm">{locale === 'ar' ? `أُضيفت في ${new Date(invoice.date).toLocaleDateString('en-GB')} بواسطة ${invoice.creator.name}` : `Added on ${new Date(invoice.date).toLocaleDateString('en-GB')} by ${invoice.creator.name}`}</p>
                        </div>
                        <StatusBadge status={invoice.status} />
                    </div>

                    {invoice.status === "REJECTED" && invoice.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-800 font-bold text-sm">{locale === 'ar' ? 'سبب رفض الفاتورة:' : 'Invoice Rejection Reason:'}</h4>
                                <p className="text-red-600 text-sm mt-1 leading-relaxed">{invoice.rejectionReason}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{locale === 'ar' ? 'المشروع' : 'Project'}</h3>
                            <p className="font-bold text-base md:text-lg text-[#102550]">{invoice.project?.name || (locale === 'ar' ? 'مشروع عام' : 'General Project')}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{locale === 'ar' ? 'جهة الدفع' : 'Payment Source'}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${invoice.paymentSource === 'PERSONAL' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {invoice.paymentSource === 'PERSONAL' ? (locale === 'ar' ? 'شخصي (من الجيب)' : 'Personal (Out of pocket)') : (locale === 'ar' ? 'من العهدة' : 'From Custody')}
                                </span>
                                {invoice.paymentSource === 'PERSONAL' && <span className="text-xs text-orange-600">{locale === 'ar' ? '(تُحسب كدين)' : '(Counted as debt)'}</span>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{locale === 'ar' ? 'التصنيف' : 'Category'}</h3>
                            <p className="font-bold text-gray-800 flex items-center gap-2">
                                {invoice.category ? <>{invoice.category.icon} {invoice.category.name}</> : (locale === 'ar' ? 'غير مصنف' : 'Uncategorized')}
                            </p>
                        </div>
                    </div>

                    {/* Financial Warning for Admins */}
                    {canViewDebtWarning && invoice.status === "APPROVED" && invoice.paymentSource === "PERSONAL" && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-orange-800 text-sm font-medium">
                            {locale === 'ar' ? '⚠️ تم اعتماد الفاتورة كمصروف شخصي. يجب تسوية الدين للموظف عبر قسم الديون.' : '⚠️ Invoice approved as personal expense. Debt must be settled via the Debts section.'}
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">{locale === 'ar' ? 'التنسيقات (بنود الفاتورة)' : 'Invoice Items'}</h3>
                        {invoice.items.length === 0 ? (
                            <div className="bg-gray-50 p-6 rounded-xl text-center text-gray-500 text-sm border border-gray-100 border-dashed">
                                {locale === 'ar' ? 'لم يتم إدراج بنود وتنسيقات مفصلة. الفاتورة مسجلة كمبلغ إجمالي واحد.' : 'No detailed items listed. Invoice recorded as a lump sum.'}
                                <div className="mt-4 text-2xl font-bold text-gray-900">{invoice.amount.toLocaleString("en-GB")} <span className="text-sm text-gray-500"><CurrencyDisplay /></span></div>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                                <table className="w-full text-sm min-w-[420px]">
                                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                        <tr>
                                            <th className="p-3 text-right">#</th>
                                            <th className="p-3 text-right">{locale === 'ar' ? 'البند / السلعة' : 'Item'}</th>
                                            <th className="p-3 text-center">{locale === 'ar' ? 'الكمية' : 'Qty'}</th>
                                            <th className="p-3 text-left">{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.items.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="p-3 text-gray-500 w-10">{idx + 1}</td>
                                                <td className="p-3 font-medium text-gray-800">
                                                    {item.name}
                                                    {item.itemNumber && <span className="block text-xs text-gray-400 mt-0.5">{locale === 'ar' ? 'كود:' : 'Code:'} {item.itemNumber}</span>}
                                                </td>
                                                <td className="p-3 text-center text-gray-600">{item.quantity}</td>
                                                <td className="p-3 text-left font-bold text-blue-700">{item.totalPrice.toLocaleString("en-GB")} <CurrencyDisplay /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-blue-50/50 border-t border-blue-100">
                                        <tr>
                                            <td colSpan={3} className="p-4 text-left font-bold text-gray-700">{locale === 'ar' ? 'الإجمالي الكلي:' : 'Grand Total:'}</td>
                                            <td className="p-4 text-left font-bold text-xl text-blue-800">{invoice.amount.toLocaleString("en-GB")} <CurrencyDisplay /></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {invoice.notes && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{locale === 'ar' ? 'ملاحظات عامة' : 'General Notes'}</h3>
                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed text-sm border border-gray-100">
                                {invoice.notes}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">{locale === 'ar' ? 'صورة الفاتورة المرفقة' : 'Attached Invoice Image'}</h3>
                        {invoice.filePath ? (
                            <div className="flex gap-4">
                                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition w-full md:w-auto pr-6 group">
                                    <FileText className="w-8 h-8 text-red-500" />
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm" dir="ltr">{invoice.filePath.split('/').pop()}</p>
                                        <p className="text-xs text-gray-500">{locale === 'ar' ? 'مرفق معتمد' : 'Approved attachment'}</p>
                                    </div>
                                    <a href={invoice.filePath} target="_blank" download className="mr-auto text-gray-400 hover:text-[#102550] bg-white p-2 border border-gray-100 rounded-md shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition">
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">{locale === 'ar' ? 'لا يوجد مرفقات' : 'No attachments'}</p>
                        )}
                    </div>
                </Card>

                {/* Accountant / Actions Sidebar */}
                <div className="w-full lg:w-80 space-y-4">
                    {/* Approve/Reject panel — PENDING invoices only */}
                    {canReview && (
                        <Card className="p-5 space-y-4 bg-blue-50/50 border-blue-100 shadow-md">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                {locale === 'ar' ? 'مراجعة المحاسب' : 'Accountant Review'}
                            </h3>
                            <p className="text-xs text-blue-700 leading-relaxed">{locale === 'ar' ? 'الحقول التالية إلزامية قبل الاعتماد.' : 'The following fields are required before approval.'}</p>

                            {/* v5: Accountant mandatory fields */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1 block">{locale === 'ar' ? 'رقم الفاتورة الخارجي *' : 'External Invoice Number *'}</label>
                                    <input
                                        type="text"
                                        value={externalNumber}
                                        onChange={e => setExternalNumber(e.target.value)}
                                        placeholder={locale === 'ar' ? "رقم الفاتورة الحقيقي" : "Actual invoice number"}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1 block">{locale === 'ar' ? 'تاريخ الصرف *' : 'Spend Date *'}</label>
                                    <input
                                        type="date"
                                        value={spendDate}
                                        onChange={e => setSpendDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 mb-1 block">{locale === 'ar' ? 'تصنيف المصروف *' : 'Expense Category *'}</label>
                                    <select
                                        value={selectedCategoryId}
                                        onChange={e => setSelectedCategoryId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                                    >
                                        <option value="">{locale === 'ar' ? 'اختر التصنيف' : 'Select Category'}</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* AI Analysis Button */}
                            {invoice.filePath && (
                                <button
                                    onClick={handleAIAnalysis}
                                    disabled={isAnalyzing}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50"
                                >
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isAnalyzing ? (locale === 'ar' ? "جاري التحليل..." : "Analyzing...") : (locale === 'ar' ? "🤖 تحليل بالذكاء الاصطناعي" : "🤖 AI Analysis")}
                                </button>
                            )}

                            <div className="space-y-2 pt-2 border-t border-blue-100">
                                <Button onClick={handleApprove} disabled={isUpdating} variant="primary" className="w-full gap-2 bg-green-600 hover:bg-green-700 py-3 shadow-sm font-bold border-green-700">
                                    <CheckCircle className="w-5 h-5" />
                                    {locale === 'ar' ? 'اعتماد وتأكيد' : 'Approve & Confirm'}
                                </Button>
                                <Button onClick={() => { setIsRejectModalOpen(true); setSelectedPreset(null); setRejectionReason(""); }} disabled={isUpdating} variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 py-3 font-bold bg-white">
                                    <XCircle className="w-5 h-5" />
                                    {locale === 'ar' ? 'رفض الفاتورة' : 'Reject Invoice'}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* I4: Re-open panel — APPROVED or REJECTED invoices */}
                    {canReopen && (
                        <Card className="p-5 space-y-3 bg-amber-50/50 border-amber-100 shadow-md">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                                {locale === 'ar' ? 'إعادة المراجعة' : 'Reopen for Review'}
                            </h3>
                            <p className="text-xs text-amber-700 leading-relaxed mb-4">{locale === 'ar' ? 'يمكنك إعادة الفاتورة إلى قائمة المراجعة لتصحيحها أو إعادة تقييمها.' : 'You can return this invoice to the review list for correction or re-evaluation.'}</p>
                            <Button onClick={handleReopen} disabled={isUpdating} variant="outline" className="w-full gap-2 text-amber-700 border-amber-300 hover:bg-amber-50 py-3 font-bold bg-white">
                                <AlertTriangle className="w-5 h-5" />
                                {locale === 'ar' ? 'إعادة فتح للمراجعة' : 'Reopen for Review'}
                            </Button>
                        </Card>
                    )}

                    <Card className="p-6 space-y-3 flex flex-col gap-2">
                        <a
                            href={`/api/invoice-vouchers/${invoice.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full gap-2 py-3 bg-[#102550] hover:bg-[#0d1d40] text-white rounded-xl font-bold text-sm flex items-center justify-center transition-colors"
                        >
                            <FileText className="w-5 h-5" />
                            {locale === 'ar' ? 'سند الفاتورة (PDF)' : 'Invoice Voucher (PDF)'}
                        </a>
                        <Button
                            variant="outline"
                            className="w-full gap-2 py-3 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                            onClick={() => window.print()}
                        >
                            <Printer className="w-5 h-5 text-gray-400" />
                            {locale === 'ar' ? 'طباعة الصفحة' : 'Print Page'}
                        </Button>
                    </Card>

                    {/* Delete button — ADMIN + GLOBAL_ACCOUNTANT, non-approved */}
                    {((role as UserRole) === "ADMIN" || (role as UserRole) === "GLOBAL_ACCOUNTANT") && invoice.status !== "APPROVED" && (
                        <Card className="p-5 space-y-3 bg-red-50/50 border-red-100">
                            <Button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                isLoading={isDeleting}
                                variant="outline"
                                className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 py-3 font-bold"
                            >
                                <Trash2 className="w-4 h-4" />
                                {locale === 'ar' ? 'نقل إلى سلة المهملات' : 'Move to Trash'}
                            </Button>
                        </Card>
                    )}
                </div>

                {/* Rejection Modal */}
                {isRejectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center gap-3 text-red-600 mb-4 border-b border-gray-100 pb-3">
                                <AlertTriangle className="w-6 h-6" />
                                <h3 className="text-lg font-bold">{locale === 'ar' ? 'رفض الفاتورة' : 'Reject Invoice'}</h3>
                            </div>

                            <div className="space-y-5">
                                <p className="text-gray-600 text-sm leading-relaxed">{locale === 'ar' ? 'اختر سبباً من الأسباب الشائعة أو اكتب سبباً مخصصاً. سيصل السبب للموظف مباشرة.' : 'Select a common reason or write a custom one. The reason will be sent directly to the employee.'}</p>

                                {/* Preset Reasons */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 block">{locale === 'ar' ? 'أسباب شائعة — اختر واحداً' : 'Common Reasons — Select one'}</label>
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
                                            {selectedPreset === 'custom' ? (locale === 'ar' ? 'اكتب السبب المخصص *' : 'Write custom reason *') : (locale === 'ar' ? 'السبب (يمكنك التعديل) *' : 'Reason (editable) *')}
                                        </label>
                                        <textarea
                                            rows={3}
                                            autoFocus
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                            placeholder={selectedPreset === 'custom' ? (locale === 'ar' ? 'اكتب سبب الرفض بالتفصيل...' : 'Write the rejection reason in detail...') : ''}
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
                                        {isUpdating ? (locale === 'ar' ? "جاري الرفض..." : "Rejecting...") : (locale === 'ar' ? "تأكيد الرفض والإرسال" : "Confirm Rejection")}
                                    </Button>
                                    <Button onClick={handleCloseRejectModal} disabled={isUpdating} variant="outline" className="flex-1 py-3 text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100">
                                        {locale === 'ar' ? 'إلغاء' : 'Cancel'}
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
