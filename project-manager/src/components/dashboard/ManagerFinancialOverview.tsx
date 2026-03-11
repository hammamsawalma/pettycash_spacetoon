"use client"
import { Card } from "@/components/ui/Card";
import { Wallet, CheckCircle, Clock, PiggyBank, ArrowRightLeft, FolderKanban } from "lucide-react";
import { useState, useEffect } from "react";
import { getFlowStats } from "@/actions/dashboard";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useLanguage } from "@/context/LanguageContext";

type FlowData = {
    role: string;
    // ADMIN / ACCOUNTANT
    walletReceived?: number;
    walletSpent?: number;
    walletRemaining?: number;
    projectsAllocated?: number;
    custodyIssued?: number;
    custodyReturned?: number;
    invoicesApproved?: number;
    invoicesPending?: number;
};

export default function ManagerFinancialOverview({ className = "" }: { className?: string }) {
    const { role } = useAuth();
    const [flow, setFlow] = useState<FlowData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { locale } = useLanguage();

    useEffect(() => {
        if (!role || (role !== "ADMIN" && role !== "GLOBAL_ACCOUNTANT" && role !== "GENERAL_MANAGER")) {
            setIsLoading(false);
            return;
        }
        getFlowStats().then(data => {
            setFlow(data as FlowData | null);
            setIsLoading(false);
        });
    }, [role]);

    if (!role || (role !== "ADMIN" && role !== "GLOBAL_ACCOUNTANT" && role !== "GENERAL_MANAGER")) {
        return null;
    }

    const walletReceived = flow?.walletReceived ?? 0;
    const invoicesApproved = flow?.invoicesApproved ?? 0;
    const invoicesPending = flow?.invoicesPending ?? 0;
    const projectsAllocated = flow?.projectsAllocated ?? 0;

    const actualLiquidity = walletReceived - invoicesApproved;
    const expectedLiquidity = actualLiquidity - invoicesPending;

    const mainCards = [
        {
            title: locale === 'ar' ? "السيولة الفعليّة (المتاحة)" : "Actual Liquidity (Available)",
            value: actualLiquidity,
            icon: PiggyBank,
            color: "text-emerald-600",
            bg: "bg-emerald-600/10",
            border: "border-emerald-200",
            highlight: true,
            subtitle: locale === 'ar' ? "السيولة الحالية المتبقية" : "Current remaining liquidity",
            gradient: "from-emerald-50 to-white",
            shadow: "shadow-emerald-100/50"
        },
        {
            title: locale === 'ar' ? "السيولة المتوقعة" : "Expected Liquidity",
            value: expectedLiquidity,
            icon: ArrowRightLeft,
            color: "text-blue-600",
            bg: "bg-blue-600/10",
            border: "border-blue-200",
            highlight: true,
            subtitle: locale === 'ar' ? "السيولة المتبقية إذا تم اعتماد جميع الفواتير" : "Remaining if all invoices are approved",
            gradient: "from-blue-50 to-white",
            shadow: "shadow-blue-100/50"
        }
    ];

    const detailsCards = [
        {
            title: locale === 'ar' ? "إجمالي رأس المال بالشركة" : "Total Company Capital",
            value: walletReceived,
            icon: Wallet,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: locale === 'ar' ? "المصروفات المعتمدة (إنفاق فعلي)" : "Approved Expenses (Actual Spending)",
            value: invoicesApproved,
            icon: CheckCircle,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
        },
        {
            title: locale === 'ar' ? "فواتير قيد الاعتماد" : "Invoices Pending Approval",
            value: invoicesPending,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            title: locale === 'ar' ? "ميزانيات موزعة على مشاريع" : "Budgets Allocated to Projects",
            value: projectsAllocated,
            icon: FolderKanban,
            color: "text-[#102550]",
            bg: "bg-[#102550]/10",
        }
    ];

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Main Liquidity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mainCards.map((card, i) => (
                    <Card
                        key={i}
                        className={`relative overflow-hidden p-6 transition-all duration-300 hover:shadow-lg custom-card 
                            bg-gradient-to-br ${card.gradient} border-${card.border} shadow-md ring-1 ring-${card.border} ${card.shadow}`}
                    >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-sm md:text-base font-bold text-gray-800 mb-1">{card.title}</p>
                                <p className="text-[11px] md:text-xs text-gray-500 font-semibold">{card.subtitle}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                        </div>

                        <div className="relative z-10 mt-4">
                            <div className="flex items-baseline gap-1">
                                {isLoading ? (
                                    <div className="h-10 w-32 bg-white/50 animate-pulse rounded-md" />
                                ) : (
                                    <>
                                        <span className={`text-3xl md:text-4xl font-black tracking-tight ${card.color.replace('text-', 'text-').replace('600', '900')}`}>
                                            <AnimatedNumber value={card.value} />
                                        </span>
                                        <span className="text-sm font-bold text-gray-500 ml-1"><CurrencyDisplay /></span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Decorative Background Blobs */}
                        <div className={`absolute top-0 right-0 w-40 h-40 ${card.bg.replace('/10', '')} opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
                        <div className={`absolute bottom-0 left-0 w-40 h-40 ${card.bg.replace('/10', '')} opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none`} />
                    </Card>
                ))}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {detailsCards.map((card, i) => (
                    <Card key={i} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 group cursor-default shadow-sm border-gray-100 hover:border-primary/20 transition-colors">
                        <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shrink-0 ${card.bg}`}>
                            <card.icon className={`h-5 w-5 md:h-6 md:w-6 ${card.color}`} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-gray-500 mb-1 leading-snug">{card.title}</p>
                            <div className="flex items-baseline gap-1">
                                {isLoading ? (
                                    <div className="h-6 w-16 bg-gray-100 animate-pulse rounded-md" />
                                ) : (
                                    <>
                                        <p className="text-sm md:text-lg font-black text-gray-900 drop-shadow-sm">
                                            <AnimatedNumber value={card.value} />
                                        </p>
                                        <span className="text-[10px] font-bold text-gray-400"><CurrencyDisplay /></span>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
