"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, PlusSquare, Phone, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getEmployees } from "@/actions/employees";
import { User } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { matchArabicText } from "@/utils/arabic";

type EmployeeWithRelations = User & {
    _count: { memberships: number, receivedMessages: number };
};

export default function EmployeesPage() {
    const [filter, setFilter] = useState("الكل");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string>("");

    const { user } = useAuth();
    const router = useRouter();
    const canCreateEmployee = useCanDo('employees', 'create');
    // Derived from permissions.ts — replaces hardcoded role array
    const canAccess = useCanDo('employees', 'viewAll');

    useEffect(() => {
        if (user && !canAccess) {
            router.push("/");
        }
    }, [user, canAccess, router]);

    useEffect(() => {
        if (canAccess) {
            getEmployees().then(data => {
                if (!Array.isArray(data)) {
                    setErrorMsg("Invalid data received: " + typeof data);
                } else {
                    setEmployees((data as unknown as EmployeeWithRelations[]) || []);
                }
                setIsLoading(false);
            }).catch((err) => {
                console.error("GET_EMPLOYEES_ERROR", err);
                setErrorMsg(String(err));
                setIsLoading(false);
            });
        }
    }, [user, canAccess]);

    if (!user || !canAccess) return null;

    const roleMap: Record<string, string> = {
        "ADMIN": "مدير نظام",
        "USER": "موظف",
        "GLOBAL_ACCOUNTANT": "محاسب عام",
        "GENERAL_MANAGER": "المدير العام"
    };

    const filteredEmployees = employees.filter(emp => {
        const arabicRole = roleMap[emp.role] || emp.role;
        const matchesFilter = filter === "الكل" || arabicRole === filter;
        const matchesSearch = matchArabicText(debouncedSearchQuery, [
            emp.name,
            arabicRole
        ]);
        return matchesFilter && matchesSearch;
    });

    return (
        <DashboardLayout title="قائمة الموظفين">
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex bg-white rounded-xl md:rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto max-w-full custom-scrollbar w-full sm:w-auto">
                        {["الكل", "موظف", "محاسب عام", "المدير العام", "مدير نظام"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-3 md:px-4 py-2 text-xs md:text-sm font-bold rounded-lg whitespace-nowrap transition-colors flex-1 sm:flex-none ${filter === tab
                                    ? "bg-[#102550] text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                placeholder="البحث هنا..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 md:py-2 text-xs md:text-sm font-bold rounded-xl border border-gray-100 focus:outline-primary bg-white shadow-sm"
                            />
                            <Search className="absolute left-3 top-3 md:top-2.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                        </div>
                        {canCreateEmployee && <Button onClick={() => router.push('/employees/new')} variant="primary" className="gap-2 shrink-0 py-2.5 md:py-2 h-auto text-xs md:text-sm">
                            <PlusSquare className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="inline">اضافة موظف</span>
                        </Button>}
                    </div>
                </div>

                {/* Employees Grid */}
                {errorMsg && (
                    <div className="p-4 mb-6 bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                        حدث خطأ أثناء تحميل الموظفين: {errorMsg}
                    </div>
                )}
                {isLoading ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">جاري تحميل الموظفين...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">لا يوجد موظفين مطابقين للبحث.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {filteredEmployees.map(emp => {
                            const arabicRole = emp.jobTitle || roleMap[emp.role] || emp.role;
                            return (
                                <Card key={emp.id} className="p-5 md:p-6 flex flex-col items-center text-center shadow-sm border border-gray-100 hover:border-[#102550]/50 transition-all cursor-default hover:shadow-md rounded-2xl group">

                                    <div className="relative mb-4 mt-2">
                                        <div className="w-20 h-20 rounded-full border-4 border-blue-50 flex items-center justify-center bg-gray-100 text-3xl overflow-hidden shadow-sm">
                                            {emp.image ? <Image src={emp.image} alt={emp.name} fill className="object-cover" /> : "👨🏻‍💻"}
                                        </div>
                                        <span className={`absolute bottom-0 md:bottom-1 right-0 md:right-1 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 border-white bg-emerald-500`}></span>
                                    </div>

                                    <h4 className="font-bold text-base md:text-lg text-gray-900 line-clamp-1">{emp.name}</h4>
                                    <p className="text-[10px] md:text-xs text-[#102550] font-bold mt-1 bg-blue-50 px-2.5 py-1 rounded-md">{arabicRole}</p>

                                    <div className="w-full grid grid-cols-3 gap-2 mt-5 md:mt-6 mb-5 md:mb-6 bg-gray-50 rounded-xl p-3 md:p-4">
                                        <div>
                                            <p className="text-sm md:text-base font-black text-gray-900">{emp._count.memberships}</p>
                                            <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 md:mt-1 font-bold">مشاريع مسندة</p>
                                        </div>
                                        <div className="border-x border-gray-200">
                                            <p className="text-sm md:text-base font-black text-gray-900">{emp._count.receivedMessages}</p>
                                            <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 md:mt-1 font-bold">رسائل مستلمة</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm md:text-base font-black text-gray-900`}>0</p>
                                            <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 md:mt-1 font-bold">مهام متأخرة</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full mt-auto pt-4 border-t border-gray-50">
                                        <Button onClick={() => router.push(`/employees/${emp.id}`)} variant="secondary" className="flex-1 text-[11px] md:text-xs h-9 font-bold bg-white border-gray-200 hover:bg-gray-50 hover:text-[#102550]">
                                            المزيد
                                        </Button>
                                        <Button variant="secondary" className="w-9 h-9 md:w-10 md:h-10 p-0 text-[#102550] bg-blue-50 border-transparent hover:bg-blue-100 flex items-center justify-center shrink-0" onClick={() => router.push('/chat')}>
                                            <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </Button>
                                        <Button variant="secondary" className="w-9 h-9 md:w-10 md:h-10 p-0 text-emerald-600 bg-emerald-50 border-transparent hover:bg-emerald-100 flex items-center justify-center shrink-0" onClick={() => window.location.href = `tel:${emp.phone || ''}`}>
                                            <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </Button>
                                    </div>

                                </Card>
                            )
                        })}
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
