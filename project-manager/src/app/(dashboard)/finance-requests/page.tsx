"use client"
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Clock, BadgeDollarSign, ArrowUpRight, PlusCircle } from "lucide-react";
import { getPendingFinanceRequests, approveFinanceRequest, rejectFinanceRequest, createFinanceRequest } from "@/actions/financeRequests";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

type Request = Awaited<ReturnType<typeof getPendingFinanceRequests>>[0];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    SETTLE_DEBT: { label: "تسوية دين موظف", color: "text-red-600 bg-red-50", icon: "💸" },
    ALLOCATE_BUDGET: { label: "تخصيص ميزانية", color: "text-blue-600 bg-blue-50", icon: "📊" },
    RETURN_CUSTODY: { label: "إرجاع عهدة", color: "text-amber-600 bg-amber-50", icon: "🔄" },
    OTHER: { label: "أخرى", color: "text-gray-600 bg-gray-50", icon: "📝" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
    PENDING: { label: "بانتظار الموافقة", color: "text-amber-600 bg-amber-50", Icon: Clock },
    APPROVED: { label: "موافق عليه", color: "text-green-600 bg-green-50", Icon: CheckCircle },
    REJECTED: { label: "مرفوض", color: "text-red-600 bg-red-50", Icon: XCircle },
};

