"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { depositToCompanyWallet } from "@/actions/wallet";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Wallet, ArrowDownCircle } from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useAuth } from "@/context/AuthContext";

export default function DepositToWalletPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    // Only ADMIN can deposit — redirect others
    useEffect(() => {
        if (user && user.role !== "ADMIN") {
            router.push("/wallet");
        }
    }, [user, router]);

    if (!user || user.role !== "ADMIN") return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = Number(formData.get("amount"));
        const note = formData.get("note") as string;

        if (!amount || amount <= 0) {
            toast.error("يرجى إدخال مبلغ صحيح أكبر من الصفر");
            return;
        }

        setIsSubmitting(true);
        const res = await depositToCompanyWallet(null, formData);
        setIsSubmitting(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("تم إيداع المبلغ بنجاح في خزنة الشركة");
            router.push("/wallet");
        }
    };

    return (
        <DashboardLayout title="إيداع في خزنة الشركة">
            <div className="pb-10 max-w-2xl mx-auto" dir="rtl">
                <Card className="p-6 md:p-8 rounded-2xl shadow-sm border-gray-100">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                            <ArrowDownCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">إيداع رصيد جديد</h2>
                            <p className="text-gray-500 text-sm mt-1">قم بتغذية الخزنة الرئيسية للشركة لتتمكن من تخصيص ميزانيات للمشاريع</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">مبلغ الإيداع (<CurrencyDisplay />) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"><CurrencyDisplay /></span>
                                <input
                                    type="number"
                                    name="amount"
                                    required min="1" step="0.01"
                                    placeholder="50000"
                                    className="w-full rounded-xl border border-gray-200 p-4 pl-12 outline-none focus:ring-2 focus:ring-green-400 text-lg font-bold text-gray-900 shadow-sm transition-shadow"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">ملاحظات / مرجع الإيداع (اختياري)</label>
                            <textarea
                                name="note"
                                rows={3}
                                placeholder="مثال: تحويل بنكي من حساب الشركة الرئيسي دفعة شهر مايو"
                                className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-green-400 resize-none text-sm text-gray-700 shadow-sm transition-shadow"
                            />
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3 text-sm">
                            <Wallet className="w-5 h-5 text-gray-400 shrink-0" />
                            <p className="text-gray-600 leading-relaxed">
                                هذا الإيداع سيضيف إلى الرصيد المتاح في الإدارة ولن يظهر للموظفين. فقط مدير النظام يمكنه رؤية الخزنة الرئيسية وتخصيص الميزانيات.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="button" onClick={() => router.push('/wallet')} variant="outline" className="flex-1 py-4 rounded-xl font-bold bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors">
                                إلغاء الرجوع
                            </Button>
                            <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} variant="primary" className="flex-[2] py-4 rounded-xl font-bold bg-green-600 hover:bg-green-700 border-green-700 shadow-md">
                                {isSubmitting ? "جاري الإيداع..." : "تأكيد وإيداع"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
