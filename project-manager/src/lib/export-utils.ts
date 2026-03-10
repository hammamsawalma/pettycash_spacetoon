"use client";

/**
 * export-utils.ts — Shared PDF/Excel generation helpers for the accountant export system.
 * Uses xlsx (SheetJS) for Excel and HTML-to-Print for PDF (same approach as voucher.ts).
 */

import * as XLSX from "xlsx";
import { formatDateAr } from './format-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportColumn {
    key: string;
    label: string;
    /** Optional formatter — applied before writing to Excel/PDF */
    format?: (value: unknown, row: Record<string, unknown>) => string;
}

export interface ReportSummaryItem {
    label: string;
    value: string;
}

// ─── Date/Currency Helpers ────────────────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
}

export function formatDateArabic(date: Date | string | null | undefined): string {
    return formatDateAr(date, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return "0";
    return amount.toLocaleString("en-US");
}

// ─── Excel Generation ─────────────────────────────────────────────────────────

/**
 * Build an Excel workbook from one or more sheets.
 */
export function buildExcelWorkbook(
    sheets: {
        name: string;
        columns: ExportColumn[];
        data: Record<string, unknown>[];
    }[]
): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();

    for (const sheet of sheets) {
        // Build header row
        const headers = sheet.columns.map((c) => c.label);
        const rows = sheet.data.map((row) =>
            sheet.columns.map((col) => {
                const raw = row[col.key];
                if (col.format) return col.format(raw, row);
                if (raw === null || raw === undefined) return "";
                return String(raw);
            })
        );

        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Auto-width columns
        const colWidths = sheet.columns.map((col, idx) => {
            let maxLen = col.label.length;
            for (const r of rows) {
                const cellLen = String(r[idx] || "").length;
                if (cellLen > maxLen) maxLen = cellLen;
            }
            return { wch: Math.min(maxLen + 4, 50) };
        });
        ws["!cols"] = colWidths;

        // RTL sheet
        if (!ws["!sheetViews"]) ws["!sheetViews"] = [{}];

        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }

    return wb;
}

/**
 * Generate and download an Excel file from the given sheets.
 */