export default function FinanceRequestsPage() {
    const { user } = useAuth();
    const router = useRouter();
    // Derived from central permissions matrix — no hardcoded role strings in UI
    const isAdmin = useCanDo('financialRequests', 'approve');
    const isFinanceRole = useCanDo('financialRequests', 'view');

    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [rejectModalId, setRejectModalId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newReqType, setNewReqType] = useState("SETTLE_DEBT");
    const [newReqAmount, setNewReqAmount] = useState("");
    const [newReqNote, setNewReqNote] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (user && !isFinanceRole) {
            router.push("/");
        } else if (user) {
            getPendingFinanceRequests().then(data => {
                setRequests(data as Request[]);
                setLoading(false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    if (!user || !isFinanceRole) return null;

    // ADMIN and GLOBAL_ACCOUNTANT can create finance requests
    const canCreate = isAdmin || user.role === 'GLOBAL_ACCOUNTANT';

    const handleCreate = async () => {
        if (!newReqType) { toast.error("نوع الطلب مطلوب"); return; }
        setIsCreating(true);
        const result = await createFinanceRequest({
            type: newReqType,
            amount: newReqAmount ? Number(newReqAmount) : undefined,
            note: newReqNote || undefined,
        });
        setIsCreating(false);
        if ('error' in result && result.error) {
            toast.error(result.error as string);
        } else {
            toast.success("تم إنشاء الطلب المالي ✅");
            setShowCreateModal(false);
            setNewReqType("SETTLE_DEBT");
            setNewReqAmount("");
            setNewReqNote("");
            // Reload requests
            getPendingFinanceRequests().then(data => {
                setRequests(data as Request[]);
            });
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        const result = await approveFinanceRequest(id);
        if ('error' in result && result.error) {
            toast.error(result.error as string);
        } else {
            toast.success("تمت الموافقة وتنفيذ العملية ✅");
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "APPROVED" } : r));
        }
        setProcessingId(null);
    };

    const handleReject = async () => {
        if (!rejectModalId || !rejectReason.trim()) {
            toast.error("سبب الرفض مطلوب");
            return;
        }
        setProcessingId(rejectModalId);
        const result = await rejectFinanceRequest(rejectModalId, rejectReason.trim());
        if ('error' in result && result.error) {
            toast.error(result.error as string);
        } else {
            toast.success("تم الرفض");
            setRequests(prev => prev.map(r => r.id === rejectModalId ? { ...r, status: "REJECTED" } : r));
            setRejectModalId(null);
            setRejectReason("");
        }
        setProcessingId(null);
    };

    const pending = requests.filter(r => r.status === "PENDING");
    const resolved = requests.filter(r => r.status !== "PENDING");

    return (
        <DashboardLayout title="الطلبات المالية">
            <div className="max-w-3xl mx-auto space-y-6 pb-10">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <BadgeDollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">الطلبات المالية</h1>
                        <p className="text-sm text-gray-500">
                            {isAdmin ? "طلبات المحاسبين تنتظر موافقتك" : "طلباتي المالية"}
                        </p>
                    </div>
                    {pending.length > 0 && (
                        <span className="mr-auto bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            {pending.length} معلقة
                        </span>
                    )}
                    {canCreate && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1.5 bg-[#102550] hover:bg-[#1a3a7c] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                        >
                            <PlusCircle className="w-4 h-4" />
                            طلب مالي جديد
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-16 text-gray-400">جاري التحميل...</div>
                ) : (
                    <>
                        {/* Pending Requests */}
                        {pending.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">🔴 تنتظر الموافقة</h2>
                                <div className="space-y-3">
                                    {pending.map(req => {
                                        const typeInfo = TYPE_LABELS[req.type] || TYPE_LABELS.OTHER;
                                        return (
                                            <Card key={req.id} className="p-5 border border-amber-100 bg-amber-50/30">
                                                <div className="flex items-start gap-4">
                                                    <span className="text-2xl">{typeInfo.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                                                                {typeInfo.label}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(req.createdAt).toLocaleDateString("en-GB")}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-900">{req.requester?.name}</p>
                                                        {req.amount && (
                                                            <p className="text-sm text-amber-700 font-bold mt-1">
                                                                المبلغ: {req.amount.toLocaleString()} <CurrencyDisplay />
                                                            </p>
                                                        )}
                                                        {req.note && (
                                                            <p className="text-xs text-gray-500 mt-1">{req.note}</p>
                                                        )}
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <button
                                                                onClick={() => handleApprove(req.id)}
                                                                disabled={processingId === req.id}
                                                                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                موافقة
                                                            </button>
                                                            <button
                                                                onClick={() => { setRejectModalId(req.id); setRejectReason(""); }}
                                                                disabled={processingId === req.id}
                                                                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                رفض
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Resolved Requests */}
                        {resolved.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">السجل</h2>
                                <div className="space-y-2">
                                    {resolved.map(req => {
                                        const typeInfo = TYPE_LABELS[req.type] || TYPE_LABELS.OTHER;
                                        const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                                        const StatusIcon = statusInfo.Icon;
                                        return (
                                            <Card key={req.id} className="p-4 border border-gray-100 opacity-80">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">{typeInfo.icon}</span>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-800">{typeInfo.label}</p>
                                                        <p className="text-xs text-gray-400">{req.requester?.name}</p>
                                                    </div>
                                                    {req.amount && (
                                                        <p className="text-sm font-bold text-gray-600">
                                                            {req.amount.toLocaleString()} <CurrencyDisplay />
                                                        </p>
                                                    )}
                                                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {requests.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                <BadgeDollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>لا توجد طلبات مالية</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModalId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">سبب رفض الطلب</h3>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="اكتب سبب الرفض بوضوح..."
                            rows={4}
                            className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-red-400 resize-none text-sm"
                        />
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setRejectModalId(null)}>إلغاء</Button>
                            <Button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || processingId !== null}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                تأكيد الرفض
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Create Finance Request Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6 space-y-5">
                        <h3 className="text-lg font-bold text-gray-900">إنشاء طلب مالي جديد</h3>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">نوع الطلب *</label>
                            <select
                                value={newReqType}
                                onChange={e => setNewReqType(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm bg-gray-50"
                            >
                                <option value="SETTLE_DEBT">تسوية دين موظف</option>
                                <option value="ALLOCATE_BUDGET">تخصيص ميزانية</option>
                                <option value="RETURN_CUSTODY">إرجاع عهدة</option>
                                <option value="OTHER">أخرى</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">المبلغ (اختياري)</label>
                            <input
                                type="number"
                                value={newReqAmount}
                                onChange={e => setNewReqAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm bg-gray-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">ملاحظات</label>
                            <textarea
                                value={newReqNote}
                                onChange={e => setNewReqNote(e.target.value)}
                                rows={3}
                                placeholder="وصف الطلب بالتفصيل..."
                                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] resize-none text-sm bg-gray-50"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="bg-[#102550] hover:bg-[#1a3a7c] text-white"
                            >
                                {isCreating ? "جاري الإرسال..." : "إرسال الطلب"}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
