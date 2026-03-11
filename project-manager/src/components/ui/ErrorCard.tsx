"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
    title?: string;
    message?: string;
    onRetry?: () => void;
}

/**
 * ErrorCard — shown when a list page fails to load data.
 * Shows an icon, message, and a retry button.
 */
export function ErrorCard({
    title,
    message,
    onRetry,
}: Props) {
    const { locale } = useLanguage();
    const displayTitle = title || (locale === 'ar' ? "حدث خطأ" : "An error occurred");
    const displayMessage = message || (locale === 'ar' ? "لم نتمكن من تحميل البيانات. تحقق من اتصالك بالإنترنت وحاول مجدداً." : "We couldn't load the data. Check your connection and try again.");
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
                <h3 className="text-lg font-black text-gray-900 mb-1">{displayTitle}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">{displayMessage}</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#102550] text-white font-bold text-sm shadow-md shadow-blue-200 active:scale-95 transition-transform min-h-[48px]"
                >
                    <RefreshCw className="w-4 h-4" />
                    {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
            )}
        </div>
    );
}
