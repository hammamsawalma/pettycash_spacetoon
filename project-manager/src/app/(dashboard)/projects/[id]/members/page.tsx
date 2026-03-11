"use client"
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, Shield, Plus, Trash2, ChevronDown } from "lucide-react";
import { getProjectMembers, addMemberToProject, updateMemberRoles, removeMemberFromProject } from "@/actions/projectMembers";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

const getRoleConfig = (locale: string) => ({
    PROJECT_EMPLOYEE: { label: locale === 'ar' ? "موظف" : "Employee", color: "bg-blue-100 text-blue-700", desc: locale === 'ar' ? "يستلم عهدة، يرفع فواتير" : "Receives custody, uploads invoices" },
    PROJECT_MANAGER: { label: locale === 'ar' ? "منسق المشتريات" : "Purchases Coordinator", color: "bg-amber-100 text-amber-700", desc: locale === 'ar' ? "يضيف قوائم المشتريات" : "Adds purchase lists" },
});

type ProjectRole = "PROJECT_EMPLOYEE" | "PROJECT_MANAGER";
type Member = Awaited<ReturnType<typeof getProjectMembers>>[0];

export default function ProjectMembersPage() {
    const { id: projectId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    // Only ADMIN can manage/remove members — derived from central permissions.ts
    const canManageMembers = useCanDo('employees', 'create');

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const { locale } = useLanguage();

    const ROLE_CONFIG = getRoleConfig(locale);

    useEffect(() => {
        getProjectMembers(projectId).then(data => {
            setMembers(data);
            setLoading(false);
        });
    }, [projectId]);

    const handleToggleRole = async (memberId: string, role: ProjectRole, currentRoles: ProjectRole[]) => {
        if (role === "PROJECT_EMPLOYEE") return; // EMPLOYEE دائماً موجود
        const newRoles = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];

        setSavingId(memberId);
        const result = await updateMemberRoles(memberId, newRoles);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(locale === 'ar' ? "تم تحديث الأدوار ✅" : "Roles updated ✅");
            setMembers(prev => prev.map(m =>
                m.id === memberId ? { ...m, projectRoles: newRoles.join(","), parsedRoles: newRoles } : m
            ));
        }
        setSavingId(null);
    };

    const handleRemove = async (memberId: string, memberName: string) => {
        if (!confirm(locale === 'ar' ? `هل أنت متأكد من إزالة ${memberName} من المشروع؟` : `Are you sure you want to remove ${memberName} from the project?`)) return;
        const result = await removeMemberFromProject(memberId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(locale === 'ar' ? "تمت إزالة العضو" : "Member removed");
            setMembers(prev => prev.filter(m => m.id !== memberId));
        }
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "إدارة أعضاء المشروع" : "Manage Project Members"}>
            <div className="max-w-4xl mx-auto space-y-6 pb-10">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{locale === 'ar' ? 'أعضاء المشروع' : 'Project Members'}</h1>
                            <p className="text-sm text-gray-500">{members.length} {locale === 'ar' ? 'عضو' : 'Member(s)'}</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push(`/projects/${projectId}`)} variant="outline" className="text-sm">
                        {locale === 'ar' ? '← العودة للمشروع' : '← Back to Project'}
                    </Button>
                </div>

                {/* Role Legend */}
                <Card className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">{locale === 'ar' ? 'دليل الأدوار' : 'Role Legend'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                            <div key={role} className={`px-3 py-2 rounded-xl ${cfg.color} bg-opacity-50`}>
                                <p className="font-bold text-sm">{cfg.label}</p>
                                <p className="text-xs mt-0.5 opacity-80">{cfg.desc}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 italic">
                        ⚠️ {locale === 'ar' ? 'المحاسب العام هو المسؤول عن مراجعة واعتماد الفواتير لجميع المشاريع' : 'The General Accountant is responsible for reviewing and approving invoices for all projects'}
                    </p>
                </Card>

                {/* Members List */}
                {loading ? (
                    <div className="text-center py-16 text-gray-400">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : members.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>{locale === 'ar' ? 'لا يوجد أعضاء في هذا المشروع بعد' : 'No members in this project yet'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {members.map(member => {
                            const parsedRoles = member.parsedRoles as ProjectRole[];
                            const isExpanded = expandedId === member.id;

                            return (
                                <Card key={member.id} className="border border-gray-100 overflow-hidden">
                                    {/* Member Summary Row */}
                                    <div
                                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedId(isExpanded ? null : member.id)}
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {member.user.name?.charAt(0) || "?"}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-sm">{member.user.name}</p>
                                            <p className="text-xs text-gray-400">{member.user.phone || member.user.email || ""}</p>
                                        </div>
                                        {/* Role Badges */}
                                        <div className="flex gap-1.5 flex-wrap justify-end">
                                            {parsedRoles.map(role => {
                                                const cfg = ROLE_CONFIG[role as ProjectRole];
                                                return (
                                                    <span key={role} className={`text-xs px-2 py-1 rounded-lg font-semibold ${cfg?.color || ''}`}>
                                                        {cfg?.label || role}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {/* Balance */}
                                        <div className="text-right ml-2">
                                            <p className="text-xs text-gray-400">{locale === 'ar' ? 'العهدة' : 'Custody'}</p>
                                            <p className={`text-sm font-bold ${member.custodyBalance > 0 ? "text-amber-600" : "text-gray-400"}`}>
                                                {member.custodyBalance.toLocaleString('en-US')} {locale === 'ar' ? 'ر' : 'QAR'}
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </div>

                                    {/* Expanded Role Editor */}
                                    {isExpanded && canManageMembers && (
                                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                                            <p className="text-xs font-bold text-gray-500 mb-3">{locale === 'ar' ? 'تعديل الأدوار' : 'Edit Roles'}</p>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(Object.keys(ROLE_CONFIG) as ProjectRole[]).map(role => {
                                                    const isActive = parsedRoles.includes(role);
                                                    const isFixed = role === "PROJECT_EMPLOYEE";
                                                    const cfg = ROLE_CONFIG[role as ProjectRole];
                                                    return (
                                                        <button
                                                            key={role}
                                                            disabled={isFixed || savingId === member.id}
                                                            onClick={() => handleToggleRole(member.id, role, parsedRoles)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${isActive
                                                                ? `${cfg.color} border-current`
                                                                : "bg-white border-gray-200 text-gray-400"
                                                                } ${isFixed ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}`}
                                                        >
                                                            {cfg.label} {isActive ? "✓" : "+"}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => handleRemove(member.id, member.user.name)}
                                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                                                disabled={member.custodyBalance > 0}
                                                title={member.custodyBalance > 0 ? (locale === 'ar' ? "لا يمكن إزالة عضو لديه عهدة نشطة" : "Cannot remove member with active custody") : ""}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                {locale === 'ar' ? 'إزالة من المشروع' : 'Remove from Project'}
                                                {member.custodyBalance > 0 && (locale === 'ar' ? " (لديه عهدة)" : " (Has Custody)")}
                                            </button>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
