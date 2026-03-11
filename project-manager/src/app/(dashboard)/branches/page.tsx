"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { getBranchesWithStats, toggleBranchActive } from "@/actions/branches";
import { Globe2, Users, FolderKanban, Shield, Power } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type BranchWithStats = Awaited<ReturnType<typeof getBranchesWithStats>>[number];

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function BranchesPage() {
    const [branches, setBranches] = useState<BranchWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const { locale } = useLanguage();

    useEffect(() => {
        getBranchesWithStats().then((data) => {
            setBranches(data);
            setLoading(false);
        });
    }, []);

    const handleToggle = async (branchId: string) => {
        setToggling(branchId);
        const result = await toggleBranchActive(branchId);
        if (result.success) {
            setBranches((prev) =>
                prev.map((b) =>
                    b.id === branchId ? { ...b, isActive: result.isActive! } : b
                )
            );
        }
        setToggling(null);
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "إدارة الفروع" : "Branch Management"}>
            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-[#16213e] p-6 md:p-8 text-white shadow-xl"
                >
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Globe2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black">{locale === 'ar' ? 'إدارة الفروع' : 'Branch Management'}</h1>
                            <p className="text-white/50 text-sm">
                                {branches.length} {locale === 'ar' ? 'فرع — تفعيل وتعطيل الفروع' : 'branches — activate and deactivate branches'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Branches Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {branches.map((branch, i) => (
                            <motion.div
                                key={branch.id}
                                variants={fadeUp}
                                initial="hidden"
                                animate="show"
                                transition={{ delay: i * 0.06 }}
                            >
                                <Card
                                    className={`p-5 relative overflow-hidden transition-all duration-200 ${branch.isActive
                                            ? "hover:shadow-xl hover:shadow-[#102550]/10"
                                            : "opacity-60 bg-gray-50"
                                        }`}
                                >
                                    <div className="space-y-4">
                                        {/* Branch Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                                                    {branch.flag}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">
                                                        {branch.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 font-medium">
                                                        {branch.code} · {branch.currency}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleToggle(branch.id)}
                                                disabled={toggling === branch.id}
                                                className={`p-2 rounded-lg transition-all ${branch.isActive
                                                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                        : "bg-red-50 text-red-500 hover:bg-red-100"
                                                    } ${toggling === branch.id ? "animate-pulse" : ""}`}
                                                title={branch.isActive ? (locale === 'ar' ? "تعطيل الفرع" : "Deactivate Branch") : (locale === 'ar' ? "تفعيل الفرع" : "Activate Branch")}
                                            >
                                                <Power className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${branch.isActive
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {branch.isActive ? (locale === 'ar' ? "نشط" : "Active") : (locale === 'ar' ? "معطّل" : "Disabled")}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {locale === 'ar' ? 'منذ' : 'Since'}{" "}
                                                {new Date(branch.createdAt).toLocaleDateString("en-GB")}
                                            </span>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-blue-50 rounded-lg p-2">
                                                <FolderKanban className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
                                                <p className="text-sm font-black text-blue-700">
                                                    {branch.projects}
                                                </p>
                                                <p className="text-[9px] text-gray-500 font-semibold">
                                                    {locale === 'ar' ? 'مشروع' : 'projects'}
                                                </p>
                                            </div>
                                            <div className="bg-[#102550]/5 rounded-lg p-2">
                                                <Users className="w-3.5 h-3.5 text-[#102550] mx-auto mb-1" />
                                                <p className="text-sm font-black text-[#102550]">
                                                    {branch.users}
                                                </p>
                                                <p className="text-[9px] text-gray-500 font-semibold">
                                                    {locale === 'ar' ? 'موظف' : 'employees'}
                                                </p>
                                            </div>
                                            <div className="bg-amber-50 rounded-lg p-2">
                                                <Shield className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
                                                <p className="text-sm font-black text-amber-700">
                                                    {branch.admins}
                                                </p>
                                                <p className="text-[9px] text-gray-500 font-semibold">
                                                    {locale === 'ar' ? 'مدير' : 'admins'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
