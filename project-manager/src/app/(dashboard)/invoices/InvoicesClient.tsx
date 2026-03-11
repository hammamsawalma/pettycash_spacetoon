"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { Card } from "@/components/ui/Card";
import { Search, Eye, QrCode, FileText, Building2 } from "lucide-react";
import { useState } from "react";
import { getInvoices } from "@/actions/invoices";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { matchArabicText } from "@/utils/arabic";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { ExportButton } from "@/components/ui/ExportButton";
import { getInvoicesExportData } from "@/actions/exports";
import { downloadExcel, generatePrintableReport, openPrintWindow, formatDate, formatCurrency, invoiceStatusLabel, paymentSourceLabel, type ExportColumn } from "@/lib/export-utils";
import { useCanDo } from "@/components/auth/Protect";

type InvoiceWithRelations = Awaited<ReturnType<typeof getInvoices>>[number];

interface Props {
    initialInvoices: InvoiceWithRelations[];
}

export default function InvoicesClient({ initialInvoices }: Props) {
    const { user } = useAuth();
    const router = useRouter();
    const { t, locale } = useLanguage();
    const [filter, setFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const canExport = useCanDo('exports', 'view');

    const invoiceColumns: ExportColumn[] = [
        { key: "reference", label: locale === 'ar' ? 'المرجع' : 'Reference' },
        { key: "type", label: locale === 'ar' ? 'النوع' : 'Type' },
        { key: "amount", label: t('common.amount'), format: (v) => formatCurrency(v as number) },
        { key: "status", label: t('common.status'), format: (v) => invoiceStatusLabel[v as string] || String(v) },
        { key: "paymentSource", label: locale === 'ar' ? 'مصدر الدفع' : 'Payment Source', format: (v) => paymentSourceLabel[v as string] || String(v) },
        { key: "projectName", label: t('projects.title') },
        { key: "categoryName", label: locale === 'ar' ? 'التصنيف' : 'Category' },
        { key: "creatorName", label: locale === 'ar' ? 'المنشئ' : 'Created By' },
        { key: "createdAt", label: t('common.date'), format: (v) => formatDate(v as string) },
    ];

    const handleExportExcel = async () => {
        const data = await getInvoicesExportData();
        downloadExcel([{ name: t('invoices.title'), columns: invoiceColumns, data: data as Record<string, unknown>[] }], locale === 'ar' ? "تقرير_الفواتير" : "invoices_report");
    };

    const handleExportPDF = async () => {
        const data = await getInvoicesExportData();
        const totalAmount = data.reduce((s, d) => s + d.amount, 0);
        const html = generatePrintableReport({
            title: locale === 'ar' ? 'تقرير الفواتير' : 'Invoices Report',
            subtitle: locale === 'ar' ? 'سبيستون بوكيت — إدارة المشاريع' : 'Spacetoon Pocket — Project Management',
            columns: invoiceColumns,
            data: data as Record<string, unknown>[],
            summary: [
                { label: locale === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices', value: String(data.length) },
                { label: locale === 'ar' ? 'إجمالي المبالغ' : 'Total Amount', value: formatCurrency(totalAmount) },
                { label: t('common.approved'), value: String(data.filter(d => d.status === 'APPROVED').length) },
                { label: t('common.pending'), value: String(data.filter(d => d.status === 'PENDING').length) },
            ],
            branchName: user?.branchName,
            branchFlag: user?.branchFlag,
        });
        openPrintWindow(html);
    };

    const filteredInvoices = initialInvoices.filter(invoice => {
        let matchesFilter = true;
        if (filter === "APPROVED") matchesFilter = invoice.status === 'APPROVED';
        else if (filter === "PENDING") matchesFilter = invoice.status === 'PENDING';
        else if (filter === "REJECTED") matchesFilter = invoice.status === 'REJECTED';
        else if (filter === "COMPANY") matchesFilter = (invoice as Record<string, unknown>).expenseScope === 'COMPANY';
        // "ALL" shows everything

        const clientName = invoice.project?.name || invoice.creator?.name;
        const matchesSearch = matchArabicText(debouncedSearchQuery, [
            clientName,
            invoice.reference,
            invoice.notes
        ]);

        return matchesFilter && matchesSearch;
    });

    return (
        <DashboardLayout title={t('invoices.title')}>
            <div className="space-y-4 pb-6">

                {/* ─── Sticky Header: Search + Filters ─────────────────────
                  * Stays at top on mobile so users can filter while scrolling
                  */}
                <div className="sticky top-16 md:top-20 z-20 bg-[#f8f9fa]/95 backdrop-blur-md pt-1 pb-3 -mx-4 px-4 md:-mx-8 md:px-8 space-y-3">
                    {/* Search Bar */}
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder={locale === 'ar' ? 'بحث عن فاتورة...' : 'Search invoices...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-full border border-transparent bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#102550]/50 text-sm"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center pointer-events-none text-gray-400">
                            <Search className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Filter Tabs — horizontal scroll on mobile */}
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto mobile-tabs-scroll whitespace-nowrap gap-1">
                        {[
                            { key: "ALL", label: t('common.all') },
                            { key: "APPROVED", label: t('common.approved') },
                            { key: "PENDING", label: t('common.pending') },
                            { key: "REJECTED", label: t('common.rejected') },
                            { key: "COMPANY", label: locale === 'ar' ? 'مصاريف شركة' : 'Company Expenses' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-4 py-2.5 flex-1 min-w-[68px] text-xs font-bold rounded-lg transition-all duration-150 active:scale-95 ${filter === key
                                    ? key === "COMPANY" ? "bg-purple-600 text-white shadow-sm" : "bg-[#102550] text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {canExport && (
                            <ExportButton
                                onExportExcel={handleExportExcel}
                                onExportPDF={handleExportPDF}
                                label={locale === 'ar' ? 'تصدير الفواتير' : 'Export Invoices'}
                            />
                        )}
                        {!!user && user.role !== 'GENERAL_MANAGER' && (
                            <button onClick={() => router.push('/invoices/new')} className="hidden md:flex flex-1 py-4 md:py-5 text-sm md:text-base font-bold rounded-2xl bg-[#102550] hover:bg-[#102550]/90 active:scale-[0.98] text-white border-none items-center justify-center gap-2 shadow-sm transition-all duration-150">
                                <span>+ {locale === 'ar' ? 'إضافة فاتورة جديدة' : 'Add New Invoice'}</span>
                            </button>
                        )}
                    </div>
                </div>


                {/* Invoices Grid */}
                {filteredInvoices.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={FileText}
                            title={t('invoices.noInvoices')}
                            description={searchQuery ? (locale === 'ar' ? 'لم يتم العثور على فواتير مطابقة لبحثك، جرب بكلمات أخرى.' : 'No invoices match your search. Try different keywords.') : (locale === 'ar' ? 'لا يوجد فواتير مُضافة حالياً في النظام.' : 'No invoices in the system yet.')}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        {filteredInvoices.map((invoice) => {
                            const isCompany = (invoice as Record<string, unknown>).expenseScope === 'COMPANY';
                            const clientName = isCompany ? (locale === 'ar' ? 'مصاريف شركة' : 'Company Expenses') : (invoice.project?.name || invoice.creator?.name || (locale === 'ar' ? 'عميل' : 'Client'));

                            return (
                                <Card key={invoice.id} className="p-3 md:p-5 flex flex-col hover:border-[#102550]/30 transition-colors relative overflow-hidden group shadow-sm border border-gray-100 rounded-2xl">
                                    {/* Top Section */}
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className={`w-9 h-9 md:w-12 md:h-12 ${isCompany ? 'bg-purple-50' : 'bg-blue-50'} rounded-lg flex items-center justify-center ${isCompany ? 'text-purple-600' : 'text-[#102550]'} font-bold shrink-0 text-sm md:text-base`}>
                                                {isCompany ? <Building2 className="w-5 h-5" /> : clientName.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm md:text-lg text-gray-900 line-clamp-1" title={clientName}>{clientName}</h4>
                                                <p className="text-gray-400 text-xs md:text-xs font-semibold">{invoice.reference}</p>
                                            </div>
                                        </div>
                                        {/* QrCode icon — decorative, hidden on mobile to save space */}
                                        <QrCode className="hidden md:block w-12 h-12 text-gray-100 shrink-0" />
                                    </div>

                                    {/* Center Section */}
                                    <div className="mb-3 md:mb-4 flex-1">
                                        <p className="text-xs md:text-sm text-gray-500 line-clamp-2 leading-relaxed">{invoice.notes || (locale === 'ar' ? 'لا يوجد وصف' : 'No description')}</p>
                                    </div>

                                    {/* Bottom Section */}
                                    <div className="grid grid-cols-2 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-gray-50 mb-3 md:mb-4 text-center">
                                        <div className="bg-gray-50 rounded-xl p-2 md:p-2">
                                            <p className="text-[11px] md:text-xs text-gray-400 font-bold mb-0.5 md:mb-1">{t('common.date')}</p>
                                            <p className="font-bold text-gray-900 text-xs md:text-sm">{new Date(invoice.date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <div className="bg-[#102550]/5 rounded-xl p-2 md:p-2">
                                            <p className="text-[11px] md:text-xs text-gray-400 font-bold mb-0.5 md:mb-1">{t('common.total')}</p>
                                            <p className="font-bold text-[#102550] text-xs md:text-sm">{invoice.amount.toLocaleString('en-US')} <span className="text-[9px] md:text-[10px]"><CurrencyDisplay /></span></p>
                                        </div>
                                        {/* Bug #4 fix: flex-wrap so 3 items never overflow the card width */}
                                        <div className="bg-gray-50 rounded-xl p-2 col-span-2 flex flex-wrap items-center gap-1.5 px-3">
                                            <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                                                {invoice.paymentSource === 'PERSONAL' ? (locale === 'ar' ? '💰 من الجيب' : '💰 Out of Pocket') : (locale === 'ar' ? '🏢 من العهدة' : '🏢 From Custody')}
                                            </div>
                                            {invoice.category && (
                                                <div className="flex items-center gap-1 text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded shadow-sm">
                                                    {invoice.category.icon} {invoice.category.name}
                                                </div>
                                            )}
                                            {invoice._count?.items > 0 && (
                                                <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                                                    {invoice._count.items} {locale === 'ar' ? 'بنود' : 'items'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                                        <StatusBadge status={invoice.status} />
                                        <div className="flex gap-1 md:gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); router.push(`/invoices/${invoice.id}`); }} className="p-1.5 md:p-2.5 text-gray-400 hover:text-[#102550] hover:bg-blue-50 rounded-lg transition-colors bg-gray-50" title={locale === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}>
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
