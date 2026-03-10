"use client";

import { useEffect } from "react";

export default function WelcomeError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Welcome Error]", error);
    }, [error]);

    return (
        <div className="welcome-container" dir="rtl">
            <div className="welcome-bg-orb welcome-bg-orb-1" />
            <div className="welcome-bg-orb welcome-bg-orb-2" />

            <div className="welcome-step welcome-step-active" style={{ textAlign: "center" }}>
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

                <p className="welcome-subtitle" style={{ marginBottom: "1.5rem" }}>
                    عذراً، حدث خطأ في تحميل الصفحة
                </p>

                <p className="welcome-desc" style={{ marginBottom: "2rem" }}>
                    يرجى المحاولة مرة أخرى أو الانتقال لتسجيل الدخول مباشرة
                </p>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={reset}
                        className="welcome-cta"
                    >
                        إعادة المحاولة
                        <span className="welcome-cta-arrow">🔄</span>
                    </button>
                    <a
                        href="/login"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            background: "rgba(255,255,255,0.08)",
                            color: "#93c5fd",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "14px",
                            padding: "0.9rem 2rem",
                            fontSize: "1rem",
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "all 0.2s",
                            fontFamily: "inherit",
                        }}
                    >
                        تسجيل الدخول مباشرة →
                    </a>
                </div>
            </div>
        </div>
    );
}
