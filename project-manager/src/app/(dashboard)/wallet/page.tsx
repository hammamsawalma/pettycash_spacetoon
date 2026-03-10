import { getCompanyWallet } from "@/actions/wallet";
import { getSession } from "@/lib/auth";
import { canDo } from "@/lib/permissions";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Plus, RefreshCw, FolderKanban } from "lucide-react";
import Link from "next/link";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { UserRole } from "@/context/AuthContext";
import { WalletExportButton } from "./WalletExportButton";

export default async function WalletPage() {
    const session = await getSession();
    if (!session || !canDo(session.role as UserRole, 'wallet', 'view')) {
        redirect("/");
    }


    const walletData = await getCompanyWallet();

    if (!walletData) {
        return (
            <DashboardLayout title="خزنة الشركة">
                <div className="py-20 text-center text-gray-500">حدث خطأ أثناء تحميل بيانات الخزنة</div>
            </DashboardLayout>
        );
    }

    const { balance, totalIn, totalOut, entries } = walletData;

    return (
        <DashboardLayout title="لوحة تحكم خزنة الشركة">
            <div className="space-y-6 md:space-y-8" dir="rtl">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">خزنة الشركة الرئيسية (Company Wallet)</h2>
                        <p className="text-sm text-gray-500 mt-1">الرصيد المركزي للشركة وتخصيص الميزانيات للمشاريع</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {canDo(session.role as UserRole, 'exports', 'view') && (
                            <WalletExportButton />
                        )}
                        {canDo(session.role as UserRole, 'wallet', 'deposit') && (
                            <Link
                                href="/wallet/deposit"
                                className="inline-flex items-center justify-center gap-2 h-10 md:h-11 px-4 md:px-6 rounded-xl shadow-sm text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition"
                            >
                                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                إيداع في الخزنة
                            </Link>
                        )}
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <Card className="p-6 md:p-8 flex items-center gap-4 border-r-4 border-r-green-500 shadow-sm rounded-l-2xl rounded-r-none border-l-0 border-y-0">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                            <Wallet className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">الرصيد المتاح والمتبقي</p>
                            <p className="text-2xl md:text-3xl font-black text-gray-900">{balance.toLocaleString()} <span className="text-sm font-bold text-gray-400"><CurrencyDisplay /></span></p>
                        </div>
                    </Card>

                    <Card className="p-6 md:p-8 flex items-center gap-4 shadow-sm rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <ArrowDownCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">إجمالي الإيداعات (دخول)</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{totalIn.toLocaleString()} <span className="text-xs font-bold text-gray-400"><CurrencyDisplay /></span></p>
                        </div>
                    </Card>

                    <Card className="p-6 md:p-8 flex items-center gap-4 shadow-sm rounded-2xl">
                        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <ArrowUpCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-gray-500 mb-1">المخصص للمشاريع (خروج)</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900">{totalOut.toLocaleString()} <span className="text-xs font-bold text-gray-400"><CurrencyDisplay /></span></p>
                        </div>
                    </Card>
                </div>

                {/* Ledger / Transaction History */}
                <Card className="overflow-hidden shadow-sm border-gray-100 rounded-2xl">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                        <h3 className="text-lg font-bold text-gray-900">سجل حركات الخزنة (Ledger)</h3>
                    </div>

                    {entries?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right divide-y divide-gray-100">
                                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">التاريخ</th>
                                        <th scope="col" className="px-6 py-4">نوع الحركة</th>
                                        <th scope="col" className="px-6 py-4">المبلغ</th>
                                        <th scope="col" className="px-6 py-4">بواسطة</th>
                                        <th scope="col" className="px-6 py-4 w-1/3">ملاحظات / مرجع</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {entries.map((entry: any) => {
                                        const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; isOutgoing: boolean }> = {
                                            DEPOSIT: { label: "إيداع", icon: ArrowDownCircle, color: "text-green-700", bg: "bg-green-50", isOutgoing: false },
                                            ALLOCATE_TO_PROJECT: { label: "تخصيص لمشروع", icon: FolderKanban, color: "text-amber-700", bg: "bg-amber-50", isOutgoing: true },
                                            SETTLE_DEBT: { label: "تسوية دين موظف", icon: ArrowUpCircle, color: "text-rose-700", bg: "bg-rose-50", isOutgoing: true },
                                            RETURN_FROM_PROJECT: { label: "استرجاع رصيد", icon: RefreshCw, color: "text-blue-700", bg: "bg-blue-50", isOutgoing: false },
                                            RETURN: { label: "استرجاع رصيد", icon: RefreshCw, color: "text-blue-700", bg: "bg-blue-50", isOutgoing: false },
                                        };
                                        const config = typeConfig[entry.type] || { label: entry.type, icon: Wallet, color: "text-gray-700", bg: "bg-gray-50", isOutgoing: false };
                                        const EntryIcon = config.icon;
                                        return (
                                            <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{new Date(entry.createdAt).toLocaleDateString('en-GB')}</span>
                                                        <span className="text-[10px] text-gray-400">{new Date(entry.createdAt).toLocaleTimeString('en-GB')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${config.bg} ${config.color}`}>
                                                        <EntryIcon className="w-3.5 h-3.5" /> {config.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`font-black text-sm ${config.isOutgoing ? 'text-red-500' : 'text-green-600'}`}>
                                                        {config.isOutgoing ? '-' : '+'} {entry.amount.toLocaleString()} <span className="text-[10px] font-bold"><CurrencyDisplay /></span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-bold">
                                                    {entry.creator?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <p className="line-clamp-2 max-w-xs" title={entry.note || '-'}>
                                                        {entry.note || '-'}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-sm font-bold">لا توجد حركات مسجلة في الخزنة حتى الآن</p>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
