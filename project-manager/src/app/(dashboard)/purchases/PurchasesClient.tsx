"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, Search, Filter, ShoppingCart, Paperclip } from "lucide-react";
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
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <input
                            type="text"
                            placeholder="ابحث عن مشتريات..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 md:py-2 text-xs md:text-sm font-bold rounded-xl border border-gray-100 focus:outline-primary bg-white shadow-sm"
                        />
                        <Search className="absolute left-3 top-3 md:top-2.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>

                    <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
                        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap w-full sm:w-auto">
                            {["الكل", "بانتظار الشراء", "قيد الشراء", "مكتملة", "غير متوفر"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-4 py-2 flex-1 text-[11px] md:text-sm font-medium rounded-md transition-colors ${filter === tab
                                        ? "bg-[#102550] text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                        } ${tab === "غير متوفر" && filter !== tab ? "text-red-500 hover:text-red-700 hover:bg-red-50" : ""}`}
                                >
                                    {tab === "غير متوفر" ? <span className="flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> {tab}</span> : tab}
                                </button>
                            ))}
                        </div>
                        {canCreatePurchase && (
                            <Button onClick={() => router.push('/purchases/new')} variant="primary" className="gap-2 flex-1 sm:flex-none py-2.5 md:py-2 text-xs md:text-sm h-auto justify-center">
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                اضافة طلب شراء
                            </Button>
                        )}
                    </div>
                </div>

                {/* Purchases Table */}
                <Card className="overflow-hidden shadow-sm border-gray-100 p-0">
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
                                {filteredPurchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8">
                                            <EmptyState
                                                title="لا توجد طلبات شراء"
                                                description={searchQuery ? "لم يتم العثور على طلبات مطابقة لبحثك." : "قم بإضافة طلب شراء جديد للبدء بتتبع المدفوعات."}
                                                icon={ShoppingCart}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPurchases.map((purchase) => {
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
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </div>
        </DashboardLayout>
    );
}
