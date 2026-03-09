/**
 * v5: Voucher generation utilities
 * Generates HTML vouchers that can be printed as PDFs via browser print
 */

export type VoucherType = "ISSUE" | "RECEIPT";

export interface VoucherData {
    voucherNumber: number;
    type: VoucherType;
    date: Date;
    // Custody info
    employeeName: string;
    projectName: string;
    amount: number;
    method: string; // CASH | BANK
    note?: string;
    // For external custody
    isExternal?: boolean;
    externalName?: string;
    externalPhone?: string;
    externalPurpose?: string;
    // Signatures
    issuerName: string;
    recipientSignature?: string; // base64 PNG
}

/**
 * Generate printable HTML voucher
 */
export function generateVoucherHTML(data: VoucherData): string {
    const typeLabel = data.type === "ISSUE" ? "سند صرف" : "سند قبض";
    const typeColor = data.type === "ISSUE" ? "#1e40af" : "#059669";
    const dateStr = data.date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const recipientName = data.isExternal ? data.externalName : data.employeeName;
    const methodLabel = data.method === "CASH" ? "نقداً" : "تحويل بنكي";

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${typeLabel} رقم ${data.voucherNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 1.5cm; size: A5 landscape; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #1a1a2e; font-size: 13px; }
        .voucher { border: 2px solid ${typeColor}; border-radius: 12px; padding: 24px 28px; max-width: 650px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 14px; margin-bottom: 16px; }
        .header h1 { font-size: 22px; font-weight: 800; color: ${typeColor}; }
        .header .meta { text-align: left; font-size: 11px; color: #6b7280; }
        .meta strong { color: #1f2937; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 18px; }
        .detail { display: flex; gap: 6px; }
        .detail-label { font-weight: 700; color: #6b7280; min-width: 80px; }
        .detail-value { font-weight: 600; color: #111827; }
        .amount-box { background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 18px; }
        .amount-box .label { font-size: 11px; color: #16a34a; font-weight: 700; margin-bottom: 4px; }
        .amount-box .value { font-size: 26px; font-weight: 900; color: #15803d; }
        .signatures { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 14px; border-top: 2px dashed #d1d5db; }
        .sig-block { text-align: center; width: 45%; }
        .sig-label { font-size: 10px; color: #9ca3af; margin-bottom: 4px; font-weight: 600; }
        .sig-line { border-bottom: 1px solid #333; height: 50px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px; }
        .sig-line img { max-height: 45px; max-width: 150px; }
        .sig-name { font-size: 11px; font-weight: 700; color: #374151; margin-top: 4px; }
        .note { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #92400e; margin-bottom: 14px; }
        .external-badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 20px; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="voucher">
        <div class="header">
            <div>
                <h1>${typeLabel} ${data.isExternal ? '<span class="external-badge">خارجي</span>' : ''}</h1>
            </div>
            <div class="meta">
                <div><strong>رقم:</strong> ${String(data.voucherNumber).padStart(5, '0')}</div>
                <div><strong>التاريخ:</strong> ${dateStr}</div>
            </div>
        </div>
        <div class="details">
            <div class="detail"><span class="detail-label">المستلم:</span><span class="detail-value">${recipientName}</span></div>
            <div class="detail"><span class="detail-label">المشروع:</span><span class="detail-value">${data.projectName}</span></div>
            <div class="detail"><span class="detail-label">طريقة الدفع:</span><span class="detail-value">${methodLabel}</span></div>
            ${data.isExternal && data.externalPhone ? `<div class="detail"><span class="detail-label">الهاتف:</span><span class="detail-value">${data.externalPhone}</span></div>` : ''}
            ${data.isExternal && data.externalPurpose ? `<div class="detail"><span class="detail-label">الغرض:</span><span class="detail-value">${data.externalPurpose}</span></div>` : ''}
        </div>
        ${data.note ? `<div class="note">📝 ${data.note}</div>` : ''}
        <div class="amount-box">
            <div class="label">المبلغ</div>
            <div class="value">${data.amount.toLocaleString('ar-EG')} ر.ق</div>
        </div>
        <div class="signatures">
            <div class="sig-block">
                <div class="sig-label">${data.type === "ISSUE" ? "توقيع المُصرف" : "توقيع المُستلم"}</div>
                <div class="sig-line"><span>${data.issuerName}</span></div>
                <div class="sig-name">${data.issuerName}</div>
            </div>
            <div class="sig-block">
                <div class="sig-label">${data.type === "ISSUE" ? "توقيع المستلم" : "توقيع المحاسب"}</div>
                <div class="sig-line">
                    ${data.recipientSignature ? `<img src="${data.recipientSignature}" alt="signature" />` : ''}
                </div>
                <div class="sig-name">${recipientName}</div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Open voucher in a new window for printing
 */
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
