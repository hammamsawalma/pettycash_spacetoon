import * as XLSX from 'xlsx';

/**
 * Convert an Excel buffer to a JSON-like raw text for AI analysis.
 * Handles arbitrary column names/structures.
 */
export function parseExcelToRawText(buffer: Buffer): string {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const results: string[] = [];

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
                defval: '',
                raw: false,
            });

            if (jsonData.length === 0) continue;

            results.push(`=== Sheet: ${sheetName} ===`);
            const headers = Object.keys(jsonData[0]);
            results.push(`Headers: ${headers.join(' | ')}`);

            // Limit to first 200 rows to avoid overloading Gemini
            const maxRows = Math.min(jsonData.length, 200);
            jsonData.slice(0, maxRows).forEach((row, idx) => {
                const values = headers.map(h => String(row[h] ?? '').trim()).filter(Boolean);
                if (values.length > 0) {
                    results.push(`Row ${idx + 1}: ${values.join(' | ')}`);
                }
            });

            if (jsonData.length > maxRows) {
                results.push(`... (${jsonData.length - maxRows} more rows truncated)`);
            }
        }

        return results.join('\n');
    } catch (error) {
        console.error('Excel parsing error:', error);
        throw new Error('فشل في قراءة ملف Excel. يرجى التأكد من صحة الملف.');
    }
}

export interface ParsedPurchaseItem {
    description: string;
    quantity: string;
    notes: string;
}

/**
 * Send raw Excel text to Google Gemini for intelligent parsing.
 * Returns structured purchase items.
 */
export async function analyzeWithGemini(rawText: string): Promise<ParsedPurchaseItem[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `أنت مساعد ذكي متخصص في تحليل بيانات المشتريات. 

سأعطيك محتوى ملف Excel يحتوي على قائمة مشتريات. قد يكون الملف بأي شكل وبأي لغة (عربي/إنجليزي/مختلط).

مهمتك:
1. حدد كل عنصر شراء في الملف
2. لكل عنصر، استخرج:
   - description: وصف المنتج/العنصر (نص مختصر وواضح)
   - quantity: الكمية (رقم أو نص مثل "3 حبات")
   - notes: أي ملاحظات إضافية (لون، حجم، ماركة، الخ)

أجب فقط بـ JSON array بالشكل التالي، بدون أي نص إضافي:
[
  {"description": "...", "quantity": "...", "notes": "..."},
  ...
]

إذا لم تجد كمية، ضع "1".
إذا لم تجد ملاحظات، ضع نصاً فارغاً "".
إذا كان المحتوى لا يبدو قائمة مشتريات، أرجع مصفوفة فارغة [].

محتوى الملف:
${rawText}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    },
                }),
                signal: controller.signal,
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            if (response.status === 429) {
                throw new Error('تم تجاوز حد الطلبات. يرجى المحاولة بعد قليل.');
            }
            throw new Error(`خطأ في الاتصال بالذكاء الاصطناعي (${response.status})`);
        }

        const data = await response.json();

        // Check for safety blocks
        if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error('تم حظر المحتوى من قبل فلتر الأمان');
        }

        // Extract text from Gemini response
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('لم يتم الحصول على رد من الذكاء الاصطناعي');
        }

        // Parse the JSON response
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
            throw new Error('الرد ليس بالتنسيق المتوقع');
        }

        return parsed.map((item: any) => ({
            description: String(item.description || '').trim(),
            quantity: String(item.quantity || '1').trim(),
            notes: String(item.notes || '').trim(),
        })).filter((item: ParsedPurchaseItem) => item.description.length > 0);
    } catch (error: any) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('انتهت مهلة الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
        }
        throw error;
    }
}
