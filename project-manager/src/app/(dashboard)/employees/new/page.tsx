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
import { useLanguage } from "@/context/LanguageContext";

export default function NewEmployeePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { locale } = useLanguage();
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
        <DashboardLayout title={locale === 'ar' ? "اضافة موظف جديد" : "Add New Employee"}>
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
                            toast.error(locale === 'ar' ? "اسم الموظف مطلوب" : "Employee name is required");
                            return;
                        }
                        if (!phone) {
                            toast.error(locale === 'ar' ? "رقم هاتف الموظف مطلوب" : "Employee phone number is required");
                            return;
                        }
                        if (!password) {
                            toast.error(locale === 'ar' ? "كلمة المرور المؤقتة مطلوبة" : "Temporary password is required");
                            return;
                        }

                        formAction(formData);
                    }}>

                        <div className="space-y-4">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{locale === 'ar' ? 'تفاصيل المهام الرئيسية' : 'Main Details'}</h3>

                            <div className="flex flex-col md:flex-row gap-6">

                                {/* Profile Image Column */}
                                <div className="w-full md:w-1/3 space-y-4">
                                    <label className="text-xs md:text-sm font-bold text-gray-700 block text-center">{locale === 'ar' ? 'الصورة الشخصية (اختياري)' : 'Profile Photo (Optional)'}</label>
                                    <FileUpload
                                        name="image"
                                        accept="image/png, image/jpeg, image/webp"
                                        maxSizeMB={5}
                                        placeholder={locale === 'ar' ? "تصفح الصور" : "Browse photos"}
                                        description={locale === 'ar' ? "حجم الصورة الداخلي 500x500" : "Image size 500x500"}
                                        variant="avatar"
                                    />
                                </div>

                                {/* Info Fields */}
                                <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'اسم الموظف' : 'Employee Name'}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            placeholder={locale === 'ar' ? "ادخل اسم الموظف..." : "Enter employee name..."}
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            placeholder="05xxxxxxxxx"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'مسمى المهنة' : 'Job Title'}</label>
                                        <input
                                            type="text"
                                            name="jobTitle"
                                            placeholder={locale === 'ar' ? "مثال: مطور ويب، مصمم واجهات..." : "e.g. Web Developer, UI Designer..."}
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'الدور وصلاحيات النظام' : 'Role & Permissions'}</label>
                                        <select name="role" required className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium">
                                            <option value="USER">{locale === 'ar' ? 'موظف (User)' : 'Employee (User)'}</option>
                                            <option value="GLOBAL_ACCOUNTANT">{locale === 'ar' ? 'محاسب عام (Global Accountant)' : 'Global Accountant'}</option>
                                            <option value="GENERAL_MANAGER">{locale === 'ar' ? 'المدير العام (General Manager)' : 'General Manager'}</option>
                                            <option value="ADMIN">{locale === 'ar' ? 'مدير (Admin)' : 'Admin'}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'البريد الالكتروني (اختياري)' : 'Email (Optional)'}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="example@company.com"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'كلمة المرور المؤقتة' : 'Temporary Password'}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            placeholder={locale === 'ar' ? "كلمة المرور لتسجيل الدخول الأول" : "First login password"}
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 mt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold shadow-sm">
                                {isPending ? (locale === 'ar' ? "جاري الحفظ..." : "Saving...") : (locale === 'ar' ? "اضافة وحفظ التغييرات" : "Add & Save")}
                            </Button>
                            <Button onClick={() => router.push('/employees')} variant="outline" type="button" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700">
                                {locale === 'ar' ? 'الغاء' : 'Cancel'}
                            </Button>
                        </div>

                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
