"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

// Dashboard-level error boundary (renders within the app layout)
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Dashboard Error]", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
            <div className="text-center max-w-md w-full">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-lg">
                        <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-2">حدث خطأ</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    حدث خطأ أثناء تحميل هذه الصفحة. يمكنك المحاولة مجدداً أو العودة للرئيسية.
                </p>
                {error?.digest && (
                    <p className="text-gray-400 text-xs font-mono mb-6 bg-gray-50 rounded-lg px-3 py-1.5 inline-block border border-gray-100">
                        معرف الخطأ: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-all shadow"
                    >
                        <RefreshCw className="w-4 h-4" />
                        المحاولة مجدداً
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                        <Home className="w-4 h-4" />
                        الرئيسية
                    </Link>
                </div>
            </div>
        </div>
    );
}
