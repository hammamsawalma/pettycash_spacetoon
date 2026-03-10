"use client";

export default function LoginError({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div dir="rtl" style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(160deg, #0a1628 0%, #102550 40%, #0d1f3c 100%)",
            padding: "1rem",
        }}>
            <div style={{ textAlign: "center", maxWidth: "400px" }}>
                <h1 style={{ color: "#e2e8f0", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
                    خطأ في تحميل صفحة الدخول
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    يرجى المحاولة مرة أخرى
                </p>
                <button
                    onClick={reset}
                    style={{
                        background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                        color: "white",
                        border: "none",
                        borderRadius: "14px",
                        padding: "0.9rem 2.5rem",
                        fontSize: "1rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                    }}
                >
                    إعادة المحاولة 🔄
                </button>
            </div>
        </div>
    );
}
