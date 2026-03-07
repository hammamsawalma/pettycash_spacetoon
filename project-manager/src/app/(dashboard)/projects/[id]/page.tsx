"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FolderKanban, FileText, Wallet, Landmark, Plus, Edit, Users, ArrowDownLeft, UserCheck, Send } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { getProjectById, closeProject } from "@/actions/projects";
import { allocateBudgetToProject } from "@/actions/wallet";
import { getProjectCustodies, issueCustody } from "@/actions/custody";
import { useEffect, useState, use } from "react";
import { Project, Invoice, Purchase, User, ProjectMember } from "@prisma/client";
import { useRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

type ProjectWithDetails = Project & {
    invoices: Invoice[];
    purchases: Purchase[];
    manager: User | null;
    members: (ProjectMember & { user: User })[];
};

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const router = useRouter();
    const searchParams = useNextSearchParams();
    const { role, user } = useAuth();
    // v3: Project-scoped permission checks using AuthContext memberships
    const canEditProject = useCanDo('projects', 'edit');                          // ADMIN only
    const canCloseProject = useCanDo('projects', 'close');                        // ADMIN only
    const canIssueCustody = useCanDo('custodies', 'issue', projectId);            // ADMIN + PROJECT_ACCOUNTANT of this project
    const canAddPurchase = useCanDo('purchases', 'create', projectId);            // ADMIN + GM + PROJECT_MANAGER of this project
    const canManageMembers = useCanDo('employees', 'create');                     // ADMIN only
    const [activeTab, setActiveTab] = useState("تفاصيل المشروع");
    const [project, setProject] = useState<any>(null);
    const [isClosing, setIsClosing] = useState(false);

    // Allocate Budget Modal State
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [allocationAmount, setAllocationAmount] = useState("");
    const [allocationNote, setAllocationNote] = useState("");
    const [isAllocating, setIsAllocating] = useState(false);

    // Custody issuance state (for team tab)
    const [custodyEmployeeId, setCustodyEmployeeId] = useState("");
    const [custodyAmount, setCustodyAmount] = useState("");
    const [custodyMethod, setCustodyMethod] = useState("CASH");
    const [custodyNote, setCustodyNote] = useState("");
    const [isIssuingCustody, setIsIssuingCustody] = useState(false);
    const [projectCustodies, setProjectCustodies] = useState<any[]>([]);



    const refreshProject = () => getProjectById(projectId).then(setProject);
    const refreshCustodies = () => getProjectCustodies(projectId).then(setProjectCustodies);

    useEffect(() => {
        refreshProject();
        refreshCustodies();
    }, [projectId]);

    // فتح التبويب من URL param بعد التحميل
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "team") setActiveTab("فريق المشروع والعُهد");
    }, [searchParams]);

    if (!project) return (
        <DashboardLayout title="تفاصيل المشروع - جاري التحميل">
            <div className="py-20 text-center text-gray-500">جاري تحميل بيانات المشروع...</div>
        </DashboardLayout>
    );

    const approvedExpenses = project.invoices?.filter((i: Invoice) => i.status === 'APPROVED').reduce((acc: number, i: Invoice) => acc + i.amount, 0) || 0;
    const pendingExpenses = project.invoices?.filter((i: Invoice) => i.status === 'PENDING').reduce((acc: number, i: Invoice) => acc + i.amount, 0) || 0;
    const custodyRemaining = projectCustodies.reduce((sum, c) => sum + (c.balance || 0), 0);
    const budgetAllocated = project.budgetAllocated ?? 0;
    const expectedRemaining = budgetAllocated - approvedExpenses - pendingExpenses;

    const kpis = [
        { title: "الميزانية المخصصة", value: budgetAllocated.toLocaleString(), icon: Wallet, color: "text-[#102550]", bg: "bg-blue-50" },
        { title: "العهد المتبقية (مع الموظفين)", value: custodyRemaining.toLocaleString(), icon: Landmark, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "المصروفات المعتمدة", value: approvedExpenses.toLocaleString(), icon: FileText, color: "text-red-600", bg: "bg-red-50" },
        { title: "المتبقي المتوقع (الصافي)", value: expectedRemaining.toLocaleString(), icon: ArrowDownLeft, color: expectedRemaining < 0 ? "text-red-600" : "text-orange-600", bg: expectedRemaining < 0 ? "bg-red-50" : "bg-orange-50" },
    ];

    const userMember = project.members?.find((m: any) => m.userId === user?.id);
    const userProjectRoles = userMember ? (userMember.projectRoles || "PROJECT_EMPLOYEE").split(",") : [];
    const isProjectCoordinator = userProjectRoles.includes("PROJECT_MANAGER");
    const isProjectAccountant = role === "GLOBAL_ACCOUNTANT" || role === "GENERAL_MANAGER" || userProjectRoles.includes("PROJECT_ACCOUNTANT");

    // Dynamic tabs based on role
    const tabs = ["تفاصيل المشروع"];
    if (role === "ADMIN" || isProjectCoordinator || isProjectAccountant) {
        tabs.push("فريق المشروع والعُهد");
    }
    tabs.push("الفواتير", "المشتريات");
    if (role === "ADMIN" || role === "GLOBAL_ACCOUNTANT" || role === "GENERAL_MANAGER" || isProjectAccountant) {
        tabs.push("رواتب الموظفين");
    }
    tabs.push("شات المشروع");

    const handleCloseProject = async () => {
        if (!confirm("هل أنت متأكد من إغلاق هذا المشروع نهائياً؟ سيتم إعادة الميزانية المتبقية إلى خزنة الشركة.")) return;
        setIsClosing(true);
        const res = await closeProject(projectId);
        setIsClosing(false);
        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("تم إغلاق المشروع بنجاح");
            getProjectById(projectId).then(setProject); // Refresh
        }
    };

    const handleAllocateBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allocationAmount || isNaN(Number(allocationAmount)) || Number(allocationAmount) <= 0) {
            toast.error("مبلغ غير صحيح");
            return;
        }
        setIsAllocating(true);
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("amount", allocationAmount);
        formData.append("note", allocationNote);

        const res = await allocateBudgetToProject(null, formData);
        setIsAllocating(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("تم تخصيص الميزانية بنجاح");
            setShowAllocateModal(false);
            setAllocationAmount("");
            setAllocationNote("");
            getProjectById(projectId).then(setProject);
        }
    };



    return (
        <DashboardLayout title={`تفاصيل المشروع - ${project.name}`}>
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* KPI Grid — hidden for pure employees (USER with no coordinator/accountant role) */}
                {(role !== "USER" || isProjectCoordinator || isProjectAccountant) && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {kpis.map((kpi, i) => (
                            <Card key={i} className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 group cursor-default shadow-sm border-gray-100">
                                <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl transition-transform duration-300 md:group-hover:scale-110 shrink-0 ${kpi.bg}`}>
                                    <kpi.icon className={`h-5 w-5 md:h-6 md:w-6 ${kpi.color}`} aria-hidden="true" />
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-sm font-bold text-gray-500 mb-1">{kpi.title}</p>
                                    <p className="text-sm md:text-2xl font-black text-gray-900 drop-shadow-sm">{kpi.value}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-100 overflow-x-auto pb-px custom-scrollbar bg-white rounded-t-2xl px-2 shadow-sm">
                    <nav className="flex space-x-6 space-x-reverse min-w-max" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                  whitespace-nowrap border-b-2 py-4 px-2 text-xs md:text-sm font-bold transition-colors
                                  ${activeTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-700'
                                    }
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content: Details */}
                {activeTab === "تفاصيل المشروع" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Detailed Information */}
                        <Card className="p-5 md:p-8 lg:col-span-2 space-y-6 shadow-sm border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex items-center gap-4 w-full">
                                    {project.image ? (
                                        <img src={project.image} alt={project.name} className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0 border border-gray-100" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-[#102550] shrink-0">
                                            <FolderKanban className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">{project.name}</h3>
                                        <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">
                                            {project.description || "لا يوجد وصف."}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {(canEditProject || isProjectCoordinator) && (
                                        <Button variant="outline" onClick={() => window.location.href = `/projects/${project.id}/edit`} className="gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs">
                                            <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            تعديل
                                        </Button>
                                    )}
                                    {canManageMembers && (
                                        <Button variant="outline" onClick={() => window.location.href = `/projects/${project.id}/members`} className="gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                                            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            الأعضاء
                                        </Button>
                                    )}
                                    <span className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-lg ${project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {project.status === 'COMPLETED' ? 'مكتمل' : 'قيد التنفيذ'}
                                    </span>
                                </div>
                            </div>

                            {role !== "USER" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 border-t border-gray-100 pt-6">

                                    <div className="bg-primary/5 p-4 rounded-xl">
                                        <p className="text-[10px] md:text-xs text-primary/70 font-bold">الميزانية المخصصة الكلية (من الخزينة)</p>
                                        <p className="font-bold text-primary mt-1.5 text-xs md:text-sm">{project.budgetAllocated?.toLocaleString() || '0'} <span className="text-[10px]"><CurrencyDisplay /></span></p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-xl">
                                        <p className="text-[10px] md:text-xs text-emerald-600/70 font-bold">إجمالي ما تم سحبه للعهد</p>
                                        <p className="font-bold text-emerald-600 mt-1.5 text-xs md:text-sm">{project.custodyIssued?.toLocaleString() || '0'} <span className="text-[10px]"><CurrencyDisplay /></span></p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <p className="text-[10px] md:text-xs text-blue-400 font-bold">مدير المشروع</p>
                                        <p className="font-bold text-blue-700 mt-1.5 text-xs md:text-sm">{project.manager?.name || 'غير محدد'}</p>
                                    </div>
                                </div>
                            )}

                            {role === "USER" && (
                                <div className="grid grid-cols-1 border-t border-gray-100 pt-6">
                                    <div className="bg-blue-50 p-4 rounded-xl max-w-sm">
                                        <p className="text-[10px] md:text-xs text-blue-400 font-bold">مدير المشروع</p>
                                        <p className="font-bold text-blue-700 mt-1.5 text-xs md:text-sm">{project.manager?.name || 'غير محدد'}</p>
                                    </div>
                                </div>
                            )}

                            {canCloseProject && project.status !== "COMPLETED" && (
                                <div className="flex gap-4 border-t border-gray-100 pt-6 mt-6">
                                    <Button variant="primary" onClick={() => setShowAllocateModal(true)} className="flex-1 font-bold rounded-xl h-12">
                                        تخصيص ميزانية إضافية
                                    </Button>
                                    <Button variant="outline" onClick={handleCloseProject} disabled={isClosing} isLoading={isClosing} className="flex-1 font-bold rounded-xl h-12 text-red-600 border-red-200 hover:bg-red-50">
                                        إغلاق المشروع نهائياً
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* Metrics/Chart Card - Hidden for Employee */}
                        {role !== "USER" && (
                            <Card className="p-6 flex flex-col justify-center items-center shadow-sm border-gray-100 min-h-[300px]">
                                <h3 className="font-bold text-base md:text-lg mb-6 self-start w-full text-center">الميزانية المتبقية في المشروع (الصافي)</h3>
                                <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center rounded-full border-[6px] md:border-8 border-gray-50">
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                        <circle
                                            cx="50%" cy="50%" r="42%"
                                            fill="none"
                                            stroke={expectedRemaining < 0 ? "#ef4444" : "#102550"}
                                            strokeWidth="8%"
                                            strokeDasharray="264%"
                                            strokeDashoffset={`${Math.max(0, 264 - (264 * (budgetAllocated > 0 ? Math.max(0, expectedRemaining) / budgetAllocated : 0)))}%`}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="text-center">
                                        <p className={`text-2xl md:text-3xl font-bold ${expectedRemaining < 0 ? "text-red-600" : "text-gray-900"}`}>
                                            {budgetAllocated > 0 ? Math.max(0, Math.round((expectedRemaining / budgetAllocated) * 100)) : 0}%
                                        </p>
                                        <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-1">متبقي كنسبة</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* ─── Tab: فريق المشروع والعُهد (ADMIN + COORDINATOR + ACCOUNTANT) ─── */}
                {activeTab === "فريق المشروع والعُهد" && (role === "ADMIN" || role === "GENERAL_MANAGER" || isProjectCoordinator || isProjectAccountant) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* قائمة الأعضاء */}
                        <Card className="p-5 md:p-6 shadow-sm border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-base md:text-lg text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#102550]" />
                                    أعضاء الفريق
                                </h3>
                                <Button variant="outline" onClick={() => router.push(`/projects/${project.id}/members`)} className="text-xs h-8 px-3 gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    {role === "ADMIN" ? "تعديل الفريق" : "عرض الفريق"}
                                </Button>
                            </div>
                            {project.members?.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl">
                                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 font-medium">لا يوجد أعضاء حتى الآن</p>
                                    <Button variant="primary" className="mt-3 text-xs h-9" onClick={() => router.push(`/projects/${project.id}/members`)}>إضافة أعضاء</Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {project.members?.map((m: ProjectMember & { user: User }) => {
                                        const memberTotal = projectCustodies.filter((c: any) => c.employeeId === m.userId).reduce((s: number, c: any) => s + c.amount, 0);
                                        const memberBalance = projectCustodies.filter((c: any) => c.employeeId === m.userId).reduce((s: number, c: any) => s + c.balance, 0);
                                        const roles = ((m as any).projectRoles || "PROJECT_EMPLOYEE").split(",");
                                        const roleLabels: Record<string, string> = { PROJECT_EMPLOYEE: "موظف", PROJECT_ACCOUNTANT: "محاسب", PROJECT_MANAGER: "منسق" };
                                        return (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#102550]/10 flex items-center justify-center text-[#102550] font-black shrink-0 text-sm">
                                                        {m.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900">{m.user.name}</p>
                                                        <div className="flex gap-1 flex-wrap mt-0.5">
                                                            {roles.map((r: string) => (
                                                                <span key={r} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                                                    {roleLabels[r] || r}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-left shrink-0">
                                                    <p className="text-xs font-black text-gray-900">{memberBalance.toLocaleString()} <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span></p>
                                                    <p className="text-[10px] text-gray-400">متبقي / {memberTotal.toLocaleString()} وصل</p>
                                                    {/* Custodianship confirmation badge */}
                                                    {(() => {
                                                        const memberCustodies = projectCustodies.filter((c: any) => c.employeeId === m.userId);
                                                        const allConfirmed = memberCustodies.length > 0 && memberCustodies.every((c: any) => c.isConfirmed);
                                                        const someUnconfirmed = memberCustodies.some((c: any) => !c.isConfirmed);
                                                        if (memberCustodies.length === 0) return null;
                                                        return (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${allConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {allConfirmed ? '✓ مؤكد الاستلام' : '! لم يؤكد بعد'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {/* صرف عهدة */}
                        {canIssueCustody && (
                            <Card className="p-5 md:p-6 shadow-sm border-gray-100 space-y-5">
                                <h3 className="font-bold text-base md:text-lg text-gray-900 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-emerald-600" />
                                    صرف عهدة لموظف
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-primary/5 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-500 font-semibold">ميزانية المشروع</p>
                                        <p className="text-sm font-black text-primary">{(project.budgetAllocated ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-500 font-semibold">صُرف عُهدًا</p>
                                        <p className="text-sm font-black text-rose-600">{(project.custodyIssued ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-500 font-semibold">متاح للصرف</p>
                                        <p className="text-sm font-black text-emerald-600">{((project.budgetAllocated ?? 0) - (project.custodyIssued ?? 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                                {project.status === "COMPLETED" ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-sm font-medium">المشروع مغلق</div>
                                ) : (project.budgetAllocated ?? 0) === 0 ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                        <p className="text-sm font-bold text-amber-800">لا توجد ميزانية للمشروع بعد</p>
                                        <p className="text-xs text-amber-600 mt-1">يجب تخصيص ميزانية من خزنة الشركة أولاً</p>
                                        <Button variant="primary" className="mt-3 text-xs h-9" onClick={() => setShowAllocateModal(true)}>تخصيص ميزانية</Button>
                                    </div>
                                ) : project.members?.length === 0 ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                        <p className="text-sm font-bold text-gray-700">أضف أعضاء أولاً لكي تتمكن من صرف عهدة</p>
                                    </div>
                                ) : (
                                    <form className="space-y-3" onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (!custodyEmployeeId || !custodyAmount || Number(custodyAmount) <= 0) {
                                            toast.error("يرجى اختيار الموظف وإدخال مبلغ صحيح");
                                            return;
                                        }
                                        setIsIssuingCustody(true);
                                        const fd = new FormData();
                                        fd.append("projectId", project.id);
                                        fd.append("employeeId", custodyEmployeeId);
                                        fd.append("amount", custodyAmount);
                                        fd.append("method", custodyMethod);
                                        fd.append("note", custodyNote);
                                        const res = await issueCustody(null, fd);
                                        setIsIssuingCustody(false);
                                        if (res?.error) {
                                            toast.error(res.error);
                                        } else {
                                            toast.success("تم صرف العهدة بنجاح ✅");
                                            setCustodyEmployeeId("");
                                            setCustodyAmount("");
                                            setCustodyNote("");
                                            refreshProject();
                                            refreshCustodies();
                                        }
                                    }}>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700">اختر موظفاً</label>
                                            <select
                                                value={custodyEmployeeId}
                                                onChange={e => setCustodyEmployeeId(e.target.value)}
                                                required
                                                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm bg-white"
                                            >
                                                <option value="">— اختر من القائمة —</option>
                                                {project.members?.map((m: ProjectMember & { user: User }) => (
                                                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">المبلغ (QAR)</label>
                                                <input
                                                    type="number" required min="1" step="0.01"
                                                    value={custodyAmount}
                                                    onChange={e => setCustodyAmount(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">طريقة الصرف</label>
                                                <select
                                                    value={custodyMethod}
                                                    onChange={e => setCustodyMethod(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm bg-white"
                                                >
                                                    <option value="CASH">نقدي</option>
                                                    <option value="BANK">تحويل بنكي</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700">ملاحظة (اختيارية)</label>
                                            <input
                                                type="text"
                                                value={custodyNote}
                                                onChange={e => setCustodyNote(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm"
                                                placeholder="سبب صرف العهدة..."
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            isLoading={isIssuingCustody}
                                            disabled={isIssuingCustody}
                                            className="w-full h-11 font-bold rounded-xl gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            صرف العهدة
                                        </Button>
                                    </form>
                                )}
                            </Card>
                        )}
                    </div>
                )}

                {/* Tab: Invoices */}

                {activeTab === "الفواتير" && (
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base md:text-lg font-bold text-gray-900">فواتير المشروع</h3>
                            {(() => {
                                const isManager = project.managerId === user?.id;
                                const memberRecord = project.members?.find((m: any) => m.userId === user?.id);
                                const memberRoles = memberRecord?.projectRoles ? memberRecord.projectRoles.split(",") : [];
                                const canAddInvoice = role === "ADMIN" || role === "GLOBAL_ACCOUNTANT" || isManager || memberRoles.includes("PROJECT_EMPLOYEE") || memberRoles.includes("PROJECT_ACCOUNTANT");
                                return canAddInvoice && (
                                    <Button
                                        variant="primary"
                                        className="gap-2 text-xs md:text-sm h-9 md:h-10 px-3 md:px-4"
                                        onClick={() => window.location.href = `/invoices/new?projectId=${project.id}`}
                                    >
                                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                        إضافة فاتورة
                                    </Button>
                                );
                            })()}
                        </div>
                        {(project.invoices?.length > 0) ? (
                            <div className="space-y-4">
                                {project.invoices.map((inv: Invoice) => (
                                    <div key={inv.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-primary">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{inv.reference}</p>
                                                <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString('en-GB')}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-gray-900">{inv.amount.toLocaleString()} QAR</p>
                                            <p className={`text-[10px] md:text-xs font-bold ${inv.status === 'APPROVED' ? 'text-emerald-500' : inv.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`}>
                                                {inv.status === 'APPROVED' ? 'معتمد' : inv.status === 'REJECTED' ? 'مرفوض' : 'قيد المراجعة'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-xs md:text-sm bg-gray-50 rounded-xl">لا توجد فواتير مرتبطة بهذا المشروع.</div>
                        )}
                    </Card>
                )}

                {/* Tab: Purchases */}
                {activeTab === "المشتريات" && (
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base md:text-lg font-bold text-gray-900">مشتريات المشروع</h3>
                            {(canAddPurchase || isProjectCoordinator) && (
                                <Button
                                    variant="primary"
                                    className="gap-2 text-xs md:text-sm h-9 md:h-10 px-3 md:px-4"
                                    onClick={() => window.location.href = `/purchases/new?projectId=${project.id}`}
                                >
                                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                    إضافة طلب شراء
                                </Button>
                            )}
                        </div>
                        {(project.purchases?.length > 0) ? (
                            <div className="space-y-4">
                                {project.purchases.map((pur: Purchase) => {
                                    const isFlagged = (pur as any).isRedFlagged;
                                    return (
                                        <div
                                            key={pur.id}
                                            onClick={() => window.location.href = `/purchases/${pur.id}`}
                                            className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-[#102550]/20 ${isFlagged ? 'bg-red-50/50 hover:bg-red-50' : 'bg-gray-50 hover:bg-gray-100/80'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {pur.imageUrl ? (
                                                    <img src={pur.imageUrl} alt="صورة الطلب" className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                        <Wallet className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className={`font-bold text-sm ${isFlagged ? 'text-red-800' : 'text-gray-900'}`}>{pur.description}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">رقم الطلب: {pur.orderNumber} • {pur.deadline ? new Date(pur.deadline).toLocaleDateString('en-GB') : "بدون موعد"}</p>
                                                </div>
                                            </div>
                                            <div className="text-left flex flex-col items-end gap-2 shrink-0">
                                                <p className="font-black text-[#102550]" dir="ltr">{pur.quantity || 1} <span className="text-[10px] text-gray-500 font-bold">الكمية</span></p>
                                                <StatusBadge status={pur.status} />
                                                {(pur.status === 'REQUESTED' || pur.status === 'IN_PROGRESS') && (
                                                    <Button
                                                        variant="outline"
                                                        className="h-7 text-[10px] px-2 py-0 border-primary text-primary hover:bg-primary/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `/invoices/new?purchaseId=${pur.id}&projectId=${pur.projectId || ''}&description=${encodeURIComponent(pur.description)}`;
                                                        }}
                                                    >
                                                        إتمام الشراء
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-xs md:text-sm bg-gray-50 rounded-xl">لا توجد مشتريات مرتبطة بهذا المشروع.</div>
                        )}
                    </Card>
                )}

                {/* ─── Allocate Budget Modal ───────────────────────────── */}
                {showAllocateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">تخصيص ميزانية للمشروع</h3>
                            <form onSubmit={handleAllocateBudget} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">المبلغ (ريال)</label>
                                    <input type="number" required step="0.01" min="1"
                                        value={allocationAmount} onChange={e => setAllocationAmount(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">ملاحظات (اختياري)</label>
                                    <input type="text"
                                        value={allocationNote} onChange={e => setAllocationNote(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="سبب التخصيص..."
                                    />
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowAllocateModal(false)}>إلغاء</Button>
                                    <Button type="submit" variant="primary" disabled={isAllocating} isLoading={isAllocating}>تأكيد التخصيص</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}


            </div>
        </DashboardLayout>
    );
}


