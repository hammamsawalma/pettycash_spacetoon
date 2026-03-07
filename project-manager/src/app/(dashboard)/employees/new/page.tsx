"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useActionState, useEffect } from "react";
import { createEmployee } from "@/actions/employees";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FileUpload } from "@/components/ui/FileUpload";
import toast from "react-hot-toast";

export default function NewEmployeePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [state, formAction, isPending] = useActionState(createEmployee, null);

    useEffect(() => {
        // RBAC: Only ADMIN can create employees
        if (user && user.role !== "ADMIN") {
            router.push("/");
            return;
        }
        if (state?.success) {
            router.push("/employees");
        }
    }, [state, router, user]);

    if (!user || user.role !== "ADMIN") return null;

    return (
        <DashboardLayout title="اضافة موظف جديد">
            <div className="pb-6">
                <Card className="max-w-4xl mx-auto p-5 md:p-8 border-gray-100 shadow-sm rounded-2xl">
                    {state?.error && (
                        <div className="mb-6 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:text-red-400" role="alert">
                            {state.error}
                        </div>
                    )}
                    <form className="space-y-6 md:space-y-8" action={(formData) => {
                        const name = formData.get("name");
                        const phone = formData.get("phone");
                        const password = formData.get("password");

                        if (!name) {
                            toast.error("اسم الموظف مطلوب");
                            return;
                        }
                        if (!phone) {
                            toast.error("رقم هاتف الموظف مطلوب");
                            return;
                        }
                        if (!password) {
                            toast.error("كلمة المرور المؤقتة مطلوبة");
                            return;
                        }

                        formAction(formData);
                    }}>

                        <div className="space-y-4">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">تفاصيل المهام الرئيسية</h3>

                            <div className="flex flex-col md:flex-row gap-6">

                                {/* Profile Image Column */}
                                <div className="w-full md:w-1/3 space-y-4">
                                    <label className="text-xs md:text-sm font-bold text-gray-700 block text-center">الصورة الشخصية (اختياري)</label>
                                    <FileUpload
                                        name="image"
                                        accept="image/png, image/jpeg, image/webp"
                                        maxSizeMB={5}
                                        placeholder="تصفح الصور"
                                        description="حجم الصورة الداخلي 500x500"
                                        variant="avatar"
                                    />
                                </div>

                                {/* Info Fields */}
                                <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">اسم الموظف</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            placeholder="ادخل اسم الموظف..."
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">رقم الهاتف</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            placeholder="05xxxxxxxxx"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">مسمى المهنة</label>
                                        <input
                                            type="text"
                                            name="jobTitle"
                                            placeholder="مثال: مطور ويب، مصمم واجهات..."
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">الدور وصلاحيات النظام</label>
                                        <select name="role" required className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium">
                                            <option value="USER">موظف (User)</option>
                                            <option value="GLOBAL_ACCOUNTANT">محاسب عام (Global Accountant)</option>
                                            <option value="GENERAL_MANAGER">المدير العام (General Manager)</option>
                                            <option value="ADMIN">مدير (Admin)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">الراتب المتفق عليه (QAR)</label>
                                        <input
                                            type="number"
                                            name="salary"
                                            step="0.01"
                                            placeholder="مثال: 5000"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">البريد الالكتروني (اختياري)</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="example@company.com"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">كلمة المرور المؤقتة</label>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            placeholder="كلمة المرور لتسجيل الدخول الأول"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 mt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold shadow-sm">
                                {isPending ? "جاري الحفظ..." : "اضافة وحفظ التغييرات"}
                            </Button>
                            <Button onClick={() => router.push('/employees')} variant="outline" type="button" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700">
                                الغاء
                            </Button>
                        </div>

                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
