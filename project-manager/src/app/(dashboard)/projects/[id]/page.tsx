"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FolderKanban, FileText, Wallet, Landmark, Plus, Edit, Users, ArrowDownLeft, UserCheck, Send, Trash2, Undo2, Bell } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCanDo } from "@/components/auth/Protect";
import { getProjectById, closeProject, softDeleteProject } from "@/actions/projects";
import { allocateBudgetToProject } from "@/actions/wallet";
import { getProjectCustodies, issueCustody, returnCustodyBalance, resendCustodyReminder } from "@/actions/custody";
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
    const { locale } = useLanguage();
    // v4: Project-scoped permission checks using AuthContext memberships
    const canEditProject = useCanDo('projects', 'edit');                          // ADMIN only
    const canCloseProject = useCanDo('projects', 'close');                        // ADMIN only
    const canIssueCustody = useCanDo('custodies', 'issue');                       // ADMIN + GLOBAL_ACCOUNTANT
    const canAddPurchase = useCanDo('purchases', 'create', projectId);            // ADMIN + GM + PROJECT_MANAGER of this project
    const canManageMembers = useCanDo('employees', 'create');                     // ADMIN only
    const [activeTab, setActiveTab] = useState(locale === 'ar' ? "تفاصيل المشروع" : "Project Details");
    const [project, setProject] = useState<any>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
    // v5: External custody
    const [isExternalCustody, setIsExternalCustody] = useState(false);
    const [externalName, setExternalName] = useState("");
    const [externalPhone, setExternalPhone] = useState("");
    const [externalPurpose, setExternalPurpose] = useState("");
    const [projectCustodies, setProjectCustodies] = useState<any[]>([]);

    // F-1: Custody return modal
    const [returnModal, setReturnModal] = useState<{ custodyId: string; balance: number; employeeName: string } | null>(null);
    const [returnAmount, setReturnAmount] = useState("");
    const [returnNote, setReturnNote] = useState("");
    const [isReturning, setIsReturning] = useState(false);



    const refreshProject = () => getProjectById(projectId).then(setProject);
    const refreshCustodies = () => getProjectCustodies(projectId).then(setProjectCustodies);

    useEffect(() => {
        refreshProject();
        refreshCustodies();
    }, [projectId]);

    // فتح التبويب من URL param بعد التحميل
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "team") setActiveTab(locale === 'ar' ? "فريق المشروع والعُهد" : "Team & Custodies");
    }, [searchParams]);

    if (!project) return (
        <DashboardLayout title={locale === 'ar' ? "تفاصيل المشروع - جاري التحميل" : "Project Details - Loading"}>
            <div className="py-20 text-center text-gray-500">{locale === 'ar' ? 'جاري تحميل بيانات المشروع...' : 'Loading project data...'}</div>
        </DashboardLayout>
    );

    const approvedExpenses = project.invoices?.filter((i: Invoice) => i.status === 'APPROVED').reduce((acc: number, i: Invoice) => acc + i.amount, 0) || 0;
    const pendingExpenses = project.invoices?.filter((i: Invoice) => i.status === 'PENDING').reduce((acc: number, i: Invoice) => acc + i.amount, 0) || 0;
    const custodyRemaining = projectCustodies.reduce((sum, c) => sum + (c.balance || 0), 0);
    const budgetAllocated = project.budgetAllocated ?? 0;
    const expectedRemaining = budgetAllocated - approvedExpenses - pendingExpenses;

    const kpis = [
        { title: locale === 'ar' ? "الميزانية المخصصة" : "Allocated Budget", value: budgetAllocated.toLocaleString('en-US'), icon: Wallet, color: "text-[#102550]", bg: "bg-blue-50" },
        { title: locale === 'ar' ? "العهد المتبقية (مع الموظفين)" : "Remaining Custodies (With Employees)", value: custodyRemaining.toLocaleString('en-US'), icon: Landmark, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: locale === 'ar' ? "المصروفات المعتمدة" : "Approved Expenses", value: approvedExpenses.toLocaleString('en-US'), icon: FileText, color: "text-red-600", bg: "bg-red-50" },
        { title: locale === 'ar' ? "المتبقي المتوقع (الصافي)" : "Expected Remaining (Net)", value: expectedRemaining.toLocaleString('en-US'), icon: ArrowDownLeft, color: expectedRemaining < 0 ? "text-red-600" : "text-orange-600", bg: expectedRemaining < 0 ? "bg-red-50" : "bg-orange-50" },
    ];

    const userMember = project.members?.find((m: any) => m.userId === user?.id);
    const userProjectRoles = userMember ? (userMember.projectRoles || "PROJECT_EMPLOYEE").split(",") : [];
    const isProjectCoordinator = userProjectRoles.includes("PROJECT_MANAGER");
    // v4: GLOBAL_ACCOUNTANT handles all projects directly
    const isFinancialViewer = role === "GLOBAL_ACCOUNTANT" || role === "GENERAL_MANAGER";

    // Dynamic tabs based on role
    const tabs = [locale === 'ar' ? "تفاصيل المشروع" : "Project Details"];
    if (role === "ADMIN" || isProjectCoordinator || isFinancialViewer) {
        tabs.push(locale === 'ar' ? "فريق المشروع والعُهد" : "Team & Custodies");
    }
    tabs.push(locale === 'ar' ? "الفواتير" : "Invoices", locale === 'ar' ? "المشتريات" : "Purchases");

    const handleCloseProject = async () => {
        if (!confirm(locale === 'ar' ? "هل أنت متأكد من إغلاق هذا المشروع نهائياً؟ سيتم إعادة الميزانية المتبقية إلى خزنة الشركة." : "Are you sure you want to close this project permanently? Remaining budget will be returned to company vault.")) return;
        setIsClosing(true);
        const res = await closeProject(projectId);
        setIsClosing(false);
        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success(locale === 'ar' ? "تم إغلاق المشروع بنجاح" : "Project closed successfully");
            getProjectById(projectId).then(setProject); // Refresh
        }
    };

    const handleDeleteProject = async () => {
        if (!confirm(locale === 'ar' ? "هل أنت متأكد من نقل هذا المشروع إلى سلة المهملات؟" : "Are you sure you want to move this project to trash?")) return;
        setIsDeleting(true);
        const res = await softDeleteProject(projectId);
        setIsDeleting(false);
        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success(locale === 'ar' ? "تم نقل المشروع إلى سلة المهملات" : "Project moved to trash");
            router.push('/projects');
        }
    };

    const handleAllocateBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allocationAmount || isNaN(Number(allocationAmount)) || Number(allocationAmount) <= 0) {
            toast.error(locale === 'ar' ? "مبلغ غير صحيح" : "Invalid amount");
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
            toast.success(locale === 'ar' ? "تم تخصيص الميزانية بنجاح" : "Budget allocated successfully");
            setShowAllocateModal(false);
            setAllocationAmount("");
            setAllocationNote("");
            getProjectById(projectId).then(setProject);
        }
    };



    return (
        <DashboardLayout title={locale === 'ar' ? `تفاصيل المشروع - ${project.name}` : `Project Details - ${project.name}`}>
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* KPI Grid — hidden for pure employees (USER with no coordinator/accountant role) */}
                {(role !== "USER" || isProjectCoordinator || isFinancialViewer) && (
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
                {activeTab === (locale === 'ar' ? "تفاصيل المشروع" : "Project Details") && (
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
                                            {project.description || (locale === 'ar' ? "لا يوجد وصف." : "No description.")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {(canEditProject || isProjectCoordinator) && (
                                        <Button variant="outline" onClick={() => window.location.href = `/projects/${project.id}/edit`} className="gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs">
                                            <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            {locale === 'ar' ? 'تعديل' : 'Edit'}
                                        </Button>
                                    )}
                                    {canManageMembers && (
                                        <Button variant="outline" onClick={() => window.location.href = `/projects/${project.id}/members`} className="gap-2 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs text-blue-600 border-blue-200 hover:bg-blue-50">
                                            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            {locale === 'ar' ? 'الأعضاء' : 'Members'}
                                        </Button>
                                    )}
                                    <span className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-lg ${project.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {project.status === 'COMPLETED' ? (locale === 'ar' ? 'مكتمل' : 'Completed') : (locale === 'ar' ? 'قيد التنفيذ' : 'In Progress')}
                                    </span>
                                    {canCloseProject && (
                                        <Button variant="outline" onClick={handleDeleteProject} disabled={isDeleting} isLoading={isDeleting} className="gap-1.5 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs text-red-600 border-red-200 hover:bg-red-50">
                                            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            {locale === 'ar' ? 'حذف' : 'Delete'}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {role !== "USER" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 border-t border-gray-100 pt-6">

                                    <div className="bg-primary/5 p-4 rounded-xl">
                                        <p className="text-[10px] md:text-xs text-primary/70 font-bold">{locale === 'ar' ? 'الميزانية المخصصة الكلية (من الخزينة)' : 'Total Allocated Budget (From Vault)'}</p>
                                        <p className="font-bold text-primary mt-1.5 text-xs md:text-sm">{project.budgetAllocated?.toLocaleString('en-US') || '0'} <span className="text-[10px]"><CurrencyDisplay /></span></p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-xl">
                                        <p className="text-[10px] md:text-xs text-emerald-600/70 font-bold">{locale === 'ar' ? 'إجمالي ما تم سحبه للعهد' : 'Total Custody Issued'}</p>
                                        <p className="font-bold text-emerald-600 mt-1.5 text-xs md:text-sm">{project.custodyIssued?.toLocaleString('en-US') || '0'} <span className="text-[10px]"><CurrencyDisplay /></span></p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <p className="text-[10px] md:text-xs text-blue-400 font-bold">{locale === 'ar' ? 'مدير المشروع' : 'Project Manager'}</p>
                                        <p className="font-bold text-blue-700 mt-1.5 text-xs md:text-sm">{project.manager?.name || (locale === 'ar' ? 'غير محدد' : 'Not assigned')}</p>
                                    </div>
                                </div>
                            )}

                            {role === "USER" && (
                                <div className="grid grid-cols-1 border-t border-gray-100 pt-6">
                                    <div className="bg-blue-50 p-4 rounded-xl max-w-sm">
                                        <p className="text-[10px] md:text-xs text-blue-400 font-bold">{locale === 'ar' ? 'مدير المشروع' : 'Project Manager'}</p>
                                        <p className="font-bold text-blue-700 mt-1.5 text-xs md:text-sm">{project.manager?.name || (locale === 'ar' ? 'غير محدد' : 'Not assigned')}</p>
                                    </div>
                                </div>
                            )}

                            {canCloseProject && project.status !== "COMPLETED" && (
                                <div className="flex gap-4 border-t border-gray-100 pt-6 mt-6">
                                    <Button variant="primary" onClick={() => setShowAllocateModal(true)} className="flex-1 font-bold rounded-xl h-12">
                                        {locale === 'ar' ? 'تخصيص ميزانية إضافية' : 'Allocate Additional Budget'}
                                    </Button>
                                    <Button variant="outline" onClick={handleCloseProject} disabled={isClosing} isLoading={isClosing} className="flex-1 font-bold rounded-xl h-12 text-red-600 border-red-200 hover:bg-red-50">
                                        {locale === 'ar' ? 'إغلاق المشروع نهائياً' : 'Close Project Permanently'}
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* Metrics/Chart Card - Hidden for Employee */}
                        {role !== "USER" && (
                            <Card className="p-6 flex flex-col justify-center items-center shadow-sm border-gray-100 min-h-[300px]">
                                <h3 className="font-bold text-base md:text-lg mb-6 self-start w-full text-center">{locale === 'ar' ? 'الميزانية المتبقية في المشروع (الصافي)' : 'Remaining Project Budget (Net)'}</h3>
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
                                        <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-1">{locale === 'ar' ? 'متبقي كنسبة' : 'Remaining %'}</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* ─── Tab: فريق المشروع والعُهد (ADMIN + COORDINATOR + ACCOUNTANT) ─── */}
                {activeTab === (locale === 'ar' ? "فريق المشروع والعُهد" : "Team & Custodies") && (role === "ADMIN" || role === "GENERAL_MANAGER" || isProjectCoordinator || isFinancialViewer) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* قائمة الأعضاء */}
                        <Card className="p-5 md:p-6 shadow-sm border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-base md:text-lg text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#102550]" />
                                    {locale === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                                </h3>
                                <Button variant="outline" onClick={() => router.push(`/projects/${project.id}/members`)} className="text-xs h-8 px-3 gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5" />
                                    {role === "ADMIN" ? (locale === 'ar' ? "تعديل الفريق" : "Edit Team") : (locale === 'ar' ? "عرض الفريق" : "View Team")}
                                </Button>
                            </div>
                            {project.members?.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl">
                                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 font-medium">{locale === 'ar' ? 'لا يوجد أعضاء حتى الآن' : 'No members yet'}</p>
                                    <Button variant="primary" className="mt-3 text-xs h-9" onClick={() => router.push(`/projects/${project.id}/members`)}>{locale === 'ar' ? 'إضافة أعضاء' : 'Add Members'}</Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {project.members?.map((m: ProjectMember & { user: User }) => {
                                        const memberTotal = projectCustodies.filter((c: any) => c.employeeId === m.userId).reduce((s: number, c: any) => s + c.amount, 0);
                                        const memberBalance = projectCustodies.filter((c: any) => c.employeeId === m.userId).reduce((s: number, c: any) => s + c.balance, 0);
                                        const roles = ((m as any).projectRoles || "PROJECT_EMPLOYEE").split(",");
                                        const roleLabels: Record<string, string> = locale === 'ar' ? { PROJECT_EMPLOYEE: "موظف", PROJECT_MANAGER: "منسق المشتريات" } : { PROJECT_EMPLOYEE: "Employee", PROJECT_MANAGER: "Purchase Coordinator" };
                                        return (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#102550]/10 flex items-center justify-center text-[#102550] shrink-0 text-sm">
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
                                                    <p className="text-xs font-black text-gray-900">{memberBalance.toLocaleString('en-US')} <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span></p>
                                                    <p className="text-[10px] text-gray-400">{locale === 'ar' ? 'متبقي' : 'Remaining'} / {memberTotal.toLocaleString('en-US')} {locale === 'ar' ? 'وصل' : 'received'}</p>
                                                    {/* Custodianship confirmation badge */}
                                                    {(() => {
                                                        const memberCustodies = projectCustodies.filter((c: any) => c.employeeId === m.userId);
                                                        const allConfirmed = memberCustodies.length > 0 && memberCustodies.every((c: any) => c.isConfirmed);
                                                        const someUnconfirmed = memberCustodies.some((c: any) => !c.isConfirmed);
                                                        if (memberCustodies.length === 0) return null;
                                                        return (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block ${allConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {allConfirmed ? (locale === 'ar' ? '✓ مؤكد الاستلام' : '✓ Confirmed') : (locale === 'ar' ? '! لم يؤكد بعد' : '! Unconfirmed')}
                                                            </span>
                                                        );
                                                    })()}
                                                    {/* F-1 + F-6: Admin custody actions */}
                                                    {canIssueCustody && (() => {
                                                        const memberCustodies = projectCustodies.filter((c: any) => c.employeeId === m.userId);
                                                        if (memberCustodies.length === 0) return null;
                                                        const hasUnconfirmed = memberCustodies.some((c: any) => !c.isConfirmed);
                                                        const hasBalance = memberBalance > 0;
                                                        return (
                                                            <div className="flex gap-1.5 mt-1">
                                                                {hasBalance && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const activeCustody = memberCustodies.find((c: any) => c.balance > 0 && c.isConfirmed && !c.isClosed);
                                                                            if (activeCustody) {
                                                                                setReturnModal({ custodyId: activeCustody.id, balance: activeCustody.balance, employeeName: m.user.name });
                                                                                setReturnAmount(activeCustody.balance.toString());
                                                                                setReturnNote("");
                                                                            }
                                                                        }}
                                                                        className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold hover:bg-blue-200 transition-colors flex items-center gap-0.5"
                                                                    >
                                                                        <Undo2 className="w-2.5 h-2.5" /> {locale === 'ar' ? 'إرجاع' : 'Return'}
                                                                    </button>
                                                                )}
                                                                {hasUnconfirmed && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const unconfirmed = memberCustodies.find((c: any) => !c.isConfirmed);
                                                                            if (!unconfirmed) return;
                                                                            const res = await resendCustodyReminder(unconfirmed.id);
                                                                            if (res?.error) toast.error(res.error);
                                                                            else { toast.success(locale === 'ar' ? "تم إرسال تذكير للموظف ✅" : "Reminder sent to employee ✅"); }
                                                                        }}
                                                                        className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 transition-colors flex items-center gap-0.5"
                                                                    >
                                                                        <Bell className="w-2.5 h-2.5" /> {locale === 'ar' ? 'تذكير' : 'Remind'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* v5: GAP-5 — External custodies badge */}
                                    {projectCustodies.filter((c: any) => c.isExternal).length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-orange-100">
                                            <p className="text-xs font-bold text-orange-700 mb-2">{locale === 'ar' ? '🏢 عهد خارجية' : '🏢 External Custodies'}</p>
                                            {projectCustodies.filter((c: any) => c.isExternal).map((c: any) => (
                                                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 mb-2">
                                                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-bold text-orange-600">خ</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{c.externalName || (locale === 'ar' ? "طرف خارجي" : "External Party")}</p>
                                                        {c.externalPurpose && <p className="text-[10px] text-gray-500 truncate">{c.externalPurpose}</p>}
                                                    </div>
                                                    <div className="text-left shrink-0">
                                                        <p className="text-xs font-black text-gray-900">{c.balance?.toLocaleString('en-US')} <span className="text-[10px] text-gray-400"><CurrencyDisplay /></span></p>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 inline-block">{locale === 'ar' ? 'خارجي' : 'External'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* صرف عهدة */}
                        {canIssueCustody && (
                            <Card className="p-5 md:p-6 shadow-sm border-gray-100 space-y-5">
                                <h3 className="font-bold text-base md:text-lg text-gray-900 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-emerald-600" />
                                    {locale === 'ar' ? 'صرف عهدة لموظف' : 'Issue Custody to Employee'}
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-primary/5 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-500 font-semibold">{locale === 'ar' ? 'ميزانية المشروع' : 'Project Budget'}</p>
                                        <p className="text-sm font-black text-primary">{(project.budgetAllocated ?? 0).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-500 font-semibold">{locale === 'ar' ? 'صُرف عُهدًا' : 'Issued as Custody'}</p>
                                        <p className="text-sm font-black text-rose-600">{(project.custodyIssued ?? 0).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-500 font-semibold">{locale === 'ar' ? 'متاح للصرف' : 'Available to Issue'}</p>
                                        <p className="text-sm font-black text-emerald-600">{((project.budgetAllocated ?? 0) - (project.custodyIssued ?? 0)).toLocaleString('en-US')}</p>
                                    </div>
                                </div>
                                {project.status === "COMPLETED" ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl text-gray-400 text-sm font-medium">{locale === 'ar' ? 'المشروع مغلق' : 'Project Closed'}</div>
                                ) : (project.budgetAllocated ?? 0) === 0 ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                        <p className="text-sm font-bold text-amber-800">{locale === 'ar' ? 'لا توجد ميزانية للمشروع بعد' : 'No budget allocated yet'}</p>
                                        <p className="text-xs text-amber-600 mt-1">{locale === 'ar' ? 'يجب تخصيص ميزانية من خزنة الشركة أولاً' : 'Budget must be allocated from company vault first'}</p>
                                        <Button variant="primary" className="mt-3 text-xs h-9" onClick={() => setShowAllocateModal(true)}>{locale === 'ar' ? 'تخصيص ميزانية' : 'Allocate Budget'}</Button>
                                    </div>
                                ) : project.members?.length === 0 ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                        <p className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'أضف أعضاء أولاً لكي تتمكن من صرف عهدة' : 'Add members first to issue custody'}</p>
                                    </div>
                                ) : (
                                    <form className="space-y-3" onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (!isExternalCustody && (!custodyEmployeeId || !custodyAmount || Number(custodyAmount) <= 0)) {
                                            toast.error(locale === 'ar' ? "يرجى اختيار الموظف وإدخال مبلغ صحيح" : "Please select an employee and enter a valid amount");
                                            return;
                                        }
                                        if (isExternalCustody && (!externalName.trim() || !custodyAmount || Number(custodyAmount) <= 0)) {
                                            toast.error(locale === 'ar' ? "يرجى إدخال اسم الطرف الخارجي والمبلغ" : "Please enter external party name and amount");
                                            return;
                                        }
                                        setIsIssuingCustody(true);
                                        const fd = new FormData();
                                        fd.append("projectId", project.id);
                                        fd.append("amount", custodyAmount);
                                        fd.append("method", custodyMethod);
                                        fd.append("note", custodyNote);
                                        if (isExternalCustody) {
                                            fd.append("isExternal", "true");
                                            fd.append("externalName", externalName);
                                            fd.append("externalPhone", externalPhone);
                                            fd.append("externalPurpose", externalPurpose);
                                        } else {
                                            fd.append("employeeId", custodyEmployeeId);
                                        }
                                        const res = await issueCustody(null, fd);
                                        setIsIssuingCustody(false);
                                        if (res?.error) {
                                            toast.error(res.error);
                                        } else {
                                            toast.success(isExternalCustody ? (locale === 'ar' ? "تم صرف العهدة الخارجية بنجاح ✅" : "External custody issued successfully ✅") : (locale === 'ar' ? "تم صرف العهدة بنجاح ✅" : "Custody issued successfully ✅"));
                                            setCustodyEmployeeId("");
                                            setCustodyAmount("");
                                            setCustodyNote("");
                                            setExternalName("");
                                            setExternalPhone("");
                                            setExternalPurpose("");
                                            setIsExternalCustody(false);
                                            refreshProject();
                                            refreshCustodies();
                                        }
                                    }}>
                                        {/* v5: External custody toggle */}
                                        <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isExternalCustody}
                                                    onChange={e => { setIsExternalCustody(e.target.checked); setCustodyEmployeeId(""); }}
                                                    className="w-4 h-4 rounded accent-orange-600"
                                                />
                                                <span className="text-sm font-bold text-orange-900">{locale === 'ar' ? 'عهدة خارجية' : 'External Custody'}</span>
                                            </label>
                                            <span className="text-[10px] text-orange-600">{isExternalCustody ? (locale === 'ar' ? "طرف خارجي — تأكيد تلقائي" : "External party — auto-confirmed") : (locale === 'ar' ? "موظف داخلي" : "Internal employee")}</span>
                                        </div>

                                        {isExternalCustody ? (
                                            /* v5: External party fields */
                                            <div className="space-y-3 bg-orange-50/30 rounded-xl p-3 border border-orange-100">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'اسم الطرف الخارجي *' : 'External Party Name *'}</label>
                                                    <input type="text" required value={externalName} onChange={e => setExternalName(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-orange-400 text-sm" placeholder={locale === 'ar' ? "اسم الشخص أو المؤسسة..." : "Person or organization name..."} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                                                        <input type="tel" value={externalPhone} onChange={e => setExternalPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-orange-400 text-sm" placeholder="05XXXXXXXX" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'الغرض' : 'Purpose'}</label>
                                                        <input type="text" value={externalPurpose} onChange={e => setExternalPurpose(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-orange-400 text-sm" placeholder={locale === 'ar' ? "سبب العهدة..." : "Custody reason..."} />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Internal employee selector */
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'اختر موظفاً' : 'Select Employee'}</label>
                                                <select
                                                    value={custodyEmployeeId}
                                                    onChange={e => setCustodyEmployeeId(e.target.value)}
                                                    required={!isExternalCustody}
                                                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm bg-white"
                                                >
                                                    <option value="">{locale === 'ar' ? '— اختر من القائمة —' : '— Select from list —'}</option>
                                                    {project.members?.filter((m: any) =>
                                                        (m.projectRoles || "PROJECT_EMPLOYEE").includes("PROJECT_EMPLOYEE")
                                                    ).map((m: ProjectMember & { user: User }) => (
                                                        <option key={m.userId} value={m.userId}>{m.user.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'المبلغ' : 'Amount'} (<CurrencyDisplay />)</label>
                                                <input
                                                    type="number" required min="1" step="0.01"
                                                    value={custodyAmount}
                                                    onChange={e => setCustodyAmount(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'طريقة الصرف' : 'Payment Method'}</label>
                                                <select
                                                    value={custodyMethod}
                                                    onChange={e => setCustodyMethod(e.target.value)}
                                                    className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm bg-white"
                                                >
                                                    <option value="CASH">{locale === 'ar' ? 'نقدي' : 'Cash'}</option>
                                                    <option value="BANK">{locale === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'ملاحظة (اختيارية)' : 'Note (Optional)'}</label>
                                            <input
                                                type="text"
                                                value={custodyNote}
                                                onChange={e => setCustodyNote(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm"
                                                placeholder={locale === 'ar' ? "سبب صرف العهدة..." : "Custody reason..."}
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
                                            {locale === 'ar' ? 'صرف العهدة' : 'Issue Custody'}
                                        </Button>
                                    </form>
                                )}
                            </Card>
                        )}
                    </div>
                )}

                {/* Tab: Invoices */}

                {activeTab === (locale === 'ar' ? "الفواتير" : "Invoices") && (
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base md:text-lg font-bold text-gray-900">{locale === 'ar' ? 'فواتير المشروع' : 'Project Invoices'}</h3>
                            {(() => {
                                const isManager = project.managerId === user?.id;
                                const memberRecord = project.members?.find((m: any) => m.userId === user?.id);
                                const memberRoles = memberRecord?.projectRoles ? memberRecord.projectRoles.split(",") : [];
                                const canAddInvoice = role === "ADMIN" || role === "GLOBAL_ACCOUNTANT" || isManager || memberRoles.includes("PROJECT_EMPLOYEE");
                                return canAddInvoice && (
                                    <Button
                                        variant="primary"
                                        className="gap-2 text-xs md:text-sm h-9 md:h-10 px-3 md:px-4"
                                        onClick={() => window.location.href = `/invoices/new?projectId=${project.id}`}
                                    >
                                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                        {locale === 'ar' ? 'إضافة فاتورة' : 'Add Invoice'}
                                    </Button>
                                );
                            })()}
                        </div>
                        {(project.invoices?.length > 0) ? (
                            <div className="space-y-4">
                                {project.invoices.map((inv: Invoice) => (
                                    <div key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100/80 transition-colors border border-transparent hover:border-[#102550]/20">
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
                                            <p className="font-black text-gray-900">{inv.amount.toLocaleString('en-US')} <span className="text-xs"><CurrencyDisplay /></span></p>
                                            <p className={`text-[10px] md:text-xs font-bold ${inv.status === 'APPROVED' ? 'text-emerald-500' : inv.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`}>
                                                {inv.status === 'APPROVED' ? (locale === 'ar' ? 'معتمد' : 'Approved') : inv.status === 'REJECTED' ? (locale === 'ar' ? 'مرفوض' : 'Rejected') : (locale === 'ar' ? 'قيد المراجعة' : 'Under Review')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-xs md:text-sm bg-gray-50 rounded-xl">{locale === 'ar' ? 'لا توجد فواتير مرتبطة بهذا المشروع.' : 'No invoices linked to this project.'}</div>
                        )}
                    </Card>
                )}

                {/* Tab: Purchases */}
                {activeTab === (locale === 'ar' ? "المشتريات" : "Purchases") && (
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base md:text-lg font-bold text-gray-900">{locale === 'ar' ? 'مشتريات المشروع' : 'Project Purchases'}</h3>
                            {(canAddPurchase || isProjectCoordinator) && (
                                <Button
                                    variant="primary"
                                    className="gap-2 text-xs md:text-sm h-9 md:h-10 px-3 md:px-4"
                                    onClick={() => window.location.href = `/purchases/new?projectId=${project.id}`}
                                >
                                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                                    {locale === 'ar' ? 'إضافة طلب شراء' : 'Add Purchase Request'}
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
                                                    <img src={pur.imageUrl} alt={locale === 'ar' ? "صورة الطلب" : "Purchase image"} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                        <Wallet className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className={`font-bold text-sm ${isFlagged ? 'text-red-800' : 'text-gray-900'}`}>{pur.description}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{locale === 'ar' ? 'رقم الطلب:' : 'Order #:'} {pur.orderNumber} • {pur.deadline ? new Date(pur.deadline).toLocaleDateString('en-GB') : (locale === 'ar' ? "بدون موعد" : "No deadline")}</p>
                                                </div>
                                            </div>
                                            <div className="text-left flex flex-col items-end gap-2 shrink-0">
                                                <p className="font-black text-[#102550]" dir="ltr">{pur.quantity || 1} <span className="text-[10px] text-gray-500 font-bold">{locale === 'ar' ? 'الكمية' : 'Qty'}</span></p>
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
                                                        {locale === 'ar' ? 'إتمام الشراء' : 'Complete Purchase'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-xs md:text-sm bg-gray-50 rounded-xl">{locale === 'ar' ? 'لا توجد مشتريات مرتبطة بهذا المشروع.' : 'No purchases linked to this project.'}</div>
                        )}
                    </Card>
                )}

                {/* ─── Allocate Budget Modal ───────────────────────────── */}


                {showAllocateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{locale === 'ar' ? 'تخصيص ميزانية للمشروع' : 'Allocate Budget to Project'}</h3>
                            <form onSubmit={handleAllocateBudget} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'المبلغ' : 'Amount'} (<CurrencyDisplay />)</label>
                                    <input type="number" required step="0.01" min="1"
                                        value={allocationAmount} onChange={e => setAllocationAmount(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}</label>
                                    <input type="text"
                                        value={allocationNote} onChange={e => setAllocationNote(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder={locale === 'ar' ? "سبب التخصيص..." : "Allocation reason..."}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowAllocateModal(false)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                                    <Button type="submit" variant="primary" disabled={isAllocating} isLoading={isAllocating}>{locale === 'ar' ? 'تأكيد التخصيص' : 'Confirm Allocation'}</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}


                {/* F-1: Return Custody Modal */}
                {returnModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{locale === 'ar' ? 'إرجاع رصيد عهدة' : 'Return Custody Balance'}</h3>
                            <p className="text-sm text-gray-500 mb-4">{locale === 'ar' ? 'إرجاع مبلغ من عهدة' : 'Return amount from custody of'} <strong>{returnModal.employeeName}</strong></p>
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-xl text-sm">
                                    <span className="font-bold text-blue-800">{locale === 'ar' ? 'الرصيد المتاح: ' : 'Available Balance: '}</span>
                                    <span className="font-black text-blue-900">{returnModal.balance.toLocaleString('en-US')} <CurrencyDisplay /></span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'المبلغ المُرجَع' : 'Return Amount'}</label>
                                    <input type="number" required step="0.01" min="1" max={returnModal.balance}
                                        value={returnAmount} onChange={e => setReturnAmount(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}</label>
                                    <input type="text"
                                        value={returnNote} onChange={e => setReturnNote(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder={locale === 'ar' ? "سبب الإرجاع..." : "Return reason..."}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" onClick={() => setReturnModal(null)}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                                    <Button type="button" variant="primary" disabled={isReturning} isLoading={isReturning}
                                        onClick={async () => {
                                            const amt = parseFloat(returnAmount);
                                            if (!amt || amt <= 0) { toast.error(locale === 'ar' ? "أدخل مبلغ صحيح" : "Enter a valid amount"); return; }
                                            if (amt > returnModal.balance) { toast.error(locale === 'ar' ? "المبلغ أكبر من الرصيد المتاح" : "Amount exceeds available balance"); return; }
                                            setIsReturning(true);
                                            const res = await returnCustodyBalance(returnModal.custodyId, amt, returnNote || undefined);
                                            setIsReturning(false);
                                            if (res?.error) toast.error(res.error);
                                            else {
                                                toast.success(res?.closed ? (locale === 'ar' ? "تم إرجاع المبلغ وإغلاق العهدة ✅" : "Amount returned and custody closed ✅") : (locale === 'ar' ? "تم إرجاع المبلغ بنجاح ✅" : "Amount returned successfully ✅"));
                                                setReturnModal(null);
                                                refreshCustodies();
                                                refreshProject();
                                            }
                                        }}
                                    >{locale === 'ar' ? 'تأكيد الإرجاع' : 'Confirm Return'}</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}


