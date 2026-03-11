/**
 * v9: Redesigned Voucher generation — Clean, professional A4 layout with branding
 * Generates HTML that can be printed via browser print (Ctrl+P → Save as PDF)
 */

import { formatNumber, formatDateAr } from './format-utils';
import { getBrandingCSS, getBrandingHeaderHTML, type BrandingInfo } from './document-branding';

export type VoucherType = "ISSUE" | "RECEIPT";

export interface VoucherData {
    voucherNumber: number;
    type: VoucherType;
    date: Date;
    employeeName: string;
    projectName: string;
    amount: number;
    method: string;
    note?: string;
    isExternal?: boolean;
    externalName?: string;
    externalPhone?: string;
    externalPurpose?: string;
    isCompanyExpense?: boolean;
    issuerName: string;
    recipientSignature?: string;
    // v9: Branding
    branchName?: string | null;
    branchFlag?: string | null;
    logoBase64?: string;
    
    // QR Code Verification
    qrCodeBase64?: string;
}

export function generateVoucherHTML(data: VoucherData): string {
    const typeLabel = data.type === "ISSUE" ? "سند صرف" : "سند قبض";
    const typeColor = data.type === "ISSUE" ? "#1e3a5f" : "#0d6b3d";
    const typeBg = data.type === "ISSUE" ? "#e8f0fe" : "#e6f4ea";
    const dateStr = formatDateAr(data.date, { year: "numeric", month: "long", day: "numeric" });
    const recipientName = data.isExternal ? data.externalName : data.employeeName;
    const methodLabel = data.method === "CASH" ? "نقداً" : "تحويل بنكي";
    const vNum = String(data.voucherNumber || 1).padStart(5, '0');
    const scopeLabel = data.isCompanyExpense ? "مصاريف الشركة" : data.projectName;

    const branding: BrandingInfo = { branchName: data.branchName, branchFlag: data.branchFlag };
    const brandingHeaderHTML = getBrandingHeaderHTML(branding, { logoBase64: data.logoBase64, accentColor: typeColor });
    const brandingCSS = getBrandingCSS();

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${typeLabel} رقم ${vNum}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 20mm; size: A4; }
        @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Segoe UI', Tahoma, 'Arial', sans-serif; direction: rtl; color: #1a1a2e; font-size: 15px; background: #f5f5f5; }
        .page { max-width: 800px; margin: 20px auto; background: white; padding: 48px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .print-bar { max-width: 800px; margin: 20px auto 0; padding: 12px 20px; display: flex; gap: 12px; justify-content: center; }
        .print-bar button { padding: 10px 28px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .btn-print { background: ${typeColor}; color: white; }
        .btn-print:hover { opacity: 0.9; }
        ${brandingCSS}
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid ${typeColor}; margin-bottom: 28px; }
        .header-right h1 { font-size: 28px; font-weight: 900; color: ${typeColor}; margin-bottom: 6px; }
        .header-right .subtitle { font-size: 13px; color: #6b7280; font-weight: 600; }
        .header-left { text-align: left; background: ${typeBg}; padding: 14px 20px; border-radius: 10px; min-width: 180px; }
        .header-left .field { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .header-left .field strong { color: ${typeColor}; font-size: 14px; }
        
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 28px; }
        .detail-item { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 14px 18px; }
        .detail-item .label { font-size: 11px; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .detail-item .value { font-size: 16px; font-weight: 700; color: #111827; }
        
        .amount-section { background: linear-gradient(135deg, ${typeBg}, white); border: 2px solid ${typeColor}20; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 28px; }
        .amount-section .label { font-size: 13px; color: #6b7280; font-weight: 700; margin-bottom: 8px; }
        .amount-section .amount { font-size: 36px; font-weight: 900; color: ${typeColor}; letter-spacing: 1px; }
        .amount-section .currency { font-size: 16px; color: #6b7280; font-weight: 700; margin-right: 6px; }
        
        .note-box { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 10px; padding: 14px 18px; margin-bottom: 28px; font-size: 14px; color: #92400e; line-height: 1.6; }
        .note-box .note-title { font-weight: 800; font-size: 12px; color: #b45309; margin-bottom: 4px; }
        
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 2px dashed #e5e7eb; gap: 40px; }
        .sig-block { text-align: center; flex: 1; }
        .sig-label { font-size: 12px; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
        .sig-area { height: 70px; border-bottom: 2px solid #333; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; margin-bottom: 8px; }
        .sig-area img { max-height: 60px; max-width: 180px; }
        .sig-name { font-size: 14px; font-weight: 800; color: #374151; }
        
        .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; }
        .badge-external { background: #fef3c7; color: #92400e; }
        .badge-company { background: #dbeafe; color: #1e40af; }
        
        .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="print-bar no-print">
        <button class="btn-print" onclick="window.print()">🖨️ طباعة السند</button>
    </div>
    <div class="page">
        ${brandingHeaderHTML}
        <div class="header">
            <div class="header-right">
                <h1>${typeLabel} ${data.isExternal ? '<span class="badge badge-external">خارجي</span>' : ''}${data.isCompanyExpense ? '<span class="badge badge-company">مصاريف شركة</span>' : ''}</h1>
            </div>
            <div class="header-left">
                <div class="field">رقم السند: <strong>${vNum}</strong></div>
                <div class="field">التاريخ: <strong>${dateStr}</strong></div>
                ${data.qrCodeBase64 
                    ? `<div style="margin-top:10px; text-align:center;">
                         <img src="${data.qrCodeBase64}" width="64" height="64" style="border-radius:4px" alt="QR Code" />
                         <div style="font-size:9px;color:#6b7280;margin-top:2px">امسح للتحقق</div>
                       </div>` 
                    : ''}
            </div>
        </div>
        
        <div class="details-grid">
            <div class="detail-item">
                <div class="label">${data.type === "ISSUE" ? "المستلم" : "المُرجِع"}</div>
                <div class="value">${recipientName}</div>
            </div>
            <div class="detail-item">
                <div class="label">${data.isCompanyExpense ? "النطاق" : "المشروع"}</div>
                <div class="value">${scopeLabel}</div>
            </div>
            <div class="detail-item">
                <div class="label">طريقة الدفع</div>
                <div class="value">${methodLabel}</div>
            </div>
            ${data.isExternal && data.externalPhone ? `
            <div class="detail-item">
                <div class="label">هاتف الطرف الخارجي</div>
                <div class="value">${data.externalPhone}</div>
            </div>` : ''}
            ${data.isExternal && data.externalPurpose ? `
            <div class="detail-item">
                <div class="label">الغرض</div>
                <div class="value">${data.externalPurpose}</div>
            </div>` : ''}
        </div>
        
        ${data.note ? `
        <div class="note-box">
            <div class="note-title">📝 ملاحظات</div>
            ${data.note}
        </div>` : ''}
        
        <div class="amount-section">
            <div class="label">${data.type === "ISSUE" ? "المبلغ المصروف" : "المبلغ المُرجَع"}</div>
            <div class="amount">${formatNumber(data.amount)} <span class="currency">ر.ق</span></div>
        </div>
        
        <div class="signatures">
            <div class="sig-block">
                <div class="sig-label">${data.type === "ISSUE" ? "توقيع المُصرِف (المدير)" : "توقيع المُستلِم"}</div>
                <div class="sig-area"><span>${data.issuerName}</span></div>
                <div class="sig-name">${data.issuerName}</div>
            </div>
            <div class="sig-block">
                <div class="sig-label">${data.type === "ISSUE" ? "توقيع المستلم" : "توقيع المحاسب"}</div>
                <div class="sig-area">
                    ${data.recipientSignature ? `<img src="${data.recipientSignature}" alt="signature" />` : ''}
                </div>
                <div class="sig-name">${recipientName}</div>
            </div>
        </div>
        
        <div class="footer">
            تم إصدار هذا السند إلكترونياً بواسطة نظام سبيستون بوكيت${data.branchName ? ` — فرع ${data.branchName}` : ''} — ${formatDateAr(new Date())}
        </div>
    </div>
</body>
</html>`;
}

export function printVoucher(data: VoucherData) {
    const html = generateVoucherHTML(data);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    }
}
