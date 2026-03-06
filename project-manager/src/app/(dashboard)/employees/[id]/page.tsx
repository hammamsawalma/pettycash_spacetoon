"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FolderKanban, CheckSquare, Clock, AlertTriangle, MessageSquare, Phone, Edit } from "lucide-react";
import { useState, useEffect, use } from "react";
import { getEmployeeById } from "@/actions/employees";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";

type EmployeeData = {
    name: string;
    jobTitle?: string | null;
    role: string;
    phone?: string | null;
    email?: string | null;
    salary?: number | null;
    memberships?: {
        id: string;
        project: {
            name: string;
            description: string | null;
            status: string;
            endDate: Date | string | null;
        };
    }[];
};

export default function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: employeeId } = use(params);
    const { role } = useAuth();
    const canEditEmployee = useCanDo('employees', 'edit');
    const [employee, setEmployee] = useState<EmployeeData | null>(null);

    useEffect(() => {
        getEmployeeById(employeeId).then(setEmployee);
    }, [employeeId]);

    if (!employee) return (
        <DashboardLayout title="تفاصيل الموظف - جاري التحميل">
            <div className="py-20 text-center text-gray-500">جاري تحميل بيانات الموظف...</div>
        </DashboardLayout>
    );

    const completedProjectsCount = employee.memberships?.filter((m: { project: { status: string } }) => m.project.status === "COMPLETED").length || 0;
    const inProgressProjectsCount = employee.memberships?.filter((m: { project: { status: string } }) => m.project.status === "IN_PROGRESS").length || 0;

    return (
        <DashboardLayout title={`تفاصيل الموظف - ${employee.name}`}>
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Profile Widget */}
                <div className="w-full lg:w-80 space-y-6">
                    <Card className="p-6 flex flex-col items-center text-center">
                        <div className="relative mb-4 mt-2">
                            <div className="w-32 h-32 rounded-full border-4 border-purple-100 flex items-center justify-center bg-gray-50 text-5xl overflow-hidden shadow-sm">
                                {employee.name?.charAt(0) || "👨🏻‍💼"}
                            </div>
                            <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-green-500 border-2 border-white"></span>
                        </div>

                        {canEditEmployee && (
                            <Button variant="outline" size="sm" onClick={() => window.location.href = `/employees/${employeeId}/edit`} className="mb-4 gap-2 h-8 text-xs font-bold w-full rounded-xl">
                                <Edit className="w-3.5 h-3.5" />
                                تعديل بيانات الموظف
                            </Button>
                        )}

                        <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
                        <p className="text-[#7F56D9] font-semibold mt-1 mb-4">{employee.jobTitle || employee.role}</p>

                        <div className="w-full text-right mt-6 space-y-4">
                            <div>
                                <p className="text-xs text-gray-500">رقم الهاتف</p>
                                <p className="font-medium text-gray-900 mt-1" dir="ltr">{employee.phone || "غير محدد"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">البريد الالكتروني</p>
                                <p className="font-medium text-gray-900 mt-1">{employee.email || "غير محدد"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">الراتب المتفق عليه</p>
                                <p className="font-bold text-[#7F56D9] mt-1 text-lg">QAR {employee.salary?.toLocaleString() || "0"}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full mt-6 pt-6 border-t border-gray-100">
                            <Link href="/chat" className="flex-1">
                                <Button variant="primary" className="w-full gap-2 bg-[#7F56D9] hover:bg-purple-700">
                                    <MessageSquare className="w-4 h-4" />
                                    ارسال رسالة
                                </Button>
                            </Link>
                            <Button variant="outline" className="px-4 border-gray-200 text-gray-600 hover:text-[#7F56D9]">
                                <Phone className="w-5 h-5" />
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Main Stats and Projects */}
                <div className="flex-1 space-y-6">

                    {/* Performance KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4 flex items-center gap-4 bg-purple-50/50 border-purple-100">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                                <FolderKanban className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{employee.memberships?.length || 0}</p>
                                <p className="text-xs text-gray-600">اجمالي المشاريع</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4 bg-green-50/50 border-green-100">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-green-600 shadow-sm shrink-0">
                                <CheckSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{completedProjectsCount}</p>
                                <p className="text-xs text-gray-600">مشاريع مكتملة</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4 bg-blue-50/50 border-blue-100">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{inProgressProjectsCount}</p>
                                <p className="text-xs text-gray-600">قيد التنفيذ</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4 bg-red-50/50 border-red-100">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-red-600 shadow-sm shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">0</p>
                                <p className="text-xs text-gray-600">مهام متأخرة</p>
                            </div>
                        </Card>
                    </div>

                    {/* Assigned Projects */}
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-lg text-gray-900">المشاريع الحالية</h3>
                            <Link href="/projects" className="text-sm text-[#7F56D9] font-medium hover:underline">عرض الكل</Link>
                        </div>

                        <div className="space-y-4">
                            {employee.memberships?.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-sm">لا توجد مشاريع مسندة إلى هذا الموظف حالياً.</div>
                            ) : employee.memberships?.map((m: { id: string, project: { name: string, description: string | null, status: string, endDate: Date | string | null } }) => (
                                <div key={m.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-[#7F56D9] transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#7F56D9] transition-colors">{m.project.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{m.project.description || "لا يوجد وصف"}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${m.project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {m.project.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-500">التقدم:</span>
                                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${m.project.status === 'COMPLETED' ? 'bg-green-500 w-full' : 'bg-[#7F56D9] w-1/2'}`}></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">{m.project.status === 'COMPLETED' ? '100%' : '50%'}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            تاريخ الانتهاء: {m.project.endDate ? new Date(m.project.endDate).toLocaleDateString("en-GB") : "غير محدد"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>
            </div>
        </DashboardLayout>
    );
}