export function downloadExcel(
    sheets: {
        name: string;
        columns: ExportColumn[];
        data: Record<string, unknown>[];
    }[],
    filename: string
) {
    const wb = buildExcelWorkbook(sheets);
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF / Print Generation ───────────────────────────────────────────────────

/**
 * Generate a printable HTML report suitable for window.print() → Save as PDF.
 */
export function generatePrintableReport(options: {
    title: string;
    subtitle?: string;
    period?: string;
    columns: ExportColumn[];
    data: Record<string, unknown>[];
    summary?: ReportSummaryItem[];
    accentColor?: string;
    branchName?: string | null;
    branchFlag?: string | null;
}): string {
    const {
        title,
        subtitle,
        period,
        columns,
        data,
        summary,
        accentColor = "#102550",
        branchName,
        branchFlag,
    } = options;

    const dateStr = formatDateAr(new Date(), {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const summaryHTML = summary
        ? `<div class="summary-grid">
        ${summary.map((s) => `<div class="summary-item"><div class="s-label">${s.label}</div><div class="s-value">${s.value}</div></div>`).join("")}
    </div>`
        : "";

    const theadHTML = columns
        .map((c) => `<th>${c.label}</th>`)
        .join("");

    const tbodyHTML = data
        .map(
            (row, idx) =>
                `<tr class="${idx % 2 === 0 ? "even" : "odd"}">${columns
                    .map((col) => {
                        const raw = row[col.key];
                        const val = col.format
                            ? col.format(raw, row)
                            : raw !== null && raw !== undefined
                                ? String(raw)
                                : "";
                        return `<td>${val}</td>`;
                    })
                    .join("")}</tr>`
        )
        .join("");

    // Branding header
    const branchDisplay = branchName
        ? `<div style="font-size:12px;font-weight:700;color:#374151;display:flex;align-items:center;gap:6px;">
               ${branchFlag ? `<span style="font-size:16px">${branchFlag}</span>` : ''}
               فرع ${branchName}
           </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 15mm; size: A4 landscape; }
        @media print {
            .no-print { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body {
            font-family: 'Segoe UI', Tahoma, 'Arial', sans-serif;
            direction: rtl;
            color: #1a1a2e;
            font-size: 12px;
            background: #f5f5f5;
        }
        .page {
            max-width: 1200px;
            margin: 16px auto;
            background: white;
            padding: 36px;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .print-bar {
            max-width: 1200px;
            margin: 16px auto 0;
            padding: 10px 20px;
            display: flex;
            gap: 12px;
            justify-content: center;
        }
        .print-bar button {
            padding: 10px 28px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            background: ${accentColor};
            color: white;
        }
        .print-bar button:hover { opacity: 0.9; }
        .brand-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
        }
        .brand-logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
            border-radius: 6px;
        }
        .brand-info {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        .brand-company {
            font-size: 15px;
            font-weight: 900;
            color: #102550;
        }
        .brand-company-en {
            font-size: 9px;
            font-weight: 600;
            color: #6b7280;
            letter-spacing: 1px;
        }
        .brand-divider {
            width: 100%;
            height: 3px;
            border: none;
            border-radius: 2px;
            margin: 6px 0 16px;
            background: ${accentColor};
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 16px;
            border-bottom: 3px solid ${accentColor};
            margin-bottom: 20px;
        }
        .header-right h1 {
            font-size: 22px;
            font-weight: 900;
            color: ${accentColor};
            margin-bottom: 4px;
        }
        .header-right .subtitle {
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
        }
        .header-left {
            text-align: left;
            background: ${accentColor}10;
            padding: 12px 18px;
            border-radius: 10px;
            min-width: 160px;
        }
        .header-left .field {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 3px;
        }
        .header-left .field strong {
            color: ${accentColor};
            font-size: 12px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }
        .summary-item {
            background: #fafafa;
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 12px 16px;
        }
        .s-label {
            font-size: 10px;
            color: #9ca3af;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .s-value {
            font-size: 16px;
            font-weight: 800;
            color: #111827;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        thead th {
            background: ${accentColor};
            color: white;
            padding: 10px 12px;
            text-align: right;
            font-weight: 700;
            font-size: 11px;
            white-space: nowrap;
        }
        tbody td {
            padding: 8px 12px;
            border-bottom: 1px solid #f0f0f0;
            white-space: nowrap;
        }
        tbody tr.even { background: #fafafa; }
        tbody tr.odd { background: white; }
        tbody tr:hover { background: #f0f7ff; }
        .footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #eee;
            font-size: 10px;
            color: #9ca3af;
        }
        .row-count {
            margin-top: 16px;
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="print-bar no-print">
        <button onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
    </div>
    <div class="page">
        <div class="brand-header">
            <img class="brand-logo" src="/spacetoon-logo.png" alt="Logo" />
            <div class="brand-info">
                <div class="brand-company">سبيستون بوكيت</div>
                <div class="brand-company-en">SPACETOON POCKET</div>
                ${branchDisplay}
            </div>
        </div>
        <hr class="brand-divider" />

        <div class="header">
            <div class="header-right">
                <h1>${title}</h1>
                ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
            </div>
            <div class="header-left">
                <div class="field">تاريخ التصدير: <strong>${dateStr}</strong></div>
                ${period ? `<div class="field">الفترة: <strong>${period}</strong></div>` : ""}
                <div class="field">عدد السجلات: <strong>${data.length}</strong></div>
            </div>
        </div>

        ${summaryHTML}

        <table>
            <thead><tr>${theadHTML}</tr></thead>
            <tbody>${tbodyHTML}</tbody>
        </table>

        <div class="row-count">إجمالي السجلات: ${data.length}</div>

        <div class="footer">
            تم إصدار هذا التقرير إلكترونياً بواسطة نظام سبيستون بوكيت${branchName ? ` — فرع ${branchName}` : ''} — ${dateStr}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Open a new window with the given HTML and trigger print.
 */
export function openPrintWindow(html: string) {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 600);
    }
}

// ─── Status/Type Label Helpers ────────────────────────────────────────────────

export const invoiceStatusLabel: Record<string, string> = {
    PENDING: "معلقة",
    APPROVED: "معتمدة",
    REJECTED: "مرفوضة",
};

export const invoiceTypeLabel: Record<string, string> = {
    GENERAL: "عامة",
    RECEIPT: "إيصال",
    TAX: "ضريبية",
};

export const paymentSourceLabel: Record<string, string> = {
    CUSTODY: "من العهدة",
    PERSONAL: "شخصي",
    SPLIT: "مقسّم",
    COMPANY_DIRECT: "مصاريف شركة",
};

export const custodyStatusLabel: Record<string, string> = {
    PENDING: "بانتظار التأكيد",
    CONFIRMED: "مؤكّدة",
    REJECTED: "مرفوضة",
};

export const purchaseStatusLabel: Record<string, string> = {
    REQUESTED: "مطلوب",
    IN_PROGRESS: "قيد التنفيذ",
    PURCHASED: "تم الشراء",
    CANCELLED: "ملغي",
};

export const purchasePriorityLabel: Record<string, string> = {
    NORMAL: "عادي",
    HIGH: "مرتفع",
    URGENT: "عاجل",
};

export const walletEntryTypeLabel: Record<string, string> = {
    DEPOSIT: "إيداع",
    WITHDRAW: "سحب",
    ALLOCATE_TO_PROJECT: "تخصيص لمشروع",
    RETURN_FROM_PROJECT: "استرجاع من مشروع",
    SETTLE_DEBT: "تسوية دين",
    RETURN: "استرجاع",
};

export const financeRequestTypeLabel: Record<string, string> = {
    SETTLE_DEBT: "تسوية دين",
    ALLOCATE_BUDGET: "تخصيص ميزانية",
    RETURN_CUSTODY: "استرجاع عهدة",
    OTHER: "أخرى",
};

export const financeRequestStatusLabel: Record<string, string> = {
    PENDING: "معلقة",
    APPROVED: "مُوافق عليها",
    REJECTED: "مرفوضة",
};
