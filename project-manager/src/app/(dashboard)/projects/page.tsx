"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, FolderKanban, Briefcase } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { KanbanBoard } from "@/components/ui/KanbanBoard";
import { getProjects, updateProjectStatus } from "@/actions/projects";
import { Project, User } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { matchArabicText } from "@/utils/arabic";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { ExportButton } from "@/components/ui/ExportButton";
import { getProjectsExportData } from "@/actions/exports";
import { downloadExcel, generatePrintableReport, openPrintWindow, formatCurrency, type ExportColumn } from "@/lib/export-utils";

type ProjectWithRelations = Project & {
    manager: User | null;
    _count: { members: number; invoices: number; purchases: number };
    approvedExpenses: number;
    pendingExpenses: number;
    totalCustodyRemaining: number;
    expectedRemaining: number;
};

export default function ProjectsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { t, locale } = useLanguage();
    const canCreateProject = useCanDo('projects', 'create');
    // Management roles see financial details (budget, custody) — USER role sees only project info
    const canViewFinancials = useCanDo('projects', 'viewAll');
    // Only ADMIN can change project status via Kanban DnD
    const canDragDrop = useCanDo('projects', 'close');
    const canExport = useCanDo('exports', 'view');

    const [filter, setFilter] = useState("ALL");
    const [viewMode, setViewMode] = useState<"grid" | "board">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const projExportCols: ExportColumn[] = [
        { key: "name", label: t('projects.projectName') },
        { key: "status", label: t('common.status') },
        { key: "budget", label: t('projects.budget'), format: (v) => formatCurrency(v as number) },
        { key: "budgetAllocated", label: t('projects.budgetAllocated'), format: (v) => formatCurrency(v as number) },
        { key: "custodyIssued", label: t('projects.custodyIssued'), format: (v) => formatCurrency(v as number) },
        { key: "managerName", label: t('projects.projectManager') },
        { key: "invoicesCount", label: t('sidebar.invoices') },
        { key: "purchasesCount", label: t('sidebar.purchases') },
    ];

    const handleProjectsExcel = async () => {
        const data = await getProjectsExportData();
        downloadExcel([{ name: t('projects.title'), columns: projExportCols, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_المشاريع" : "projects_report");
    };

    const handleProjectsPDF = async () => {
        const data = await getProjectsExportData();
        const totalBudget = data.reduce((s, d) => s + d.budget, 0);
        const html = generatePrintableReport({
            title: locale === 'ar' ? "تقرير المشاريع" : "Projects Report",
            subtitle: locale === 'ar' ? "ملخص مالي لجميع المشاريع" : "Financial summary of all projects",
            columns: projExportCols,
            data: data as Record<string, unknown>[],
            summary: [
                { label: t('dashboard.projectCount'), value: String(data.length) },
                { label: locale === 'ar' ? 'إجمالي الميزانيات' : 'Total Budgets', value: formatCurrency(totalBudget) },
            ],
            branchName: user?.branchName,
            branchFlag: user?.branchFlag,
        });
        openPrintWindow(html);
    };

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getProjects();
            setProjects(data as unknown as ProjectWithRelations[]);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const filteredProjects = projects.filter(project => {
        const statusFilterMap: Record<string, string[]> = {
            "COMPLETED": ["COMPLETED"],
            "IN_PROGRESS": ["IN_PROGRESS"],
            "ON_HOLD": ["PENDING", "ON_HOLD"],
        };

        const matchesFilter = filter === "ALL" || (statusFilterMap[filter]?.includes(project.status) ?? false);
        const matchesSearch = matchArabicText(debouncedSearchQuery, [
            project.name,
            project.manager?.name,
            project.description
        ]);

        return matchesFilter && matchesSearch;
    });

    const handleStatusChange = async (projectId: string, newStatus: string) => {
        // Save previous state for rollback
        const previousProjects = projects;

        // Optimistic update
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus as "COMPLETED" | "IN_PROGRESS" | "PENDING" } : p));

        // Persist via server action
        const result = await updateProjectStatus(projectId, newStatus);
        if (result?.error) {
            // Rollback on failure
            setProjects(previousProjects);
            toast.error(result.error);
        } else {
            toast.success(locale === 'ar' ? 'تم تحديث حالة المشروع بنجاح' : 'Project status updated successfully', {
                icon: '✨',
                style: {
                    borderRadius: '16px',
                    background: '#fff',
                    color: '#333',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                    fontWeight: 'bold',
                    padding: '12px 24px',
                },
            });
        }
    };

    return (
        <DashboardLayout title={t('projects.title')}>
            <div className="space-y-6 md:space-y-8">

                {/* Top Stats for Projects (Mobile styling) */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    <Card className="p-4 md:p-6 shadow-sm border-gray-100 flex flex-col justify-center items-center h-24">
                        <p className="text-[11px] md:text-sm font-semibold text-gray-500 mb-1">{locale === 'ar' ? 'عدد جميع المشاريع' : 'Total Projects'}</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 drop-shadow-sm">{projects.length}</p>
                    </Card>
                    <Card className="p-4 md:p-6 shadow-sm border-gray-100 flex flex-col justify-center items-center h-24">
                        <p className="text-[11px] md:text-sm font-semibold text-gray-500 mb-1">{locale === 'ar' ? 'المشاريع المكتملة' : 'Completed'}</p>
                        <p className="text-xl md:text-2xl font-bold text-emerald-600 drop-shadow-sm">{projects.filter(p => p.status === 'COMPLETED').length}</p>
                    </Card>
                    <Card className="p-4 md:p-6 shadow-sm border-gray-100 flex flex-col justify-center items-center col-span-2 lg:col-span-1 h-24">
                        <p className="text-[11px] md:text-sm font-semibold text-gray-500 mb-1">{locale === 'ar' ? 'المتوقفة' : 'On Hold'}</p>
                        <p className="text-xl md:text-2xl font-bold text-red-600 drop-shadow-sm">{projects.filter(p => p.status === 'PENDING').length}</p>
                    </Card>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col gap-4">
                    {/* Search Bar - Full Width Pill on Mobile */}
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder={t('common.search') + '...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-full border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#102550]/50 text-sm"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center pointer-events-none text-gray-400">
                            <Search className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Filter Tabs & View Toggle */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto mobile-tabs-scroll whitespace-nowrap w-full sm:w-auto">
                            {[
                                { key: "ALL", label: t('common.all') },
                                { key: "COMPLETED", label: t('status.COMPLETED') },
                                { key: "IN_PROGRESS", label: t('status.IN_PROGRESS') },
                                { key: "ON_HOLD", label: locale === 'ar' ? 'المتوقفة' : 'On Hold' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-3 py-2.5 shrink-0 min-w-fit text-xs font-medium rounded-md transition-colors ${filter === key
                                        ? "bg-[#102550] text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`flex-1 sm:flex-none px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {locale === 'ar' ? 'شبكة' : 'Grid'}
                            </button>
                            <button
                                onClick={() => setViewMode("board")}
                                className={`flex-1 sm:flex-none px-3 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${viewMode === "board" ? "bg-[#102550] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <span className="hidden sm:inline">{locale === 'ar' ? 'بورد (سحب وإفلات)' : 'Board (Drag & Drop)'}</span>
                                <span className="sm:hidden">{locale === 'ar' ? 'بورد' : 'Board'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Add Project / Export Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {canExport && (
                            <ExportButton
                                onExportExcel={handleProjectsExcel}
                                onExportPDF={handleProjectsPDF}
                                label={locale === 'ar' ? 'تصدير المشاريع' : 'Export Projects'}
                            />
                        )}
                        {canCreateProject && (
                            <Button onClick={() => router.push('/projects/new')} className="flex-1 py-6 md:py-7 text-sm md:text-lg font-bold rounded-2xl bg-[#102550] hover:bg-[#102550]-hover text-white border-none flex items-center justify-center gap-2 shadow-sm">
                                <span>{t('sidebar.addProject')}</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Projects Grid */}
                {isLoading ? (
                    <LoadingSkeleton count={6} />
                ) : filteredProjects.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={Briefcase}
                            title={t('projects.noProjects')}
                            description={searchQuery ? (locale === 'ar' ? 'لم يتم العثور على مشاريع مطابقة لبحثك، جرب بكلمات أخرى.' : 'No projects match your search. Try different keywords.') : (locale === 'ar' ? 'لم يتم إضافة أي مشروع حتى الآن. ابدأ بإضافة مشروعك الأول.' : 'No projects added yet. Start by adding your first project.')}
                            action={
                                canCreateProject && !searchQuery ? (
                                    <Button onClick={() => router.push('/projects/new')} variant="primary" className="mt-2 text-sm">
                                        {t('sidebar.addProject')}
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                ) : viewMode === "board" ? (
                    <div className="py-4">
                        <KanbanBoard projects={filteredProjects} onProjectClick={(id) => router.push(`/projects/${id}`)} onStatusChange={handleStatusChange} canDragDrop={canDragDrop} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 pb-6 mt-4">
                        {filteredProjects.map(project => {
                            const isCompleted = project.status === 'COMPLETED';
                            const isInProgress = project.status === 'IN_PROGRESS';
                            const isOnHold = project.status === 'ON_HOLD' || project.status === 'PENDING';
                            const statusLabel = isCompleted ? t('status.COMPLETED') : isInProgress ? t('status.IN_PROGRESS') : (locale === 'ar' ? 'متوقف' : 'On Hold');
                            const statusBadge = isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : isInProgress
                                    ? 'bg-blue-100 text-[#102550]'
                                    : 'bg-orange-100 text-orange-600';

                            return (
                                <Card onClick={() => router.push(`/projects/${project.id}`)} key={project.id} className="p-3 md:p-6 space-y-3 md:space-y-4 shadow-sm border border-gray-100 hover:border-[#102550]/30 transition-all duration-300 relative overflow-hidden rounded-2xl w-full max-w-sm mx-auto md:max-w-none cursor-pointer group">
                                    {project.image ? (
                                        <img src={project.image} alt="" className="absolute -top-4 -left-4 w-16 h-16 md:w-24 md:h-24 opacity-10 pointer-events-none object-cover rotate-12 transition-transform duration-500 group-hover:scale-110 blur-[2px]" />
                                    ) : (
                                        <FolderKanban className="absolute -top-4 -left-4 w-16 h-16 md:w-24 md:h-24 text-gray-50 opacity-50 pointer-events-none rotate-12 transition-transform duration-500 group-hover:scale-110" />
                                    )}
                                    <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-2">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm md:text-lg text-gray-900 group-hover:text-[#102550] transition-colors">{project.name}</h4>
                                            <span className={`inline-block px-1.5 py-0.5 md:px-2.5 md:py-0.5 text-[9px] md:text-xs font-bold rounded-lg ${statusBadge}`}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <div className="hidden md:flex w-10 h-10 bg-blue-50 rounded-xl items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                            {project.image ? (
                                                <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <FolderKanban className="w-5 h-5 text-[#102550]" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 gap-2 md:gap-4 relative z-10">
                                        <div className="flex -space-x-2 md:-space-x-3 space-x-reverse items-center shrink-0">
                                            {project.manager && (
                                                <div title={project.manager.name} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] md:text-xs shadow-sm z-30 text-blue-700 font-bold">
                                                    {project.manager.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] md:text-xs shadow-sm z-20 text-gray-700 font-bold">+</div>
                                        </div>
                                        <div className="flex gap-2 text-[9px] md:text-xs text-gray-500 font-bold justify-start md:justify-end shrink-0">
                                            <div className="flex flex-row gap-1 bg-gray-50 px-2 py-1 rounded-md whitespace-nowrap"><span className="text-gray-900">{project._count.members}</span> <span>{locale === 'ar' ? 'عضو' : 'members'}</span></div>
                                            <div className="flex flex-row gap-1 bg-gray-50 px-2 py-1 rounded-md whitespace-nowrap"><span className="text-gray-900">{project._count.invoices}</span> <span>{locale === 'ar' ? 'فاتورة' : 'invoices'}</span></div>
                                        </div>
                                    </div>

                                    {/* Financial Details Grid */}
                                    {canViewFinancials && (
                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 relative z-10 w-full">
                                            <div className="bg-blue-50/70 rounded-xl p-2.5 flex flex-col justify-center items-start border border-blue-100/50">
                                                <span className="text-[9px] md:text-[10px] text-[#102550] font-bold mb-0.5">{t('projects.budgetAllocated')}</span>
                                                <span className="text-xs md:text-sm font-black text-gray-900">{(project.budgetAllocated || 0).toLocaleString('en-US')} <span className="text-[8px] md:text-[9px] text-gray-500 font-normal"><CurrencyDisplay /></span></span>
                                            </div>
                                            <div className="bg-emerald-50/70 rounded-xl p-2.5 flex flex-col justify-center items-start border border-emerald-100/50">
                                                <span className="text-[9px] md:text-[10px] text-emerald-600 font-bold mb-0.5">{locale === 'ar' ? 'العهد المتبقية' : 'Remaining Custody'}</span>
                                                <span className="text-xs md:text-sm font-black text-gray-900">{project.totalCustodyRemaining.toLocaleString('en-US')} <span className="text-[8px] md:text-[9px] text-gray-500 font-normal"><CurrencyDisplay /></span></span>
                                            </div>
                                            <div className="bg-orange-50/70 rounded-xl p-2.5 flex flex-col justify-center items-start border border-orange-100/50">
                                                <span className="text-[9px] md:text-[10px] text-orange-600 font-bold mb-0.5">{locale === 'ar' ? 'المتبقي المتوقع' : 'Expected Remaining'}</span>
                                                <span className="text-xs md:text-sm font-black text-gray-900">{project.expectedRemaining.toLocaleString('en-US')} <span className="text-[8px] md:text-[9px] text-gray-500 font-normal"><CurrencyDisplay /></span></span>
                                            </div>
                                            <div className="bg-red-50/70 rounded-xl p-2.5 flex flex-col justify-center items-start border border-red-100/50">
                                                <span className="text-[9px] md:text-[10px] text-red-600 font-bold mb-0.5">{locale === 'ar' ? 'المصروفات المعتمدة' : 'Approved Expenses'}</span>
                                                <span className="text-xs md:text-sm font-black text-gray-900">{project.approvedExpenses.toLocaleString('en-US')} <span className="text-[8px] md:text-[9px] text-gray-500 font-normal"><CurrencyDisplay /></span></span>
                                            </div>
                                        </div>
                                    )}


                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
