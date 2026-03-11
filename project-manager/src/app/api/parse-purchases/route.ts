import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { parseExcelToRawText, analyzeWithGemini } from '@/lib/parse-excel';

export const maxDuration = 60; // Allow maximum 60 seconds execution time

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });
        }

        // Only ROOT, ADMIN, GM, and coordinators can use bulk import
        if (!['ROOT', 'ADMIN', 'GENERAL_MANAGER'].includes(session.role) && session.role !== 'USER') {
            return NextResponse.json({ error: 'صلاحية مرفوضة' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: 'يرجى رفع ملف Excel' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
        ];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(ext || '')) {
            return NextResponse.json({ error: 'نوع الملف غير مدعوم. يرجى رفع ملف Excel (.xlsx, .xls) أو CSV' }, { status: 400 });
        }

        // Size limit: 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت)' }, { status: 400 });
        }

        // Read file and convert to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Step 1: Parse Excel to raw text
        const rawText = parseExcelToRawText(buffer);
        if (!rawText.trim()) {
            return NextResponse.json({ error: 'الملف فارغ أو لا يحتوي على بيانات قابلة للقراءة' }, { status: 400 });
        }

        // Step 2: Analyze with Gemini AI
        const items = await analyzeWithGemini(rawText);

        if (items.length === 0) {
            return NextResponse.json({ error: 'لم يتم العثور على عناصر مشتريات في الملف' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            items,
            count: items.length,
            rawPreview: rawText.substring(0, 500), // First 500 chars for debug
        });

    } catch (error: any) {
        console.error('Parse Purchases API Error:', error);
        return NextResponse.json(
            { error: error.message || 'حدث خطأ أثناء تحليل الملف' },
            { status: 500 }
        );
    }
}
