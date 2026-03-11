"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, Search, ShoppingCart, CalendarDays, Hash, Flag, User as UserIcon, BarChart3, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Purchase, Project, User } from "@prisma/client";
import { useCanDo } from "@/components/auth/Protect";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { matchArabicText } from "@/utils/arabic";
import { ExportButton } from "@/components/ui/ExportButton";
import { getPurchasesExportData } from "@/actions/exports";
import { downloadExcel, generatePrintableReport, openPrintWindow, formatDate, purchaseStatusLabel, purchasePriorityLabel, type ExportColumn } from "@/lib/export-utils";

type PurchaseWithRelations = Purchase & {
    project: Project | null;
    creator: Pick<User, "id" | "name">;
};

interface Props {
    initialPurchases: PurchaseWithRelations[];
}

export default function PurchasesClient({ initialPurchases }: Props) {
    const { isCoordinatorInAny, role, user } = useAuth();
    const canCreatePurchase = useCanDo('purchases', 'createGlobal') || (role === 'USER' && isCoordinatorInAny);
    const canExport = useCanDo('exports', 'view');
    const router = useRouter();
    const { locale } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState(locale === 'ar' ? "الكل" : "All");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const purchExportCols: ExportColumn[] = [
        { key: "orderNumber", label: locale === 'ar' ? "رقم الطلب" : "Order #" },
        { key: "description", label: locale === 'ar' ? "الوصف" : "Description" },
        { key: "status", label: locale === 'ar' ? "الحالة" : "Status", format: (v) => purchaseStatusLabel[v as string] || String(v) },
        { key: "priority", label: locale === 'ar' ? "الأولوية" : "Priority", format: (v) => purchasePriorityLabel[v as string] || String(v) },
        { key: "projectName", label: locale === 'ar' ? "المشروع" : "Project" },
        { key: "creatorName", label: locale === 'ar' ? "الطالب" : "Requester" },
        { key: "deadline", label: locale === 'ar' ? "الموعد" : "Deadline", format: (v) => v ? formatDate(v as string) : "-" },
        { key: "createdAt", label: locale === 'ar' ? "التاريخ" : "Date", format: (v) => formatDate(v as string) },
    ];

    const handlePurchasesExcel = async () => {
        const data = await getPurchasesExportData();
        downloadExcel([{ name: locale === 'ar' ? "المشتريات" : "Purchases", columns: purchExportCols, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_المشتريات" : "purchases_report");
    };

    const handlePurchasesPDF = async () => {
        const data = await getPurchasesExportData();
        const html = generatePrintableReport({
            title: locale === 'ar' ? "تقرير المشتريات" : "Purchases Report",
            subtitle: locale === 'ar' ? "أوامر الشراء عبر جميع المشاريع" : "Purchase orders across all projects",
            columns: purchExportCols,
            data: data as Record<string, unknown>[],
            summary: [
                { label: locale === 'ar' ? "إجمالي الطلبات" : "Total Requests", value: String(data.length) },
                { label: locale === 'ar' ? "تم الشراء" : "Purchased", value: String(data.filter(d => d.status === 'PURCHASED').length) },
                { label: locale === 'ar' ? "قيد التنفيذ" : "In Progress", value: String(data.filter(d => d.status === 'IN_PROGRESS').length) },
            ],
            branchName: user?.branchName,
            branchFlag: user?.branchFlag,
        });
        openPrintWindow(html);
    };

    // ─── Summary Stats ─────────────────────────────────────────────────
    const totalCount = initialPurchases.length;
    const requestedCount = initialPurchases.filter(p => p.status === "REQUESTED" && !p.isRedFlagged).length;
    const inProgressCount = initialPurchases.filter(p => p.status === "IN_PROGRESS" && !p.isRedFlagged).length;
    const purchasedCount = initialPurchases.filter(p => p.status === "PURCHASED").length;
    const flaggedCount = initialPurchases.filter(p => p.isRedFlagged).length;

    const filteredPurchases = initialPurchases.filter(purchase => {
        const matchesSearch = matchArabicText(debouncedSearchQuery, [
            purchase.project?.name,
            purchase.orderNumber,
            purchase.description,
            purchase.creator?.name
        ]);

        let matchesFilter = true;
        const filterUnavailable = locale === 'ar' ? "غير متوفر" : "Unavailable";
        const filterAwaitingPurchase = locale === 'ar' ? "بانتظار الشراء" : "Awaiting Purchase";
        const filterInProgress = locale === 'ar' ? "قيد الشراء" : "In Progress";
        const filterCompleted = locale === 'ar' ? "مكتملة" : "Completed";

        if (filter === filterUnavailable) {
            matchesFilter = !!purchase.isRedFlagged;
        } else if (filter === filterAwaitingPurchase) {
            matchesFilter = purchase.status === "REQUESTED" && !purchase.isRedFlagged;
        } else if (filter === filterInProgress) {
            matchesFilter = purchase.status === "IN_PROGRESS" && !purchase.isRedFlagged;
        } else if (filter === filterCompleted) {
            matchesFilter = purchase.status === "PURCHASED";
        }

        return matchesSearch && matchesFilter;
    });

    return (
        <DashboardLayout title={locale === 'ar' ? "المشتريات" : "Purchases"}>
            <div className="space-y-4 pb-6">

                {/* ─── Summary Stats ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
                    {[
                        { label: locale === 'ar' ? "الإجمالي" : "Total", count: totalCount, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-100" },
                        { label: locale === 'ar' ? "بانتظار الشراء" : "Awaiting Purchase", count: requestedCount, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
                        { label: locale === 'ar' ? "قيد الشراء" : "In Progress", count: inProgressCount, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
                        { label: locale === 'ar' ? "مكتملة" : "Completed", count: purchasedCount, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
                        { label: locale === 'ar' ? "غير متوفر" : "Unavailable", count: flaggedCount, color: "text-red-700", bg: "bg-red-50", border: "border-red-100" },
                    ].map((stat) => (
                        <div key={stat.label} className={`${stat.bg} ${stat.border} border rounded-xl p-3 text-center`}>
                            <p className={`text-lg md:text-xl font-black ${stat.color}`}>{stat.count}</p>
                            <p className="text-[10px] md:text-xs font-bold text-gray-500 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* ─── Sticky Header: Search + Filters ─────────────────────────── */}
                <div className="sticky top-16 md:top-20 z-20 bg-[#f8f9fa]/95 backdrop-blur-md pt-1 pb-3 -mx-4 px-4 md:-mx-8 md:px-8 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        {/* Search — RTL-safe icon placement */}
                        <div className="relative w-full sm:w-96">
                            <input
                                type="text"
                                placeholder={locale === 'ar' ? "ابحث عن مشتريات..." : "Search purchases..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full ps-4 pe-10 py-3 text-xs md:text-sm font-bold rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#102550]/40 bg-white shadow-sm"
                            />
                            <Search className="absolute end-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="flex gap-2">
                            {canExport && (
                                <ExportButton
                                    onExportExcel={handlePurchasesExcel}
                                    onExportPDF={handlePurchasesPDF}
                                    label={locale === 'ar' ? "تصدير المشتريات" : "Export Purchases"}
                                    compact
                                />
                            )}
                            {canCreatePurchase && (
                                <Button onClick={() => router.push('/purchases/new')} variant="primary" className="gap-2 w-full sm:w-auto py-3 text-xs md:text-sm h-auto justify-center active:scale-95 transition-transform">
                                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    {locale === 'ar' ? 'إضافة طلب شراء' : 'Add Purchase'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs — horizontal scroll, no squashing */}
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto mobile-tabs-scroll whitespace-nowrap gap-1">
                        {[locale === 'ar' ? "الكل" : "All", locale === 'ar' ? "بانتظار الشراء" : "Awaiting Purchase", locale === 'ar' ? "قيد الشراء" : "In Progress", locale === 'ar' ? "مكتملة" : "Completed", locale === 'ar' ? "غير متوفر" : "Unavailable"].map((tab) => {
                            const unavailableLabel = locale === 'ar' ? "غير متوفر" : "Unavailable";
                            const allLabel = locale === 'ar' ? "الكل" : "All";
                            const awaitingLabel = locale === 'ar' ? "بانتظار الشراء" : "Awaiting Purchase";
                            const inProgressLabel = locale === 'ar' ? "قيد الشراء" : "In Progress";
                            const completedLabel = locale === 'ar' ? "مكتملة" : "Completed";
                            const countForTab = tab === allLabel ? totalCount
                                : tab === awaitingLabel ? requestedCount
                                    : tab === inProgressLabel ? inProgressCount
                                        : tab === completedLabel ? purchasedCount
                                            : flaggedCount;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-3 py-2.5 shrink-0 text-[11px] font-bold rounded-lg transition-all duration-150 active:scale-95 ${filter === tab
                                        ? "bg-[#102550] text-white shadow-sm"
                                        : tab === unavailableLabel
                                            ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                >
                                    {tab === unavailableLabel
                                        ? <span className="flex items-center justify-center gap-1"><Flag className="w-3 h-3" /> {tab} ({countForTab})</span>
                                        : `${tab} (${countForTab})`}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Empty State ───────────────────────────────────────────── */}
                {filteredPurchases.length === 0 && (
                    <div className="py-12">
                        <EmptyState
                            title={locale === 'ar' ? "لا توجد طلبات شراء" : "No Purchase Requests"}
                            description={searchQuery ? (locale === 'ar' ? "لم يتم العثور على طلبات مطابقة لبحثك." : "No requests match your search.") : (locale === 'ar' ? "قم بإضافة طلب شراء جديد للبدء بتتبع المدفوعات." : "Add a new purchase request to start tracking payments.")}
                            icon={ShoppingCart}
                        />
                    </div>
                )}

                {filteredPurchases.length > 0 && (
                    <>
                        {/* ─── Mobile Card View (< md) ─────────────────────────── */}
                        <div className="md:hidden space-y-3">
                            {filteredPurchases.map((purchase) => {
                                const isFlagged = purchase.isRedFlagged;
                                return (
                                    <Card
                                        key={purchase.id}
                                        onClick={() => router.push(`/purchases/${purchase.id}`)}
                                        className={`overflow-hidden cursor-pointer active:scale-[0.99] transition-all border rounded-2xl shadow-sm ${isFlagged ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}
                                    >
                                        {/* Hero Image at Top */}
                                        {purchase.imageUrl ? (
                                            <div className="relative w-full h-40 bg-gray-100">
                                                <img
                                                    src={purchase.imageUrl}
                                                    alt={locale === 'ar' ? "صورة الطلب" : "Order image"}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <StatusBadge status={purchase.status} />
                                                </div>
                                                {isFlagged && (
                                                    <div className="absolute top-2 right-2">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg shadow-sm">
                                                            <Flag className="w-2.5 h-2.5" /> {locale === 'ar' ? 'غير متوفر' : 'Unavailable'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-24 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                                                <ShoppingCart className="w-10 h-10 text-gray-200" />
                                                <div className="absolute top-2 left-2">
                                                    <StatusBadge status={purchase.status} />
                                                </div>
                                                {isFlagged && (
                                                    <div className="absolute top-2 right-2">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg shadow-sm">
                                                            <Flag className="w-2.5 h-2.5" /> {locale === 'ar' ? 'غير متوفر' : 'Unavailable'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="p-4">
                                            {/* Order number */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isFlagged ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                    <Hash className={`w-3.5 h-3.5 ${isFlagged ? 'text-red-500' : 'text-gray-500'}`} />
                                                </div>
                                                <p className={`font-black text-sm ${isFlagged ? 'text-red-800' : 'text-gray-900'}`}>
                                                    {purchase.orderNumber}
                                                </p>
                                            </div>

                                            {/* Description */}
                                            {purchase.description && (
                                                <p className="text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">
                                                    {purchase.description}
                                                </p>
                                            )}

                                            {/* Meta row */}
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {purchase.project && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#102550] bg-blue-50 px-2 py-1 rounded-lg">
                                                        {purchase.project.name}
                                                    </span>
                                                )}
                                                {(purchase as any).batchLabel && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                                                        <FileSpreadsheet className="w-3 h-3" />
                                                        {(purchase as any).batchLabel}
                                                    </span>
                                                )}
                                                {purchase.deadline && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {new Date(purchase.deadline).toLocaleDateString('en-GB')}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                    {locale === 'ar' ? 'الكمية:' : 'Qty:'} {purchase.quantity || 1}
                                                </span>
                                            </div>

                                            {/* Creator */}
                                            <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
                                                <UserIcon className="w-3 h-3" />
                                                <span className="font-medium">{locale === 'ar' ? 'طالب الشراء:' : 'Requested by:'} <span className="text-gray-600 font-bold">{purchase.creator?.name}</span></span>
                                            </div>

                                            {/* CTA for open purchases */}
                                            {(purchase.status === 'REQUESTED' || purchase.status === 'IN_PROGRESS') && (
                                                <Button
                                                    variant="outline"
                                                    className={`w-full h-9 text-xs font-bold rounded-xl mt-1 ${isFlagged ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-[#102550]/30 text-[#102550] hover:bg-[#102550]/5'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.location.href = `/invoices/new?purchaseId=${purchase.id}&projectId=${purchase.projectId || ''}&description=${encodeURIComponent(purchase.description)}`;
                                                    }}
                                                >
                                                    {locale === 'ar' ? 'إتمام الشراء ←' : 'Complete Purchase →'}
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* ─── Desktop Table View (≥ md) ──────────────────────── */}
                        <Card className="hidden md:block overflow-hidden shadow-sm border-gray-100 p-0">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-xs md:text-sm text-right min-w-[700px]">
                                    <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                                        <tr>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">{locale === 'ar' ? 'رقم الطلب' : 'Order #'}</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">{locale === 'ar' ? 'الصورة' : 'Image'}</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">{locale === 'ar' ? 'المشروع المرتبط' : 'Project'}</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">{locale === 'ar' ? 'الموعد النهائي' : 'Deadline'}</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">{locale === 'ar' ? 'الكمية' : 'Qty'}</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredPurchases.map((purchase) => {
                                            const isFlagged = purchase.isRedFlagged;
                                            return (
                                                <tr
                                                    key={purchase.id}
                                                    onClick={() => router.push(`/purchases/${purchase.id}`)}
                                                    className={`transition-colors group cursor-pointer ${isFlagged ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50/50'}`}
                                                >
                                                    <td className={`px-4 md:px-6 py-4 font-bold text-gray-900 border-r-4 ${isFlagged ? 'border-red-400' : 'border-transparent group-hover:border-[#102550]'}`}>
                                                        {purchase.orderNumber}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4">
                                                        {purchase.imageUrl ? (
                                                            <img src={purchase.imageUrl} alt={locale === 'ar' ? "صورة الطلب" : "Order image"} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-gray-200" />
                                                        ) : (
                                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                                <ShoppingCart className="w-5 h-5 opacity-50" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-[#102550] font-bold">
                                                        {purchase.project?.name || (locale === 'ar' ? "عام" : "General")}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-gray-500 font-medium text-[11px] md:text-sm">
                                                        {purchase.deadline ? new Date(purchase.deadline).toLocaleDateString('en-GB') : "-"}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-gray-700 min-w-[200px] whitespace-normal break-words text-[11px] md:text-sm font-medium" title={purchase.description || ""}>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={isFlagged ? 'text-red-800 font-bold' : ''}>{purchase.description || "-"}</span>
                                                                {isFlagged && <Flag className="w-4 h-4 text-red-500 fill-current" />}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-medium">{locale === 'ar' ? 'طالب الشراء:' : 'By:'} {purchase.creator?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 font-bold text-[#102550] text-left" dir="ltr">
                                                        {purchase.quantity || 1}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 flex flex-col items-start gap-2">
                                                        <StatusBadge status={purchase.status} />
                                                        {(purchase.status === 'REQUESTED' || purchase.status === 'IN_PROGRESS') && (
                                                            <Button
                                                                variant="outline"
                                                                className={`h-7 text-[10px] px-2 py-0 ${isFlagged ? 'border-red-500 text-red-600 hover:bg-red-50' : 'border-primary text-primary hover:bg-primary/10'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.location.href = `/invoices/new?purchaseId=${purchase.id}&projectId=${purchase.projectId || ''}&description=${encodeURIComponent(purchase.description)}`;
                                                                }}
                                                            >
                                                                {locale === 'ar' ? 'إتمام الشراء' : 'Complete Purchase'}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </>
                )}

            </div>
        </DashboardLayout>
    );
}
