"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { ArrowUpRight, ArrowDownRight, Wallet, Receipt, Building, FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { useState, useEffect, useCallback } from "react";
import { getCompanyWallet } from "@/actions/wallet";
import CustodyBalanceCard from "@/components/dashboard/CustodyBalanceCard";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

type WalletEntry = {
    id: string;
    type: string;
    amount: number;
    note: string | null;
    createdAt: Date | string;
    creator: { name: string };
};

const entryTypeLabel: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; sign: '+' | '-' }> = {
    DEPOSIT: { label: "إيداع في الخزنة", icon: ArrowDownRight, color: "text-emerald-600", bg: "bg-emerald-50", sign: '+' },
    WITHDRAW: { label: "سحب من الخزنة", icon: ArrowUpRight, color: "text-red-600", bg: "bg-red-50", sign: '-' },
    ALLOCATE_TO_PROJECT: { label: "تخصيص لمشروع", icon: FolderKanban, color: "text-[#7F56D9]", bg: "bg-purple-50", sign: '-' },
    RETURN_FROM_PROJECT: { label: "إرجاع من مشروع", icon: Building, color: "text-amber-600", bg: "bg-amber-50", sign: '+' },
};

export default function DepositsPage() {
    const [entries, setEntries] = useState<WalletEntry[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWallet = useCallback(async () => {
        setIsLoading(true);
        const data = await getCompanyWallet();
        if (data) {
            setWalletBalance(data.balance);
            setEntries((data.entries ?? []) as WalletEntry[]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchWallet(); }, [fetchWallet]);

    return (
        <DashboardLayout title="سجل معاملات الخزنة">
            <div className="space-y-6 md:space-y-8 pb-6">

                {/* Wallet Balance */}
                <CustodyBalanceCard />

                {/* Transactions History */}
                <h3 className="font-bold text-base md:text-lg text-gray-900 pt-2 md:pt-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[#7F56D9]" />
                    سجل عمليات خزنة الشركة
                </h3>

                <Card className="overflow-hidden shadow-sm border-gray-100 p-0 rounded-2xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-xs md:text-sm text-right min-w-[700px]">
                            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                                <tr>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">رقم العملية</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">التاريخ</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">نوع العملية</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">الملاحظة</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">بواسطة</th>
                                    <th className="px-4 md:px-6 py-3 md:py-4 font-bold">المبلغ (<CurrencyDisplay />)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {isLoading ? (
                                    <>
                                        <TableRowSkeleton columns={6} />
                                        <TableRowSkeleton columns={6} />
                                        <TableRowSkeleton columns={6} />
                                    </>
                                ) : entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8">
                                            <EmptyState
                                                title="لا توجد عمليات على الخزنة"
                                                description="لم يتم تسجيل أي عمليات مالية على خزنة الشركة حتى الآن."
                                                icon={Receipt}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((entry) => {
                                        const meta = entryTypeLabel[entry.type] ?? { label: entry.type, icon: Wallet, color: "text-gray-600", bg: "bg-gray-50", sign: '+' as '+' | '-' };
                                        const Icon = meta.icon;
                                        return (
                                            <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-4 md:px-6 py-4 font-bold text-gray-900 border-r-4 border-transparent group-hover:border-[#7F56D9]" title={entry.id}>
                                                    TRX-{entry.id.substring(0, 8).toUpperCase()}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-gray-500 font-medium text-[11px] md:text-sm">
                                                    {new Date(entry.createdAt).toLocaleDateString('en-GB')}
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 text-[10px] md:text-xs font-bold rounded-lg ${meta.bg} ${meta.color}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-gray-700 font-medium text-[11px] md:text-sm min-w-[200px] whitespace-normal break-words">
                                                    {entry.note || '—'}
                                                </td>
                                                <td className="px-4 md:px-6 py-4 text-gray-500 text-[11px] md:text-sm font-medium">
                                                    {entry.creator?.name ?? '—'}
                                                </td>
                                                <td className={`px-4 md:px-6 py-4 font-black text-left text-[13px] md:text-base ${meta.color}`} dir="ltr">
                                                    {meta.sign}{entry.amount.toLocaleString()}
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
