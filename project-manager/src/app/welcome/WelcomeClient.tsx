"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    const [step, setStep] = useState<"welcome" | "branches">("welcome");
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

    const handleSelectBranch = (branchCode: string) => {
        setSelectedBranch(branchCode);
        setTimeout(() => {
            router.push(`/login?branch=${branchCode}`);
        }, 400);
    };

    return (
        <div className="welcome-container" dir="rtl">
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
                        نظام إدارة المصاريف والعهد المالية
                    </p>

                    <p className="welcome-desc">
                        حل متكامل لإدارة المشاريع والعهد والفواتير والمشتريات عبر جميع فروع الشركة
                    </p>

                    {/* Features */}
                    <div className="welcome-features">
                        <div className="welcome-feature">
                            <span className="welcome-feature-icon">📊</span>
                            <span>إدارة المشاريع</span>
                        </div>
                        <div className="welcome-feature">
                            <span className="welcome-feature-icon">💳</span>
                            <span>العهد والفواتير</span>
                        </div>
                        <div className="welcome-feature">
                            <span className="welcome-feature-icon">🌍</span>
                            <span>فروع متعددة</span>
                        </div>
                    </div>

                    <button className="welcome-cta" onClick={() => setStep("branches")}>
                        ابدأ الآن
                        <span className="welcome-cta-arrow">←</span>
                    </button>

                    {/* Powered by badge */}
                    <div className="welcome-powered">
                        Spacetoon Media Group
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
                        → العودة
                    </button>

                    <h2 className="welcome-branch-title">اختر الفرع</h2>
                    <p className="welcome-branch-subtitle">
                        حدد فرع الشركة للمتابعة إلى تسجيل الدخول
                    </p>

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

                    {/* ROOT login link */}
                    <div className="welcome-root-link">
                        <button
                            className="welcome-root-btn"
                            onClick={() => router.push("/login?branch=ROOT")}
                        >
                            🔑 دخول IT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
