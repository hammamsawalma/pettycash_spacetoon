import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 });
        }

        if (session.role !== 'GLOBAL_ACCOUNTANT' && session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'هذه الميزة للمحاسب العام فقط' }, { status: 403 });
        }

        const { imagePath } = await req.json();

        if (!imagePath) {
            return NextResponse.json({ error: 'مسار الصورة مطلوب' }, { status: 400 });
        }

        // Read the image file from the public directory
        const fullPath = path.join(process.cwd(), 'public', imagePath);
        if (!fs.existsSync(fullPath)) {
            return NextResponse.json({ error: 'الصورة غير موجودة' }, { status: 404 });
        }

        const imageBuffer = fs.readFileSync(fullPath);
        const base64Image = imageBuffer.toString('base64');

        // Determine MIME type
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                : ext === '.pdf' ? 'application/pdf'
                    : 'image/jpeg';

        // Call OpenAI GPT-4o for invoice analysis
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'مفتاح OpenAI غير مُعد — تواصل مع مدير النظام' }, { status: 500 });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `أنت محلل فواتير ذكي. حلل صورة الفاتورة واستخرج المعلومات التالية فقط:
1. رقم الفاتورة (invoice number)
2. تاريخ الفاتورة (invoice date — بتنسيق YYYY-MM-DD)
3. المبلغ الإجمالي (total amount — رقم فقط بدون عملة)

إذا لم تتمكن من استخراج أي حقل، اتركه فارغاً. أجب بتنسيق JSON فقط:
{"suggestedNumber": "...", "suggestedDate": "YYYY-MM-DD", "suggestedAmount": "..."}`,
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'حلل هذه الفاتورة واستخرج الرقم والتاريخ والمبلغ.' },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                    detail: 'high',
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 300,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('OpenAI API Error:', errText);
            return NextResponse.json({ error: 'فشل الاتصال بخدمة الذكاء الاصطناعي' }, { status: 502 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        try {
            // Extract JSON from potential markdown code block
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return NextResponse.json({
                    suggestedNumber: parsed.suggestedNumber || null,
                    suggestedDate: parsed.suggestedDate || null,
                    suggestedAmount: parsed.suggestedAmount || null,
                });
            }
        } catch {
            console.error('Failed to parse AI response:', content);
        }

        return NextResponse.json({ error: 'لم يتمكن الذكاء الاصطناعي من قراءة الفاتورة — حاول مرة أخرى' }, { status: 422 });

    } catch (error) {
        console.error('AI Invoice Analysis Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء التحليل' }, { status: 500 });
    }
}
