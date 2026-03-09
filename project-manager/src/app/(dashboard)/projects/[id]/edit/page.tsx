"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect, use } from "react";
import { getEmployees } from "@/actions/employees";
import { getProjectById, updateProject } from "@/actions/projects";
import { User } from "@prisma/client";
import { VirtualMultiSelect, DropdownOption } from "@/components/ui/VirtualMultiSelect";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const router = useRouter();
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [employeeRoles, setEmployeeRoles] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // We bind the projectId as the first argument to the server action
    const updateProjectWithId = updateProject.bind(null, projectId);
    const [state, formAction, isPending] = useActionState(updateProjectWithId, null);

    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const emps = await getEmployees(true);
                setEmployees(emps as unknown as User[]);

                const proj = await getProjectById(projectId);
                if (proj) {
                    setInitialData(proj);
                    const memberIds = proj.members.map((m: any) => m.userId);
                    setSelectedEmployees(memberIds);

                    const rolesMap: Record<string, string[]> = {};
                    proj.members.forEach((m: any) => {
                        rolesMap[m.userId] = m.projectRoles ? m.projectRoles.split(",").map((r: string) => r.trim()).filter(Boolean) : [];
                    });
                    setEmployeeRoles(rolesMap);
                } else {
                    toast.error("لم يتم العثور على المشروع");
                    router.push("/projects");
                }
            } catch (err) {
                console.error(err);
                toast.error("حدث خطأ في جلب البيانات");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [projectId, router]);

    useEffect(() => {
        if (state?.success) {
            toast.success("تم تحديث المشروع بنجاح", { icon: '✨' });
            sessionStorage.removeItem("projects_cache");
            setTimeout(() => {
                router.push("/projects");
            }, 500);
        }
    }, [state, router, projectId]);

    const toggleEmployee = (id: string) => {
        if (id === 'CLEAR_ALL') {
            setSelectedEmployees([]);
            setEmployeeRoles({});
            return;
        }
        setSelectedEmployees(prev => {
            if (prev.includes(id)) {
                setEmployeeRoles(roles => {
                    const newRoles = { ...roles };
                    delete newRoles[id];
                    return newRoles;
                });
                return prev.filter(empId => empId !== id);
            } else {
                setEmployeeRoles(roles => ({ ...roles, [id]: [] }));
                return [...prev, id];
            }
        });
    };

    const employeeOptions: DropdownOption[] = employees.map(emp => ({
        id: emp.id,
        label: emp.name,
        subLabel: emp.jobTitle || emp.role,
        avatar: emp.name.charAt(0)
    }));

    if (isLoading && !initialData) {
        return (
            <DashboardLayout title="تعديل المشروع">
                <div className="py-20 text-center text-gray-500 font-bold">جاري تحميل البيانات...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="تعديل المشروع">
            <div className="pb-6">
                <Card className="max-w-4xl mx-auto p-5 md:p-8 border-gray-100 shadow-sm rounded-2xl">
                    {state?.error && (
                        <div className="mb-6 p-4 text-xs md:text-sm text-red-800 rounded-xl bg-red-50 font-bold border border-red-100" role="alert">
                            {state.error}
                        </div>
                    )}

                    <form className="space-y-6 md:space-y-8" action={(formData) => {
                        const name = formData.get("name");
                        const budget = formData.get("budget");

                        if (!name) {
                            toast.error("اسم المشروع مطلوب");
                            return;
                        }

                        if (budget && Number(budget) < 0) {
                            toast.error("لا يمكن أن تكون الميزانية بالسالب");
                            return;
                        }

                        formAction(formData);
                    }}>
                        <input type="hidden" name="memberIds" value={JSON.stringify(
                            selectedEmployees.map(id => ({ id, roles: employeeRoles[id] || [] }))
                        )} />

                        <div className="space-y-4">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">التفاصيل الحالية وتعديلها</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">اسم المشروع</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        defaultValue={initialData?.name}
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                        placeholder="ادخل اسم المشروع..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">حالة المشروع</label>
                                    <select
                                        name="status"
                                        defaultValue={initialData?.status}
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium bg-white"
                                    >
                                        <option value="IN_PROGRESS">قيد التنفيذ</option>
                                        <option value="COMPLETED">مكتمل</option>
                                    </select>
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">وصف المشروع</label>
                                    <textarea
                                        name="description"
                                        rows={4}
                                        defaultValue={initialData?.description || ""}
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] resize-none text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">تحديث صورة المشروع <span className="text-gray-400 font-normal">— اختياري</span></label>
                                    <div className="flex items-center gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                        {initialData?.image ? (
                                            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200 shadow-sm">
                                                <img src={initialData.image} alt="صورة المشروع الحالية" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                name="image"
                                                accept="image/*"
                                                className="w-full text-xs md:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                                            />
                                            <p className="mt-1 text-[10px] text-gray-400">سيتم استبدال الصورة الحالية إذا قمت برفع صورة جديدة. صيغ الصور المدعومة: JPG, PNG, GIF</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">الميزانية التخطيطية (QAR) <span className="text-gray-400 font-normal">— اختياري</span></label>
                                    <input
                                        type="number"
                                        name="budget"
                                        min="0"
                                        step="0.01"
                                        defaultValue={initialData?.budget}
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium"
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium">رقم تقديري للتخطيط فقط — الميزانية الفعلية تُحوَّل من خزنة الشركة</p>
                                </div>



                                <div className="col-span-1 md:col-span-2 pt-4">
                                    <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">تعديل فريق العمل</h3>
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <VirtualMultiSelect
                                        options={employeeOptions}
                                        selectedIds={selectedEmployees}
                                        onChange={toggleEmployee}
                                        placeholder="البحث عن الموظفين بالاسم أو المسمى الوظيفي..."
                                        maxHeight={320}
                                    />

                                    {/* Role Selection for each selected employee */}
                                    {selectedEmployees.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {selectedEmployees.map(empId => {
                                                const emp = employees.find(e => e.id === empId);
                                                if (!emp) return null;
                                                const currentRoles = employeeRoles[empId] || [];
                                                const toggleRole = (r: string) => {
                                                    setEmployeeRoles(prev => ({
                                                        ...prev,
                                                        [empId]: prev[empId]?.includes(r) ? prev[empId].filter(x => x !== r) : [...(prev[empId] || []), r]
                                                    }));
                                                };
                                                return (
                                                    <div key={empId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#102550] flex items-center justify-center font-bold text-xs shrink-0">
                                                                {emp.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">{emp.name}</p>
                                                                <p className="text-[10px] sm:text-xs text-gray-500">{emp.jobTitle}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['PROJECT_EMPLOYEE', 'PROJECT_MANAGER'].map(roleOption => {
                                                                const labels: Record<string, string> = {
                                                                    'PROJECT_EMPLOYEE': 'موظف',
                                                                    'PROJECT_MANAGER': 'منسق'
                                                                };
                                                                const isActive = currentRoles.includes(roleOption);
                                                                return (
                                                                    <button
                                                                        key={roleOption}
                                                                        type="button"
                                                                        onClick={() => toggleRole(roleOption)}
                                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${isActive ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                                    >
                                                                        {labels[roleOption]}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 mt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="px-8 py-3 rounded-xl font-bold shadow-sm text-sm">
                                حفظ التعديلات
                            </Button>
                            <Button variant="outline" type="button" onClick={() => router.push(`/projects/${projectId}`)} className="flex-1 py-4 md:py-6 text-sm md:text-lg rounded-xl font-bold bg-gray-50 hover:bg-gray-100 border-transparent text-gray-700">
                                إلغاء
                            </Button>
                        </div>

                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
