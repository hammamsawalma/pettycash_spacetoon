/**
 * v7: Invoice Voucher HTML generator
 * Generates a clean, professional invoice detail page for printing
 */

import { formatNumber, formatDateAr } from './format-utils';

export interface InvoiceVoucherData {
    invoiceNumber: string;
    date: Date;
    employeeName: string;
    projectName: string;
    amount: number;
    status: string;
    categoryName?: string;
    description?: string;
    paymentSource?: string;
    seller?: string;
    attachments?: number;
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "قيد المراجعة", color: "#92400e", bg: "#fef3c7" },
    APPROVED: { label: "معتمدة", color: "#065f46", bg: "#d1fae5" },
    REJECTED: { label: "مرفوضة", color: "#991b1b", bg: "#fee2e2" },
};

export function generateInvoiceVoucherHTML(data: InvoiceVoucherData): string {
    const dateStr = formatDateAr(data.date, { year: "numeric", month: "long", day: "numeric" });
    const st = statusLabels[data.status] || statusLabels.PENDING;
    const sourceLabel = data.paymentSource === "CUSTODY" ? "من العهدة" : data.paymentSource === "PROJECT" ? "من ميزانية المشروع" : "غير محدد";

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>فاتورة ${data.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 20mm; size: A4; }
        @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Tahoma, 'Arial', sans-serif; direction: rtl; color: #1a1a2e; font-size: 15px; background: #f5f5f5; }
        .page { max-width: 800px; margin: 20px auto; background: white; padding: 48px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .print-bar { max-width: 800px; margin: 20px auto 0; padding: 12px 20px; display: flex; gap: 12px; justify-content: center; }
        .print-bar button { padding: 10px 28px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .btn-print { background: #1e3a5f; color: white; }
        .btn-print:hover { opacity: 0.9; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #1e3a5f; margin-bottom: 28px; }
        .header-right h1 { font-size: 26px; font-weight: 900; color: #1e3a5f; margin-bottom: 6px; }
        .header-right .subtitle { font-size: 13px; color: #6b7280; font-weight: 600; }
        .header-left { text-align: left; background: #e8f0fe; padding: 14px 20px; border-radius: 10px; min-width: 180px; }
        .header-left .field { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .header-left .field strong { color: #1e3a5f; font-size: 14px; }
        
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 800; background: ${st.bg}; color: ${st.color}; }
        
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 28px; }
        .detail-item { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 14px 18px; }
        .detail-item .label { font-size: 11px; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .detail-item .value { font-size: 16px; font-weight: 700; color: #111827; }
        .detail-full { grid-column: 1 / -1; }
        
        .amount-section { background: linear-gradient(135deg, #e8f0fe, white); border: 2px solid #1e3a5f20; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 28px; }
        .amount-section .label { font-size: 13px; color: #6b7280; font-weight: 700; margin-bottom: 8px; }
        .amount-section .amount { font-size: 36px; font-weight: 900; color: #1e3a5f; letter-spacing: 1px; }
        .amount-section .currency { font-size: 16px; color: #6b7280; font-weight: 700; margin-right: 6px; }
        
        .desc-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; line-height: 1.8; font-size: 14px; color: #374151; }
        .desc-box .title { font-weight: 800; font-size: 12px; color: #6b7280; margin-bottom: 8px; }
        
        .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="print-bar no-print">
        <button class="btn-print" onclick="window.print()">🖨️ طباعة الفاتورة</button>
    </div>
    <div class="page">
        <div class="header">
            <div class="header-right">
                <h1>فاتورة مصاريف</h1>
                <div class="subtitle">سبيستون بوكيت — إدارة المشاريع</div>
            </div>
            <div class="header-left">
                <div class="field">رقم الفاتورة: <strong>${data.invoiceNumber}</strong></div>
                <div class="field">التاريخ: <strong>${dateStr}</strong></div>
                <div class="field" style="margin-top:8px"><span class="status-badge">${st.label}</span></div>
            </div>
        </div>
        
        <div class="details-grid">
            <div class="detail-item">
                <div class="label">الموظف</div>
                <div class="value">${data.employeeName}</div>
            </div>
            <div class="detail-item">
                <div class="label">المشروع</div>
                <div class="value">${data.projectName}</div>
            </div>
            ${data.categoryName ? `
            <div class="detail-item">
                <div class="label">التصنيف</div>
                <div class="value">${data.categoryName}</div>
            </div>` : ''}
            <div class="detail-item">
                <div class="label">مصدر الدفع</div>
                <div class="value">${sourceLabel}</div>
            </div>
            ${data.seller ? `
            <div class="detail-item">
                <div class="label">البائع / الجهة</div>
                <div class="value">${data.seller}</div>
            </div>` : ''}
        </div>
        
        <div class="amount-section">
            <div class="label">مبلغ الفاتورة</div>
            <div class="amount">${formatNumber(data.amount)} <span class="currency">ر.ق</span></div>
        </div>
        
        ${data.description ? `
        <div class="desc-box">
            <div class="title">📝 الوصف / البيان</div>
            ${data.description}
        </div>` : ''}
        
        <div class="footer">
            تم إصدار هذه الفاتورة إلكترونياً بواسطة نظام سبيستون بوكيت — ${formatDateAr(new Date())}
        </div>
    </div>
</body>
</html>`;
}
