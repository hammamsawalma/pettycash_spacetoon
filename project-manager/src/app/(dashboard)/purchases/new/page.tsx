"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect, useActionState } from "react";
import { getProjects } from "@/actions/projects";
import { createPurchase } from "@/actions/purchases";
import { Project } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Suspense } from "react";
import { useCanDo } from "@/components/auth/Protect";

function NewPurchaseForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultProjectId = searchParams.get('projectId') || "";
    // v3: Guard — only ADMIN, GM, and coordinators can create purchase orders
    const canCreate = useCanDo('purchases', 'createGlobal');

    const [projects, setProjects] = useState<Project[]>([]);
    const [state, formAction, isPending] = useActionState(createPurchase, null);

    useEffect(() => {
        if (!canCreate) {
            toast.error("ليس لديك صلاحية لإنشاء طلبات الشراء");
            router.replace("/purchases");
            return;
        }
        getProjects().then(data => setProjects(data as unknown as Project[]));
    }, [canCreate]);

    useEffect(() => {
        if (state?.success) {
            sessionStorage.removeItem("purchases_cache");
            router.push("/purchases");
        }
    }, [state, router]);

    return (
        <DashboardLayout title="اضافة طلب شراء جديد">
            <div className="pb-6">
                <Card className="max-w-4xl mx-auto p-5 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                    {state?.error && (
                        <div className="mb-6 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:text-red-400" role="alert">
                            {state.error}
                        </div>
                    )}
                    <form className="space-y-6 md:space-y-8" encType="multipart/form-data" action={(formData) => {
                        const projectId = formData.get("projectId");
                        const quantity = formData.get("quantity");
                        const description = formData.get("description");

                        if (!projectId) {
                            toast.error("يرجى اختيار المشروع");
                            return;
                        }
                        if (!description) {
                            toast.error("يرجى كتابة وصف تفصيلي للطلب");
                            return;
                        }
                        if (!quantity) {
                            toast.error("الكمية مطلوبة للمتابعة");
                            return;
                        }

                        formAction(formData);
                    }}>

                        <div className="space-y-4">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">تفاصيل الطلب</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">المشروع</label>
                                    <select name="projectId" required defaultValue={defaultProjectId} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium">
                                        <option value="">اختر المشروع</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">الموعد النهائي لموافقة الطلب (اختياري)</label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">الكمية</label>
                                    <input
                                        type="text"
                                        name="quantity"
                                        required
                                        placeholder="مثال: 3 حبات، 2 كرتون..."
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">وصف الطلب</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={4}
                                        placeholder="اكتب وصف تفصيلي للمشتريات..."
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] resize-none text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">مرفق الشراء (اختياري)</label>
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/jpeg, image/png, image/webp, application/pdf"
                                        className="w-full rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium bg-white file:ml-4 file:py-3.5 file:md:py-4 file:px-4 file:border-0 file:text-sm file:font-bold file:bg-[#102550]/10 file:text-[#102550] hover:file:bg-[#102550]/20 transition-colors cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="px-8 py-3 rounded-xl font-bold shadow-sm w-full sm:w-auto text-sm">
                                حفظ الطلب
                            </Button>
                            <Button onClick={() => router.push('/purchases')} variant="outline" type="button" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700">
                                إلغاء
                            </Button>
                        </div>

                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default function NewPurchasePage() {
    return (
        <Suspense fallback={
            <DashboardLayout title="اضافة طلب شراء جديد - جاري التحميل">
                <div className="py-20 text-center text-gray-500">جاري تحميل النموذج...</div>
            </DashboardLayout>
        }>
            <NewPurchaseForm />
        </Suspense>
    );
}
