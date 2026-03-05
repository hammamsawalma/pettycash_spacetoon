"use client"
import { Card } from "@/components/ui/Card";
import { Wallet, CheckCircle, Clock, PiggyBank } from "lucide-react";
import { useState, useEffect } from "react";
import { getFlowStats } from "@/actions/dashboard";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

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

export default function ManagerMarginCards({ className = "" }: { className?: string }) {
    const { role } = useAuth();
    const [flow, setFlow] = useState<FlowData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
    const availableMargin = walletReceived - invoicesApproved;

    const cards = [
        {
            title: "إجمالي النقد بالشركة",
            value: walletReceived,
            icon: Wallet,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-100",
            subtitle: "كل ما دخل الخزنة"
        },
        {
            title: "المصروفات المعتمدة",
            value: invoicesApproved,
            icon: CheckCircle,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-100",
            subtitle: "إجمالي فواتير المصروفات"
        },
        {
            title: "فواتير قيد الاعتماد",
            value: invoicesPending,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-100",
            subtitle: "بانتظار الموافقة"
        },
        {
            title: "الرصيد المتاح للشركة",
            value: availableMargin,
            icon: PiggyBank,
            color: "text-purple-600",
            bg: "bg-purple-600/10",
            border: "border-purple-200",
            highlight: true,
            subtitle: "السيولة المتبقية"
        }
    ];

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
            {cards.map((card, i) => (
                <Card
                    key={i}
                    className={`relative overflow-hidden p-5 transition-all duration-300 hover:shadow-lg custom-card ${card.highlight
                        ? 'bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-purple-100/50 shadow-md ring-1 ring-purple-100'
                        : 'bg-white hover:border-primary/30'
                        }`}
                >
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-xs lg:text-sm font-bold text-gray-700 mb-1">{card.title}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{card.subtitle}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>

                    <div className="relative z-10 mt-2">
                        <div className="flex items-baseline gap-1">
                            {isLoading ? (
                                <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-md" />
                            ) : (
                                <>
                                    <span className={`text-2xl md:text-3xl font-black tracking-tight ${card.highlight ? 'text-purple-900' : 'text-gray-900'}`}>
                                        <AnimatedNumber value={card.value} />
                                    </span>
                                    <span className="text-xs font-bold text-gray-400 ml-1"><CurrencyDisplay /></span>
                                </>
                            )}
                        </div>
                    </div>

                    {card.highlight && (
                        <>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary opacity-5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                        </>
                    )}
                </Card>
            ))}
        </div>
    );
}
