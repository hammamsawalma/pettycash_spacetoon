"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileBarChart2, Download, TrendingUp, Users, FolderKanban, Wallet, AlertCircle, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { useState, useEffect } from "react";
import { getReportStats } from "@/actions/reports";
import { Project } from "@prisma/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

const COLORS = ['#102550', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

export default function ReportsPage() {
    const { user } = useAuth();
    const router = useRouter();
    // Derived from permissions.ts — central source of truth for role access
    const canViewReports = useCanDo('reports', 'viewAll');
    const [dateFilter, setDateFilter] = useState("آخر 30 يوم");
    const [stats, setStats] = useState<{
        netProfit: number;
        totalProjects: number;
        completedProjectsCount: number;
        pendingInvoices: number;
        topProjects: Project[];
        projectBudgets: { name: string, value: number }[];
        monthlyStats: { name: string, revenue: number, expense: number }[];
        categoryExpenses: { name: string, icon: string, value: number }[];
        companyExpensesTotal: number;
        projectExpensesTotal: number;
    } | null>(null);

    // Redirect if not authorized — guard derived from permissions.ts
    useEffect(() => {
        if (user && !canViewReports) {
            router.push("/");
        }
    }, [user, canViewReports, router]);

    useEffect(() => {
        if (canViewReports) {
            getReportStats(dateFilter).then(data => {
                setStats(data);
            });
        }
    }, [dateFilter, canViewReports]);

    if (!user || !canViewReports) return null;

    return (
        <DashboardLayout title="التقارير والإحصائيات">
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* Header / Date Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs md:text-sm text-gray-500 font-bold">نظرة شاملة على أداء الشركة والمشاريع</p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full sm:w-auto rounded-xl border border-gray-200 p-2.5 md:p-3 text-xs md:text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 text-gray-900 transition-all cursor-pointer"
                        >
                            <option value="آخر 30 يوم">آخر 30 يوم</option>
                            <option value="هذا العام">هذا العام</option>
                            <option value="العام الماضي">العام الماضي</option>
                            <option value="الكل">الكل</option>
                        </select>
                        <Button variant="primary" className="gap-2 shrink-0 py-2.5 md:py-3 h-auto" onClick={() => window.print()}>
                            <Download className="w-4 h-4 md:w-4 md:h-4" />
                            <span className="text-xs md:text-sm font-bold">طباعة التقرير</span>
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <Card className="p-5 md:p-6 transition-all duration-300 transform shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30">
                        <div className="flex flex-row md:flex-col lg:flex-row items-center md:items-start lg:items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                                <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400 font-bold mb-1">صافي الأرباح</p>
                                <p className="text-xl md:text-2xl font-black text-gray-900">{stats ? stats.netProfit.toLocaleString() : '...'}</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-lg">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>مبني على العمليات الفعلية</span>
                        </div>
                    </Card>

                    <Card className="p-5 md:p-6 transition-all duration-300 transform shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30">
                        <div className="flex flex-row md:flex-col lg:flex-row items-center md:items-start lg:items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                                <FolderKanban className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400 font-bold mb-1">المشاريع المنجزة</p>
                                <p className="text-xl md:text-2xl font-black text-gray-900">{stats ? stats.completedProjectsCount : '...'} <span className="text-[10px] md:text-sm font-bold text-gray-400">/ {stats ? stats.totalProjects : '...'}</span></p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2.5 py-1 rounded-lg">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>معدل إنجاز حيوي</span>
                        </div>
                    </Card>

                    <Card className="p-5 md:p-6 transition-all duration-300 transform shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30">
                        <div className="flex flex-row md:flex-col lg:flex-row items-center md:items-start lg:items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-sm border border-orange-100/50">
                                <Users className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400 font-bold mb-1">كفاءة النظام</p>
                                <p className="text-xl md:text-2xl font-black text-gray-900">{stats ? (stats.totalProjects > 0 ? Math.round((stats.completedProjectsCount / stats.totalProjects) * 100) : 0) : '...'}%</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] md:text-xs font-bold text-orange-600 bg-orange-50 w-fit px-2.5 py-1 rounded-lg">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>معدل إنجاز المشاريع</span>
                        </div>
                    </Card>

                    <Card className="p-5 md:p-6 transition-all duration-300 transform shadow-sm border-gray-100 hover:shadow-md hover:border-primary/30">
                        <div className="flex flex-row md:flex-col lg:flex-row items-center md:items-start lg:items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center shrink-0 shadow-sm border border-gray-100/50">
                                <FileBarChart2 className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400 font-bold mb-1">الفواتير المعلقة</p>
                                <p className="text-xl md:text-2xl font-black text-gray-900">{stats ? stats.pendingInvoices : '...'}</p>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-600 bg-gray-50 w-fit px-2.5 py-1 rounded-lg">
                            <span>جاري متابعتها</span>
                        </div>
                    </Card>
                </div>

                {/* v5: Company vs Project Expenses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <Card className="p-5 md:p-6 transition-all duration-300 shadow-sm border-purple-100 hover:shadow-md hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                                <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400 font-bold mb-1">مصاريف الشركة</p>
                                <p className="text-xl md:text-2xl font-black text-purple-700">{stats ? stats.companyExpensesTotal.toLocaleString() : '...'} <span className="text-xs font-bold text-purple-400"><CurrencyDisplay /></span></p>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] md:text-xs text-purple-500 font-bold">فواتير غير مرتبطة بمشاريع (معتمدة)</p>
                    </Card>
                    <Card className="p-5 md:p-6 transition-all duration-300 shadow-sm border-blue-100 hover:shadow-md hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                                <FolderKanban className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-sm text-gray-400 font-bold mb-1">مصاريف المشاريع</p>
                                <p className="text-xl md:text-2xl font-black text-blue-700">{stats ? stats.projectExpensesTotal.toLocaleString() : '...'} <span className="text-xs font-bold text-blue-400"><CurrencyDisplay /></span></p>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] md:text-xs text-blue-500 font-bold">فواتير مرتبطة بالمشاريع (معتمدة)</p>
                    </Card>
                </div>

                {/* Detailed Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <h3 className="font-bold text-base md:text-lg text-gray-900 mb-4 md:mb-6">الإيرادات مقابل المصروفات</h3>
                        <div className="h-48 md:h-64 flex flex-col items-center justify-center border border-gray-100 rounded-2xl bg-white text-gray-400 relative overflow-hidden">
                            {!stats || stats.monthlyStats.length === 0 ? (
                                <p className="text-xs md:text-sm font-bold text-gray-400">لا توجد رسوم بيانية فعلية كافية بعد.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.monthlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="revenue" name="إيرادات" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="expense" name="مصروفات" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <h3 className="font-bold text-base md:text-lg text-gray-900 mb-4 md:mb-6">توزيع ميزانية المشاريع</h3>
                        <div className="h-48 md:h-64 flex flex-col items-center justify-center border border-gray-100 rounded-2xl bg-white text-gray-400 relative">
                            {!stats || stats.projectBudgets.length === 0 ? (
                                <p className="text-xs md:text-sm font-bold text-gray-400">لا توجد بيانات كافية</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.projectBudgets}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {stats.projectBudgets.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Category Expenses Chart */}
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <h3 className="font-bold text-base md:text-lg text-gray-900 mb-4 md:mb-6">المصاريف حسب الأقسام والتصنيفات</h3>
                        <div className="h-64 flex flex-col items-center justify-center border border-gray-100 rounded-2xl bg-white text-gray-400 relative overflow-hidden">
                            {!stats || !stats.categoryExpenses || stats.categoryExpenses.length === 0 ? (
                                <p className="text-xs md:text-sm font-bold text-gray-400">لا توجد مصاريف مصنفة بعد.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.categoryExpenses} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                        <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="value" name="المصروفات" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Top Performing Projects List */}
                <Card className="p-0 overflow-hidden shadow-sm border-gray-100">
                    <div className="p-5 md:p-6 border-b border-gray-100/50 bg-gray-50/50">
                        <h3 className="font-bold text-base md:text-lg text-gray-900">المشاريع الأعلى أداءً واستقراراً</h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-xs md:text-sm text-right min-w-[600px]">
                            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                                <tr>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">اسم المشروع</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">تاريخ البدء</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">الميزانية</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">نسبة الأنجاز</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!stats ? (
                                    <>
                                        <TableRowSkeleton columns={4} />
                                        <TableRowSkeleton columns={4} />
                                        <TableRowSkeleton columns={4} />
                                    </>
                                ) : stats.topProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8">
                                            <EmptyState
                                                title="لا توجد مشاريع مسجلة للفترة المحددة"
                                                description="لم يتم العثور على أي مشاريع ذات أداء عالي في هذا النطاق الزمني."
                                                icon={AlertCircle}
                                            />
                                        </td>
                                    </tr>
                                ) : stats.topProjects.map((project, idx) => (
                                    <tr key={project.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                                        <td className="px-4 md:px-6 py-4 font-bold text-gray-900 group-hover:text-primary transition-colors">
                                            {project.name}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 text-gray-500 font-medium">
                                            {project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : 'غير محدد'}
                                        </td>
                                        <td className="px-4 md:px-6 py-4 font-bold text-primary">
                                            {project.budget ? project.budget.toLocaleString() : 0} <span className="text-[10px]"><CurrencyDisplay /></span>
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-20 md:w-24">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${project.status === 'COMPLETED' ? 100 : Math.max(20, 100 - (idx * 20))}%` }}></div>
                                                </div>
                                                <span className="font-bold text-gray-700 text-[10px] md:text-xs">
                                                    {project.status === 'COMPLETED' ? '100%' : `${Math.max(20, 100 - (idx * 20))}%`}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </div>
        </DashboardLayout>
    );
}
