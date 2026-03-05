"use client";
import Link from "next/link";
import { FileQuestion, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4" dir="rtl">
            <div className="text-center max-w-md w-full">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
                        <FileQuestion className="w-12 h-12 text-white/70" />
                    </div>
                </div>

                {/* 404 */}
                <h1 className="text-8xl font-black text-white/10 leading-none select-none mb-2">404</h1>

                {/* Message */}
                <h2 className="text-2xl font-bold text-white mb-3">الصفحة غير موجودة</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-white/90 transition-all shadow-lg"
                    >
                        <Home className="w-4 h-4" />
                        العودة للرئيسية
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/20"
                    >
                        <ArrowRight className="w-4 h-4" />
                        الصفحة السابقة
                    </button>
                </div>
            </div>
        </div>
    );
}
