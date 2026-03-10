"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

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
    const [step, setStep] = useState<"welcome" | "branches">("welcome");
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

    const handleSelectBranch = (branchCode: string) => {
        setSelectedBranch(branchCode);
        setTimeout(() => {
            router.push(`/login?branch=${branchCode}`);
        }, 400);
    };

    return (
        <div className="welcome-container" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {/* Language toggle */}
            <button
                onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30 hover:bg-white/30 transition-colors"
            >
                {locale === 'ar' ? 'EN' : 'AR'}
            </button>
            {/* Background decorations */}
            <div className="welcome-bg-orb welcome-bg-orb-1" />
            <div className="welcome-bg-orb welcome-bg-orb-2" />
            <div className="welcome-bg-orb welcome-bg-orb-3" />

            {step === "welcome" ? (
                <div className="welcome-step welcome-step-active" key="step-welcome">
                    {/* Spacetoon Logo */}
                    <div className="welcome-logo-wrap">
                        <div className="welcome-logo-img-container">
                            <img
                                src="/spacetoon-logo.png"
                                alt="Spacetoon Logo"
                                className="welcome-logo-img"
                            />
                        </div>
                    </div>

                    <h1 className="welcome-title">
                        <span className="welcome-title-gradient">Spacetoon Pocket</span>
                    </h1>

                    <p className="welcome-subtitle">
                        {t('welcome.subtitle')}
                    </p>

                    <p className="welcome-desc">
                        {t('welcome.description')}
                    </p>

                    {/* Features */}
                    <div className="welcome-features">
                        <div className="welcome-feature">
                            <span className="welcome-feature-icon">📊</span>
                            <span>{t('welcome.featureProjects')}</span>
                        </div>
                        <div className="welcome-feature">
                            <span className="welcome-feature-icon">💳</span>
                            <span>{t('welcome.featureCustody')}</span>
                        </div>
                        <div className="welcome-feature">
                            <span className="welcome-feature-icon">🌍</span>
                            <span>{t('welcome.featureBranches')}</span>
                        </div>
                    </div>

                    <button className="welcome-cta" onClick={() => setStep("branches")}>
                        {t('welcome.startNow')}
                        <span className="welcome-cta-arrow">{locale === 'ar' ? '←' : '→'}</span>
                    </button>

                    {/* Powered by badge */}
                    <div className="welcome-powered">
                        {t('welcome.poweredBy')}
                    </div>
                </div>
            ) : (
                <div className="welcome-step welcome-step-active" key="step-branches">
                    {/* Small logo on branch selection */}
                    <div className="welcome-branch-logo-wrap">
                        <img
                            src="/spacetoon-logo.png"
                            alt="Spacetoon"
                            className="welcome-branch-logo"
                        />
                    </div>

                    <button className="welcome-back" onClick={() => setStep("welcome")}>
                        {locale === 'ar' ? '→ العودة' : '← Back'}
                    </button>

                    <h2 className="welcome-branch-title">{t('welcome.selectBranch')}</h2>
                    <p className="welcome-branch-subtitle">
                        {t('welcome.selectBranchSubtitle')}
                    </p>

                    {branches.length > 0 ? (
                        <div className="welcome-branches-grid">
                            {branches.map((branch, i) => (
                                <button
                                    key={branch.id}
                                    className={`welcome-branch-card ${selectedBranch === branch.code ? "welcome-branch-card-selected" : ""}`}
                                    onClick={() => handleSelectBranch(branch.code)}
                                    style={{ animationDelay: `${i * 0.08}s` }}
                                >
                                    <span className="welcome-branch-flag">{branch.flag}</span>
                                    <span className="welcome-branch-name">{branch.name}</span>
                                    <span className="welcome-branch-currency">{branch.currency}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "2rem 0" }}>
                            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                                {t('welcome.noBranches')}
                            </p>
                            <button
                                className="welcome-cta"
                                onClick={() => router.push("/login")}
                            >
                                {t('welcome.directLogin')}
                                <span className="welcome-cta-arrow">{locale === 'ar' ? '←' : '→'}</span>
                            </button>
                        </div>
                    )}

                    {/* ROOT login link */}
                    <div className="welcome-root-link">
                        <button
                            className="welcome-root-btn"
                            onClick={() => router.push("/login?branch=ROOT")}
                        >
                            {t('welcome.rootLogin')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
