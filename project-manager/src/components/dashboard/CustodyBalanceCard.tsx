"use client"
import { Card } from "@/components/ui/Card";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, PiggyBank } from "lucide-react";
import { useState, useEffect } from "react";
import { getFlowStats } from "@/actions/dashboard";
import { useAuth } from "@/context/AuthContext";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

type FlowData = {
    role: string;
    // ADMIN / ACCOUNTANT / GENERAL_MANAGER
    walletReceived?: number;
    walletSpent?: number;
    walletRemaining?: number;
    projectsAllocated?: number;
    custodyIssued?: number;
    custodyReturned?: number;
    invoicesApproved?: number;
    // USER
    projectReceived?: number;
    projectIssued?: number;
    projectReturned?: number;
    projectSpent?: number;
    projectRemaining?: number;
    personalReceived?: number;
    personalSpent?: number;
    personalRemaining?: number;
};

export default function CustodyBalanceCard({ className = "" }: { className?: string }) {
    const { role } = useAuth();
    const [flow, setFlow] = useState<FlowData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!role) return;
        getFlowStats().then(data => {
            setFlow(data as FlowData | null);
            setIsLoading(false);
        });
    }, [role]);

    // ─── حساب الثلاثة أرقام حسب الدور ─────────────────────────────────────
    let labelReceived = "وصل";
    let labelSpent = "مُنفَّق";
    let labelLeft = "متبقي";
    let valReceived = 0;
    let valSpent = 0;
    let valLeft = 0;

    if (flow) {
        if (flow.role === "ADMIN" || flow.role === "GLOBAL_ACCOUNTANT" || flow.role === "GENERAL_MANAGER") {
            labelReceived = "إجمالي ما وُدِع في الخزنة";
            labelSpent = "موزَّع على المشاريع";
            labelLeft = "متبقي في الخزنة";
            valReceived = flow.walletReceived ?? 0;
            valSpent = flow.walletSpent ?? 0;
            valLeft = flow.walletRemaining ?? 0;
        } else if (flow.role === "USER") {
            labelReceived = "إجمالي العُهد الواردة";
            labelSpent = "مُنفَّق (فواتير مقبولة)";
            labelLeft = "المتبقي في ذمتك";
            valReceived = flow.personalReceived ?? 0;
            valSpent = flow.personalSpent ?? 0;
            valLeft = flow.personalRemaining ?? 0;
        }
    }

    const allStats = [
        { label: labelReceived, value: valReceived, icon: ArrowDownToLine, color: "text-emerald-300", bg: "bg-emerald-300/15" },
        { label: labelSpent, value: valSpent, icon: ArrowUpFromLine, color: "text-rose-300", bg: "bg-rose-300/15" },
        { label: labelLeft, value: valLeft, icon: PiggyBank, color: "text-amber-300", bg: "bg-amber-300/15" },
    ];

    // EMPLOYEE: hide the 'remaining' stat because it can go negative (debt) — only admins/accountants should see that
    const stats = (flow?.role === "USER")
        ? allStats.slice(0, 2)
        : allStats;

    return (
        <Card className={`p-0 bg-gradient-to-l from-[#7F56D9] to-purple-500 text-white rounded-2xl md:rounded-[2rem] shadow-md border-transparent overflow-hidden relative ${className}`}>
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-900 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 p-6 md:p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-sm shrink-0">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-purple-200 text-xs font-semibold tracking-wide">ملخص التدفق المالي</p>
                        <p className="text-white font-black text-lg leading-tight">
                            {(flow?.role === "ADMIN" || flow?.role === "GLOBAL_ACCOUNTANT" || flow?.role === "GENERAL_MANAGER")
                                ? "خزنة الشركة"
                                : "رصيد عُهَدي"}
                        </p>
                    </div>
                </div>

                {/* stats grid: 3 cols for non-employee, 2 cols for employee */}
                <div className={`grid ${flow?.role === "USER" ? "grid-cols-2" : "grid-cols-3"} gap-3 md:gap-4`}>
                    {stats.map((s, i) => (
                        <div key={i} className="flex flex-col gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/10">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                                <s.icon className={`w-4 h-4 md:w-5 md:h-5 ${s.color}`} />
                            </div>
                            <div>
                                <p className="text-purple-200 text-[10px] md:text-xs font-semibold leading-tight mb-1">{s.label}</p>
                                {isLoading ? (
                                    <div className="h-6 w-20 bg-white/20 animate-pulse rounded-md" />
                                ) : (
                                    <p className="text-white font-black text-base md:text-xl leading-none" dir="ltr">
                                        <AnimatedNumber value={s.value} />
                                        <span className="text-[10px] md:text-xs font-bold opacity-70 mr-1"> QAR</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
