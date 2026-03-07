"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ArrowLeft, Flag, Info, ShoppingCart, User, Building, ExternalLink, RefreshCw, Paperclip } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { togglePurchaseRedFlag } from "@/actions/purchases";

export default function PurchaseDetailsClient({ initialPurchase }: { initialPurchase: any }) {
    const router = useRouter();
    const purchase = initialPurchase;

    const [isFlagging, setIsFlagging] = useState(false);
    const [flagReason, setFlagReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleFlag = async (isRemoving: boolean) => {
        if (!isRemoving && !flagReason.trim()) {
            toast.error("الرجاء إدخال سبب الرفع");
            return;
        }

        setIsSubmitting(true);
        const res = await togglePurchaseRedFlag(purchase.id, flagReason, isRemoving);
        setIsSubmitting(false);

        if (res.success) {
            toast.success(isRemoving ? "تم إزالة الراية الحمراء بنجاح" : "تم وضع الراية الحمراء 🚩");
            setIsFlagging(false);
            setFlagReason("");
            router.refresh();
        } else {
            toast.error(res.error || "حدث خطأ");
        }
    };

    return (
        <DashboardLayout title="تفاصيل طلب الشراء">
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-semibold mb-2"
                >
                    <ArrowLeft className="w-4 h-4" /> العودة للمشتريات
                </button>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* Left Column: Image / Empty State */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                        <Card className="overflow-hidden border-gray-100 shadow-sm p-2 bg-gray-50/50">
                            <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center border border-gray-200/50">
                                {purchase.imageUrl ? (
                                    <Image
                                        src={purchase.imageUrl}
                                        alt="صورة المنتج"
                                        fill
                                        className="object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="text-center px-4 flex flex-col items-center opacity-60">
                                        <ShoppingCart className="w-16 h-16 text-gray-400 mb-3" />
                                        <p className="text-sm font-bold text-gray-600 mb-1">لا توجد صورة مرفقة</p>
                                        <p className="text-xs text-gray-400">الاعتماد على الوصف النصي أدناه للبحث عن المنتج</p>
                                    </div>
                                )}
                            </div>

                            {purchase.imageUrl && (
                                <div className="mt-2 text-center">
                                    <a
                                        href={purchase.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-full gap-2 text-xs font-bold text-primary hover:bg-primary/5 py-3 rounded-lg transition-colors border border-transparent hover:border-primary/10"
                                    >
                                        <ExternalLink className="w-4 h-4" /> فتح الصورة بملف كامل
                                    </a>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="md:col-span-7 flex flex-col gap-6">
                        {/* Status & Flag Alert */}
                        {purchase.isRedFlagged && (
                            <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-right-2">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2 text-red-500 rounded-full shadow-sm">
                                        <Flag className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-red-800 mb-1">المنتج غير متوفر - راية حمراء</h3>
                                        <p className="text-sm text-red-600 font-medium leading-relaxed">{purchase.redFlagReason}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleToggleFlag(true)}
                                        disabled={isSubmitting}
                                        className="shrink-0 h-9 font-bold border-red-200 text-red-600 hover:bg-red-100"
                                    >
                                        إزالة الراية
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Card className="p-6 md:p-8 shadow-sm border-gray-100 relative overflow-hidden">
                            {/* Watermark Logo */}
                            <div className="absolute -left-10 -bottom-10 opacity-[0.03] pointer-events-none">
                                <ShoppingCart className="w-64 h-64" />
                            </div>

                            <div className="relative z-10 flex flex-col gap-8">
                                {/* Header */}
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">{purchase.orderNumber}</p>
                                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                                            {purchase.description}
                                        </h1>
                                    </div>
                                    <StatusBadge status={purchase.status} />
                                </div>

                                <hr className="border-gray-100" />

                                {/* Meta Data */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />المشروع</p>
                                        <p className="text-sm font-bold text-primary">{purchase.project?.name || "مشروع عام"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />الموعد المرجو المتوقع</p>
                                        <p className="text-sm font-bold text-gray-900">{purchase.deadline ? new Date(purchase.deadline).toLocaleDateString('en-GB') : "غير محدد"}</p>
                                    </div>
                                </div>

                                {/* Financial */}
                                <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-1">الكمية المطلوبة / العدد</p>
                                        <p className="text-2xl font-black text-gray-900 drop-shadow-sm">
                                            {purchase.quantity || 1}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-500 mb-1">طالب الشراء</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {purchase.creator?.name}
                                        </p>
                                    </div>
                                </div>

                                {/* Notes if any */}
                                {purchase.notes && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5"><Info className="w-4 h-4" /> ملاحظات إضافية</p>
                                        <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100/50">
                                            <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">{purchase.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions Bar */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                                    {(purchase.status === 'REQUESTED' || purchase.status === 'IN_PROGRESS') && (
                                        <Button
                                            onClick={() => router.push(`/invoices/new?purchaseId=${purchase.id}&projectId=${purchase.projectId || ''}&description=${encodeURIComponent(purchase.description)}`)}
                                            className="flex-1 py-6 text-base font-black"
                                        >
                                            <ShoppingCart className="w-5 h-5 mr-[-2px] ml-2" /> إتمام عملية الشراء (رفع فاتورة)
                                        </Button>
                                    )}

                                    {!purchase.isRedFlagged && (purchase.status === 'REQUESTED' || purchase.status === 'IN_PROGRESS') && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsFlagging(true)}
                                            className="px-6 py-6 text-sm font-bold border-red-200 text-red-500 hover:bg-red-50 stroke-[3px]"
                                        >
                                            <Flag className="w-5 h-5 ml-2" /> غير متوفر
                                        </Button>
                                    )}
                                </div>

                                {/* Flagging Input Form */}
                                {isFlagging && (
                                    <div className="mt-4 p-5 bg-red-50 border border-red-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
                                        <label className="text-sm font-bold text-red-900 flex items-center gap-2">
                                            <Flag className="w-4 h-4" /> ما سبب عدم توفر المنتج؟
                                        </label>
                                        <textarea
                                            value={flagReason}
                                            onChange={(e) => setFlagReason(e.target.value)}
                                            placeholder="مثال: المنتج غير متوفر في فرع جرير، يوجد بديل أغلى..."
                                            className="w-full p-3 rounded-lg border border-red-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                            rows={3}
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleToggleFlag(false)}
                                                disabled={!flagReason.trim() || isSubmitting}
                                                className="bg-red-600 hover:bg-red-700 text-white flex-1 font-bold"
                                            >
                                                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "إرسال الراية الحمراء كإشعار"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => { setIsFlagging(false); setFlagReason(""); }}
                                                className="bg-white"
                                            >
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
