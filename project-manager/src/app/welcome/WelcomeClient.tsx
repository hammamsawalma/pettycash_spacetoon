"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Globe, ArrowRight, ShieldCheck, MapPin, Loader2 } from "lucide-react";

type Branch = {
    id: string;
    name: string;
    code: string;
    currency: string;
    country: string;
    flag: string;
};

export default function WelcomeClient({ branches }: { branches: Branch[] }) {
    const router = useRouter();
    const { t, locale, setLocale } = useLanguage();
    const [step, setStep] = useState<"welcome" | "branches" | "connecting">("welcome");
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    const handleSelectBranch = (branch: Branch) => {
        setSelectedBranch(branch);
        setStep("connecting");
        
        // Save choice to localStorage for login page personalization
        try {
            localStorage.setItem("selectedBranchCode", branch.code);
            localStorage.setItem("selectedBranchName", branch.name);
            localStorage.setItem("selectedBranchFlag", branch.flag);
        } catch(e) {}

        // Fake connection delay for purely aesthetic/psychological effect
        setTimeout(() => {
            router.push(`/login?branch=${branch.code}`);
        }, 1500);
    };

    return (
        <div className="welcome-container relative min-h-screen bg-[#071329] overflow-hidden flex flex-col justify-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Ambient Animated Background Arrays */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen animate-pulse duration-[8s]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen animate-pulse duration-[12s]" />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-yellow-400/5 blur-[100px] mix-blend-screen animate-pulse duration-[10s]" />
                
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDQpIi8+Cjwvc3ZnPg==')] opacity-50" />
            </div>

            {/* Language Toggle */}
            <button
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="absolute top-6 right-6 z-50 flex items-center justify-center w-10 h-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-all shadow-lg font-bold text-xs"
            >
                {locale === 'ar' ? 'EN' : 'AR'}
            </button>
            
            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col justify-center h-full min-h-[500px]">
                
                {/* ---------- STEP 1: WELCOME ---------- */}
                {step === "welcome" && (
                    <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
                        
                        <div className="mb-8 relative group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/40 transition-all duration-700" />
                            <img
                                src="/spacetoon-logo.png"
                                alt="Spacetoon Pocket"
                                className="relative h-[110px] md:h-[135px] object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] transform group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-300 mb-6 drop-shadow-sm tracking-tight leading-tight">
                            Spacetoon Pocket
                        </h1>
                        
                        <p className="text-lg md:text-xl text-blue-200/80 max-w-2xl leading-relaxed mb-12 font-medium">
                            {t('login.smartSystemDesc')}
                        </p>

                        <button 
                            onClick={() => setStep("branches")}
                            className="group relative overflow-hidden rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(37,99,235,0.25)] hover:border-blue-500/50 hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="px-8 py-4 flex items-center gap-4">
                                <span className="text-white font-semibold text-lg tracking-wide">
                                    {t('welcome.accessPortal')}
                                </span>
                                <ArrowRight className={`w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform ${locale === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                            </div>
                        </button>
                    </div>
                )}


                {/* ---------- STEP 2: BRANCH SELECTION ---------- */}
                {step === "branches" && (
                    <div className="w-full flex flex-col items-center">
                        
                        <div className="text-center mb-10 w-full relative">
                            {/* Back arrow hidden intentionally for cleaner UX, but could be added */}
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                                {t('welcome.selectRegionalBranch')}
                            </h2>
                            <p className="text-blue-200/60 font-medium">
                                {t('welcome.selectConnectingSubtitle')}
                            </p>
                        </div>

                        {branches.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full mx-auto">
                                {branches.map((branch, i) => (
                                    <button
                                        key={branch.id}
                                        onClick={() => handleSelectBranch(branch)}
                                        className="group relative flex flex-col items-center py-7 px-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-blue-500/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/40"
                                        style={{ animation: `fade-in-up 0.5s ease-out ${i * 0.08}s both` }}
                                    >
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                                            {branch.flag}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1.5 group-hover:text-blue-50 transition-colors">
                                            {branch.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-blue-300/60 text-xs font-semibold uppercase tracking-wider">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{branch.country}</span>
                                            <span className="mx-0.5">•</span>
                                            <span>{branch.currency}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                                <p className="text-white/60 mb-6 font-medium text-lg">{t('welcome.noBranches')}</p>
                                <button 
                                    onClick={() => router.push("/login")}
                                    className="px-8 py-3 rounded-xl bg-blue-600/80 text-white font-semibold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/50 transition-all"
                                >
                                    {t('welcome.directLogin')}
                                </button>
                            </div>
                        )}

                        <div className="mt-12 flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => router.push("/login?branch=ROOT")}
                                className="px-5 py-2.5 rounded-full border border-yellow-500/20 text-xs text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/40 flex items-center gap-2 font-medium transition-all"
                            >
                                <Globe className="w-3.5 h-3.5" />
                                <span>{t('welcome.hqAdminLogin')}</span>
                            </button>
                        </div>
                    </div>
                )}


                {/* ---------- STEP 3: CONNECTING ANIMATION ---------- */}
                {step === "connecting" && selectedBranch && (
                    <div className="flex flex-col items-center justify-center py-10 w-full animate-in fade-in duration-500">
                        <div className="relative mb-10 w-28 h-28 flex items-center justify-center">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                            {/* Outer spinning ring */}
                            <svg className="absolute inset-0 w-full h-full animate-spin text-blue-500/30" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="48" fill="none" strokeWidth="2" stroke="currentColor" strokeDasharray="150" strokeLinecap="round" />
                            </svg>
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-4xl shadow-2xl relative z-10 filter drop-shadow">
                                {selectedBranch.flag}
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-3 text-center">
                            {t('welcome.connectingToServer').replace('{branch}', locale === 'ar' ? selectedBranch.name : selectedBranch.country)}
                        </h2>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            <span>{t('welcome.secureChannel')}</span>
                        </div>
                    </div>
                )}

            </div>
            
            <style jsx>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
