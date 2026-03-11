"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to your error tracking service here (e.g. Sentry)
        console.error("[Global Error]", error);
    }, [error]);

    return (
        <html dir="rtl">
            <body className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 px-4 font-sans">
                <div className="text-center max-w-md w-full">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-3xl bg-red-500/20 backdrop-blur-sm flex items-center justify-center border border-red-500/40 shadow-2xl">
                            <AlertTriangle className="w-12 h-12 text-red-400" />
                        </div>
                    </div>

                    {/* Message */}
                    <h1 className="text-2xl font-black text-white mb-3">An Unexpected Error Occurred / حدث خطأ غير متوقع</h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-2">
                        A system error has occurred. Please try again or return to the homepage.
                        <br />
                        حدث خطأ في النظام. يرجى المحاولة مجدداً أو العودة للرئيسية.
                    </p>
                    {error?.digest && (
                        <p className="text-slate-600 text-xs font-mono mb-8 bg-white/5 rounded-lg px-3 py-1 inline-block">
                            Error ID / معرف الخطأ: {error.digest}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                        <button
                            onClick={reset}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-white/90 transition-all shadow-lg"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again / المحاولة مجدداً
                        </button>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/20"
                        >
                            <Home className="w-4 h-4" />
                            Home / العودة للرئيسية
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    );
}
