"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, Search, ShoppingCart, CalendarDays, Hash } from "lucide-react";
import { useState } from "react";
import { Purchase, Project, User } from "@prisma/client";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { matchArabicText } from "@/utils/arabic";
import { Flag } from "lucide-react";

type PurchaseWithRelations = Purchase & {
    project: Project | null;
    creator: Pick<User, "id" | "name">;
    // Explicit fields from Prisma schema that may not be resolved by the IDE
    deadline?: Date | null;
    quantity?: string | null;
    imageUrl?: string | null;
    isRedFlagged?: boolean;
};

interface Props {
    initialPurchases: PurchaseWithRelations[];
}

export default function PurchasesClient({ initialPurchases }: Props) {
    const canCreatePurchase = useCanDo('purchases', 'createGlobal');
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("الكل");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const filteredPurchases = initialPurchases.filter(purchase => {
        const matchesSearch = matchArabicText(debouncedSearchQuery, [
            purchase.project?.name,
            purchase.orderNumber,
            purchase.description
        ]);

        let matchesFilter = true;
        if (filter === "غير متوفر") {
            matchesFilter = !!(purchase as any).isRedFlagged;
        } else if (filter === "بانتظار الشراء") {
            matchesFilter = purchase.status === "REQUESTED" && !(purchase as any).isRedFlagged;
        } else if (filter === "قيد الشراء") {
            matchesFilter = purchase.status === "IN_PROGRESS" && !(purchase as any).isRedFlagged;
        } else if (filter === "مكتملة") {
            matchesFilter = purchase.status === "PURCHASED";
        }

        return matchesSearch && matchesFilter;
    });

    return (
        <DashboardLayout title="المشتريات">
            <div className="space-y-4 pb-6">

                {/* ─── Sticky Header: Search + Filters ─────────────────────────── */}
                <div className="sticky top-16 md:top-20 z-20 bg-[#f8f9fa]/95 backdrop-blur-md pt-1 pb-3 -mx-4 px-4 md:-mx-8 md:px-8 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        {/* Search — RTL-safe icon placement */}
                        <div className="relative w-full sm:w-96">
                            <input
                                type="text"
                                placeholder="ابحث عن مشتريات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full ps-4 pe-10 py-3 text-xs md:text-sm font-bold rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#102550]/40 bg-white shadow-sm"
                            />
                            <Search className="absolute end-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {canCreatePurchase && (
                            <Button onClick={() => router.push('/purchases/new')} variant="primary" className="gap-2 w-full sm:w-auto py-3 text-xs md:text-sm h-auto justify-center active:scale-95 transition-transform">
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                إضافة طلب شراء
                            </Button>
                        )}
                    </div>

                    {/* Filter Tabs — horizontal scroll, no squashing */}
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto mobile-tabs-scroll whitespace-nowrap gap-1">
                        {["الكل", "بانتظار الشراء", "قيد الشراء", "مكتملة", "غير متوفر"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-3 py-2.5 shrink-0 text-[11px] font-bold rounded-lg transition-all duration-150 active:scale-95 ${filter === tab
                                    ? "bg-[#102550] text-white shadow-sm"
                                    : tab === "غير متوفر"
                                        ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                {tab === "غير متوفر" ? <span className="flex items-center justify-center gap-1"><Flag className="w-3 h-3" /> {tab}</span> : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Empty State ───────────────────────────────────────────── */}
                {filteredPurchases.length === 0 && (
                    <div className="py-12">
                        <EmptyState
                            title="لا توجد طلبات شراء"
                            description={searchQuery ? "لم يتم العثور على طلبات مطابقة لبحثك." : "قم بإضافة طلب شراء جديد للبدء بتتبع المدفوعات."}
                            icon={ShoppingCart}
                        />
                    </div>
                )}

                {filteredPurchases.length > 0 && (
                    <>
                        {/* ─── Mobile Card View (< md) ─────────────────────────── */}
                        <div className="md:hidden space-y-3">
                            {filteredPurchases.map((purchase) => {
                                const isFlagged = (purchase as any).isRedFlagged;
                                return (
                                    <Card
                                        key={purchase.id}
                                        onClick={() => router.push(`/purchases/${purchase.id}`)}
                                        className={`p-4 cursor-pointer active:scale-[0.99] transition-all border rounded-2xl shadow-sm ${isFlagged ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}
                                    >
                                        {/* Top row: order number + flag + status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isFlagged ? 'bg-red-100' : 'bg-gray-100'}`}>
                                                    <Hash className={`w-4 h-4 ${isFlagged ? 'text-red-500' : 'text-gray-500'}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-black text-sm ${isFlagged ? 'text-red-800' : 'text-gray-900'}`}>
                                                        {purchase.orderNumber}
                                                    </p>
                                                    {isFlagged && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md mt-0.5">
                                                            <Flag className="w-2.5 h-2.5" /> غير متوفر
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <StatusBadge status={purchase.status} />
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
                                            {purchase.deadline && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                    <CalendarDays className="w-3 h-3" />
                                                    {new Date(purchase.deadline).toLocaleDateString('en-GB')}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                الكمية: {purchase.quantity || 1}
                                            </span>
                                        </div>

                                        {/* Image preview */}
                                        {purchase.imageUrl && (
                                            <img
                                                src={purchase.imageUrl}
                                                alt="صورة الطلب"
                                                className="w-full h-32 object-cover rounded-xl border border-gray-100 mb-3"
                                            />
                                        )}

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
                                                إتمام الشراء ←
                                            </Button>
                                        )}
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
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">رقم الطلب</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">الصورة</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">المشروع المرتبط</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">الموعد النهائي</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">الوصف</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">الكمية</th>
                                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredPurchases.map((purchase) => {
                                            const isFlagged = (purchase as any).isRedFlagged;
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
                                                            <img src={purchase.imageUrl} alt="صورة الطلب" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-gray-200" />
                                                        ) : (
                                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                                <ShoppingCart className="w-5 h-5 opacity-50" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-[#102550] font-bold">
                                                        {purchase.project?.name || "عام"}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-gray-500 font-medium text-[11px] md:text-sm">
                                                        {purchase.deadline ? new Date(purchase.deadline).toLocaleDateString('en-GB') : "-"}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-gray-700 min-w-[200px] whitespace-normal break-words text-[11px] md:text-sm font-medium" title={purchase.description || ""}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={isFlagged ? 'text-red-800 font-bold' : ''}>{purchase.description || "-"}</span>
                                                            {isFlagged && <Flag className="w-4 h-4 text-red-500 fill-current" />}
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
                                                                إتمام الشراء
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
