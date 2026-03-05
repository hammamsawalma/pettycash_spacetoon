"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Search, Download, Eye, QrCode, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getInvoices } from "@/actions/invoices";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useCachedFetch } from "@/hooks/useCachedFetch";
import { useDebounce } from "@/hooks/useDebounce";
import { matchArabicText } from "@/utils/arabic";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

type InvoiceWithRelations = any;

export default function InvoicesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState("الكل");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const { data: invoices, isLoading, setData: setInvoices } = useCachedFetch<InvoiceWithRelations[]>(
        "invoices_cache",
        () => getInvoices().then(d => d as unknown as InvoiceWithRelations[]),
        []
    );

    const filteredInvoices = invoices.filter(invoice => {
        const matchesFilter = filter === "الكل" ||
            (invoice.status === 'APPROVED' && filter === 'مقبولة') ||
            (invoice.status === 'PENDING' && filter === 'معلقة') ||
            (invoice.status === 'REJECTED' && filter === 'مرفوضة');

        const clientName = invoice.project?.name || invoice.creator.name;
        const matchesSearch = matchArabicText(debouncedSearchQuery, [
            clientName,
            invoice.reference,
            invoice.notes
        ]);

        return matchesFilter && matchesSearch;
    });

    return (
        <DashboardLayout title="الفواتير">
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* Header Actions */}
                <div className="flex flex-col gap-4">
                    {/* Search Bar - Full Width Pill on Mobile */}
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="بحث عن فاتورة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-full border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7F56D9]/50 text-sm"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center pointer-events-none text-gray-400">
                            <Search className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap">
                        {["الكل", "مقبولة", "معلقة", "مرفوضة"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-4 py-2 flex-1 text-[11px] md:text-sm font-medium rounded-md transition-colors ${filter === tab
                                    ? "bg-[#7F56D9] text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Add Invoice Button */}
                    {!!user && (
                        <button onClick={() => router.push('/invoices/new')} className="w-full py-6 md:py-7 text-sm md:text-lg font-bold rounded-2xl bg-[#7F56D9] hover:bg-[#7F56D9]-hover text-white border-none flex items-center justify-center gap-2 shadow-sm mt-2">
                            <span>أضف فاتورة جديدة</span>
                        </button>
                    )}
                </div>

                {/* Invoices Grid */}
                {isLoading ? (
                    <LoadingSkeleton count={4} />
                ) : filteredInvoices.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={FileText}
                            title="لا توجد فواتير"
                            description={searchQuery ? "لم يتم العثور على فواتير مطابقة لبحثك، جرب بكلمات أخرى." : "لا يوجد فواتير مُضافة حالياً في النظام."}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        {filteredInvoices.map((invoice) => {
                            const clientName = invoice.project?.name || invoice.creator.name || 'عميل';

                            return (
                                <Card key={invoice.id} className="p-3 md:p-5 flex flex-col hover:border-[#7F56D9]/30 transition-colors relative overflow-hidden group shadow-sm border border-gray-100 rounded-2xl">
                                    {/* Top Section */}
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-50 rounded-lg flex items-center justify-center text-[#7F56D9] font-bold shrink-0 text-xs md:text-base">
                                                {clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs md:text-lg text-gray-900 line-clamp-1" title={clientName}>{clientName}</h4>
                                                <p className="text-gray-400 text-[9px] md:text-xs font-semibold">{invoice.reference}</p>
                                            </div>
                                        </div>
                                        <QrCode className="w-6 h-6 md:w-12 md:h-12 text-gray-100 shrink-0" />
                                    </div>

                                    {/* Center Section */}
                                    <div className="mb-3 md:mb-4 flex-1">
                                        <p className="text-[10px] md:text-sm text-gray-500 line-clamp-2 leading-relaxed">{invoice.notes || "لا يوجد وصف"}</p>
                                    </div>

                                    {/* Bottom Section */}
                                    <div className="grid grid-cols-2 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-gray-50 mb-3 md:mb-4 text-center">
                                        <div className="bg-gray-50 rounded-xl p-1.5 md:p-2">
                                            <p className="text-[9px] md:text-xs text-gray-400 font-bold mb-0.5 md:mb-1">التاريخ</p>
                                            <p className="font-bold text-gray-900 text-[10px] md:text-sm">{new Date(invoice.date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <div className="bg-[#7F56D9]/5 rounded-xl p-1.5 md:p-2">
                                            <p className="text-[9px] md:text-xs text-gray-400 font-bold mb-0.5 md:mb-1">الإجمالي</p>
                                            <p className="font-bold text-[#7F56D9] text-[10px] md:text-sm">{invoice.amount.toLocaleString()} <span className="text-[8px] md:text-[10px]"><CurrencyDisplay /></span></p>
                                        </div>
                                        {/* Row 2: Payment Source and Tansiq indicator */}
                                        <div className="bg-gray-50 rounded-xl p-1.5 md:p-2 col-span-2 flex justify-between items-center px-3">
                                            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-gray-600">
                                                {invoice.paymentSource === 'PERSONAL' ? '💰 من الجيب' : '🏢 من العهدة'}
                                            </div>
                                            {invoice.category && (
                                                <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded shadow-sm">
                                                    {invoice.category.icon} {invoice.category.name}
                                                </div>
                                            )}
                                            {invoice._count?.items > 0 && (
                                                <div className="text-[9px] md:text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                                                    {invoice._count.items} بنود تدرجية
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                                        <StatusBadge status={invoice.status} />

                                        <div className="flex gap-1 md:gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); router.push(`/invoices/${invoice.id}`); }} className="p-1.5 md:p-2.5 text-gray-400 hover:text-[#7F56D9] hover:bg-purple-50 rounded-lg transition-colors bg-gray-50" title="عرض الفاتورة">
                                                <Eye className="w-3 h-3 md:w-4 md:h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
