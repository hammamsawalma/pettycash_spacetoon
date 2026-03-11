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

        // Read file directly as ArrayBuffer to bypass Next.js 16 FormData stream bugs
        let buffer: Buffer;
        let fileName = 'upload.xlsx';

        try {
            // Read headers to get filename if provided
            const contentDisposition = req.headers.get('content-disposition');
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) fileName = match[1];
            }

            // NextJS 16 Edge has a bug with req.formData() streams, so we read the ArrayBuffer directly
            const bytes = await req.arrayBuffer();
            if (!bytes || bytes.byteLength === 0) {
                return NextResponse.json({ error: 'يرجى رفع ملف Excel (الملف فارغ)' }, { status: 400 });
            }
            buffer = Buffer.from(bytes);
        } catch (e: any) {
            console.error('[POST /api/parse-purchases] Failed to read request body:', e);
            return NextResponse.json({ error: 'فشل في قراءة الملف المرفوع' }, { status: 400 });
        }

        // Validate file type based on extension
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
            return NextResponse.json({ error: 'نوع الملف غير مدعوم. يرجى رفع ملف Excel (.xlsx, .xls) أو CSV' }, { status: 400 });
        }

        // Size limit: 10MB
        if (buffer.length > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت)' }, { status: 400 });
        }

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
