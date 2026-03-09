"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useActionState, useEffect, useState, use } from "react";
import { getEmployeeById, updateEmployee } from "@/actions/employees";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/ui/FileUpload";
import toast from "react-hot-toast";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: employeeId } = use(params);
    const router = useRouter();
    const updateEmployeeWithId = updateEmployee.bind(null, employeeId);
    const [state, formAction, isPending] = useActionState(updateEmployeeWithId, null);
    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getEmployeeById(employeeId).then(data => {
            if (data) {
                setInitialData(data);
            } else {
                toast.error("لم يتم العثور على الموظف");
                router.push("/employees");
            }
            setIsLoading(false);
        });
    }, [employeeId, router]);

    useEffect(() => {
        if (state?.success) {
            toast.success("تم تحديث بيانات الموظف بنجاح");
            router.push(`/employees/${employeeId}`);
        }
    }, [state, router, employeeId]);

    if (isLoading && !initialData) {
        return (
            <DashboardLayout title="تعديل الموظف">
                <div className="py-20 text-center text-gray-500 font-bold">جاري تحميل البيانات...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="تعديل بيانات الموظف">
            <div className="pb-6">
                <Card className="max-w-4xl mx-auto p-5 md:p-8 border-gray-100 shadow-sm rounded-2xl">
                    {state?.error && (
                        <div className="mb-6 p-4 text-xs md:text-sm text-red-800 rounded-xl bg-red-50 font-bold border border-red-100" role="alert">
                            {state.error}
                        </div>
                    )}
                    <form className="space-y-6 md:space-y-8" action={(formData) => {
                        const name = formData.get("name");
                        const phone = formData.get("phone");

                        if (!name) {
                            toast.error("اسم الموظف مطلوب");
                            return;
                        }
                        if (!phone) {
                            toast.error("رقم هاتف الموظف مطلوب");
                            return;
                        }

                        formAction(formData);
                    }}>

                        <div className="space-y-4">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">التفاصيل وتحديث البيانات</h3>

                            <div className="flex flex-col md:flex-row gap-6">

                                {/* Profile Image Column */}
                                <div className="w-full md:w-1/3 space-y-4">
                                    <label className="text-xs md:text-sm font-bold text-gray-700 block text-center">تغيير الصورة الشخصية (اختياري)</label>
                                    <FileUpload
                                        name="image"
                                        accept="image/png, image/jpeg, image/webp"
                                        maxSizeMB={5}
                                        placeholder="تصفح لتغيير الصورة"
                                        description="سيتم استبدال الصورة الحالية إن وجدت"
                                        variant="avatar"
                                    />
                                    {initialData?.image && (
                                        <div className="text-center">
                                            <p className="text-xs text-emerald-600 font-bold">الموظف لديه صورة شخصية حالياً</p>
                                        </div>
                                    )}
                                </div>

                                {/* Info Fields */}
                                <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">اسم الموظف</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            defaultValue={initialData?.name}
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
                                            defaultValue={initialData?.phone || ""}
                                            placeholder="05xxxxxxxxx"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">مسمى المهنة</label>
                                        <input
                                            type="text"
                                            name="jobTitle"
                                            defaultValue={initialData?.jobTitle || ""}
                                            placeholder="مثال: مطور ويب، مصمم واجهات..."
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">الدور وصلاحيات النظام</label>
                                        <select name="role" required defaultValue={initialData?.role} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium">
                                            <option value="USER">موظف (User)</option>
                                            <option value="GLOBAL_ACCOUNTANT">محاسب عام (Global Accountant)</option>
                                            <option value="GENERAL_MANAGER">المدير العام (General Manager)</option>
                                            <option value="ADMIN">مدير (Admin)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">البريد الالكتروني (اختياري)</label>
                                        <input
                                            type="email"
                                            name="email"
                                            defaultValue={initialData?.email || ""}
                                            placeholder="example@company.com"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">كلمة المرور المؤقتة (اتركه فارغاً إن لم ترد تغييره)</label>
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="أدخل للتعيين..."
                                            className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 mt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold shadow-sm">
                                {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                            </Button>
                            <Button onClick={() => router.push(`/employees/${employeeId}`)} variant="outline" type="button" className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700">
                                الغاء
                            </Button>
                        </div>

                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
