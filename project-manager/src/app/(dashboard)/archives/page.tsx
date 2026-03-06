"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Archive, FolderKanban, Users, FileText, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { getCompletedProjects, reopenProject } from "@/actions/projects";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

type CompletedProject = {
    id: string;
    name: string;
    description: string | null;
    budgetAllocated: number | null;
    custodyIssued: number | null;
    closedAt: Date | null;
    updatedAt: Date;
    manager: { id: string; name: string } | null;
    _count: { members: number; invoices: number };
};

export default function ArchivesPage() {
    const { user } = useAuth();
    const canReopenProject = useCanDo('archive', 'reopen');
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [projects, setProjects] = useState<CompletedProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reopeningId, setReopeningId] = useState<string | null>(null);

    const fetchArchives = async () => {
        setIsLoading(true);
        const data = await getCompletedProjects();
        setProjects(data as any as CompletedProject[]);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchArchives();
    }, []);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleReopen = async (projectId: string, projectName: string) => {
        if (!confirm(`هل أنت متأكد من إعادة تفعيل مشروع "${projectName}"؟ سيعود إلى حالة "قيد التنفيذ".`)) return;
        setReopeningId(projectId);
        const res = await reopenProject(projectId);
        setReopeningId(null);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("تم إعادة تفعيل المشروع ✅");
            fetchArchives();
        }
    };

    return (
        <DashboardLayout title="الأرشيف — المشاريع المكتملة">
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Archive className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-800">المشاريع المكتملة</h2>
                            <p className="text-xs text-gray-400">{filteredProjects.length} مشروع مغلق</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="ابحث في المشاريع المؤرشفة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 md:py-3 text-xs md:text-sm font-bold rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/50 bg-white shadow-sm"
                        />
                        <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="text-center py-20 text-gray-400 text-sm">جاري تحميل المشاريع...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                        <Archive className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500">
                            {searchQuery ? "لا توجد سجلات مطابقة للبحث." : "لا توجد مشاريع مكتملة حتى الآن."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {filteredProjects.map(project => (
                            <Card
                                key={project.id}
                                className="p-5 md:p-6 space-y-4 shadow-sm border border-gray-100 rounded-2xl hover:shadow-md transition-shadow"
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                            <FolderKanban className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base text-gray-800 leading-tight">{project.name}</h4>
                                            {project.manager && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">المدير: {project.manager.name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                                        مكتمل
                                    </span>
                                </div>

                                {/* Description */}
                                {project.description && (
                                    <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                                        {project.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-gray-50 rounded-xl p-2">
                                        <p className="text-[10px] text-gray-400 font-semibold mb-0.5">الميزانية</p>
                                        <p className="text-xs font-black text-gray-700">{(project.budgetAllocated ?? 0).toLocaleString()}</p>
                                        <p className="text-[9px] text-gray-400"><CurrencyDisplay /></p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-2">
                                        <Users className="w-3.5 h-3.5 text-purple-400 mx-auto mb-0.5" />
                                        <p className="text-xs font-black text-purple-700">{project._count.members}</p>
                                        <p className="text-[9px] text-gray-400">عضو</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-2">
                                        <FileText className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                                        <p className="text-xs font-black text-blue-700">{project._count.invoices}</p>
                                        <p className="text-[9px] text-gray-400">فاتورة</p>
                                    </div>
                                </div>

                                {/* Closed At */}
                                <p className="text-[10px] text-gray-400 font-medium">
                                    تاريخ الإغلاق:{" "}
                                    {project.closedAt
                                        ? new Date(project.closedAt).toLocaleDateString("en-GB")
                                        : new Date(project.updatedAt).toLocaleDateString("en-GB")}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-gray-50">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-1.5 text-[11px] h-9 font-bold text-gray-600 hover:text-gray-900"
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                    >
                                        <FolderKanban className="w-3.5 h-3.5" />
                                        عرض التفاصيل
                                    </Button>
                                    {canReopenProject && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-1.5 text-[11px] h-9 font-bold text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                                            onClick={() => handleReopen(project.id, project.name)}
                                            disabled={reopeningId === project.id}
                                            isLoading={reopeningId === project.id}
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            إعادة تفعيل
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
