"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";

interface ExportButtonProps {
    onExportExcel: () => void | Promise<void>;
    onExportPDF: () => void | Promise<void>;
    label?: string;
    disabled?: boolean;
    /** Compact mode for tight layouts */
    compact?: boolean;
}

export function ExportButton({
    onExportExcel,
    onExportPDF,
    label = "تصدير",
    disabled = false,
    compact = false,
}: ExportButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleExcel = async () => {
        setLoading("excel");
        try {
            await onExportExcel();
        } finally {
            setLoading(null);
            setOpen(false);
        }
    };

    const handlePDF = async () => {
        setLoading("pdf");
        try {
            await onExportPDF();
        } finally {
            setLoading(null);
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                id="export-button"
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className={`
                    inline-flex items-center justify-center gap-1.5
                    ${compact ? "h-8 px-3 text-xs" : "h-10 md:h-11 px-4 md:px-5 text-xs md:text-sm"}
                    rounded-xl shadow-sm font-bold
                    bg-[#102550] text-white hover:bg-[#0d1e42]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    border border-[#102550]/20
                `}
            >
                <Download className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                <span>{label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div
                    id="export-dropdown"
                    className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ animationDuration: "150ms" }}
                >
                    <div className="p-1.5">
                        <button
                            id="export-excel-btn"
                            type="button"
                            disabled={loading !== null}
                            onClick={handleExcel}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:opacity-50"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">
                                    {loading === "excel" ? "جارٍ التصدير..." : "تصدير Excel"}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">ملف جدول بيانات .xlsx</div>
                            </div>
                        </button>

                        <div className="h-px bg-gray-100 mx-2 my-1" />

                        <button
                            id="export-pdf-btn"
                            type="button"
                            disabled={loading !== null}
                            onClick={handlePDF}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold">
                                    {loading === "pdf" ? "جارٍ التصدير..." : "تصدير PDF / طباعة"}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">تقرير جاهز للطباعة</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
