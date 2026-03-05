"use client"
import { useActionState, useEffect, useState } from "react";
import { createDeposit } from "@/actions/deposits";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultType: "DEPOSIT" | "WITHDRAWAL";
    onSuccess?: () => void;
}

export default function DepositModal({ isOpen, onClose, defaultType, onSuccess }: DepositModalProps) {
    const [state, formAction, isPending] = useActionState(createDeposit, null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (state?.success) {
            toast.success("تمت العملية بنجاح");
            if (onSuccess) onSuccess();
            onClose();
        }
    }, [state, onClose, onSuccess]);

    const [isDirty, setIsDirty] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (isDirty && !window.confirm('هل أنت متأكد من الإلغاء؟ لديك بيانات غير محفوظة.')) return;
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isDirty]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            if (isDirty && !window.confirm('هل أنت متأكد من الإلغاء؟ لديك بيانات غير محفوظة.')) return;
            onClose();
        }
    };

    const handleCloseClick = () => {
        if (isDirty && !window.confirm('هل أنت متأكد من الإلغاء؟ لديك بيانات غير محفوظة.')) return;
        onClose();
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 md:p-6 border-b border-gray-100">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                        {defaultType === 'DEPOSIT' ? 'إيداع جديد' : 'سحب / مصروف جديد'}
                    </h3>
                    <button onClick={handleCloseClick} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 md:p-8">
                    {state?.error && (
                        <div className="mb-6 p-4 text-sm text-red-800 rounded-xl bg-red-50 border border-red-100 font-bold flex items-center gap-2" role="alert">
                            <span className="shrink-0">⚠️</span>
                            {state.error}
                        </div>
                    )}
                    <form
                        key={isOpen ? 'open' : 'closed'} // Force re-render of form when modal opens to reset state
                        className="space-y-6 md:space-y-8"
                        onChange={() => setIsDirty(true)}
                        action={(formData) => {
                            const amount = formData.get("amount");
                            const description = formData.get("description");

                            if (!amount || Number(amount) <= 0) {
                                toast.error("المبلغ يجب أن يكون أكبر من الصفر");
                                return;
                            }
                            if (!description) {
                                toast.error("يرجى كتابة وصف تفصيلي للعملية");
                                return;
                            }

                            formAction(formData);
                        }}>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">نوع المعاملة</label>
                                    <select name="type" defaultValue={defaultType} required className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium">
                                        <option value="DEPOSIT">ايداع بمحفظة الشركة</option>
                                        <option value="WITHDRAWAL">سحب من محفظة الشركة</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">تاريخ المعاملة</label>
                                    <input
                                        type="date"
                                        name="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">المبلغ (QAR)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">الوصف</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={4}
                                        placeholder="اكتب وصف تفصيلي يعبر عن سبب أو وجهة هذه المعاملة..."
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] resize-none text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 mt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold shadow-sm">
                                تأكيد العملية
                            </Button>
                            <Button onClick={(e) => { e.preventDefault(); handleCloseClick(); }} variant="outline" type="button" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700">
                                إلغاء
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
