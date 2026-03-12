"use server";

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export interface SearchResult {
    id: string;
    title: string;
    description?: string;
    type: 'project' | 'invoice' | 'purchase' | 'user';
    url: string;
}


// Helper to generate common Arabic spelling variations for Prisma
function getArabicVariations(text: string): string[] {
    const variations = new Set<string>();
    variations.add(text);

    // Normalize Alef and Teh Marbuta
    const normalizeAlef = text.replace(/[أإآ]/g, 'ا');
    variations.add(normalizeAlef);

    const normalizeTeh = text.replace(/ة/g, 'ه');
    variations.add(normalizeTeh);

    const normalizeBoth = normalizeAlef.replace(/ة/g, 'ه');
    variations.add(normalizeBoth);

    // Reverse common mistakes
    if (text.includes('ا')) {
        variations.add(text.replace(/ا/g, 'أ'));
        variations.add(text.replace(/ا/g, 'إ'));
    }
    if (text.includes('ه')) {
        variations.add(text.replace(/ه/g, 'ة'));
    }

    return Array.from(variations).filter(v => v.trim() !== '');
}

export async function globalSearch(query: string): Promise<{ error?: string; data?: SearchResult[] }> {
    try {
        if (!query || query.trim().length < 2) return { data: [] };

        const cookieStore = await cookies();
        const token = cookieStore.get('pocket_session')?.value;

        if (!token) return { error: "غير مصرح لك بالبحث. يرجى تسجيل الدخول." };

        const verifiedToken = await verifyToken(token);
        if (!verifiedToken) return { error: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً." };

        const userRole = verifiedToken.role as string;
        const userId = verifiedToken.id as string;
        const canViewFinances = ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'].includes(userRole);
        const isRestrictedProjectView = userRole === 'USER';

        const terms = getArabicVariations(query.trim());

        const createSearchConditions = (fields: string[]) => {
            return fields.flatMap(field =>
                terms.map(term => ({ [field]: { contains: term } }))
            );
        };

        const [projects, invoices, purchases, users] = await Promise.all([
            // Search Projects
            prisma.project.findMany({
                where: {
                    isDeleted: false,
                    ...(isRestrictedProjectView ? {
                        OR: [
                            { managerId: userId },
                            { members: { some: { userId: userId } } }
                        ]
                    } : {}),
                    AND: [
                        { OR: createSearchConditions(['name', 'description']) }
                    ]
                },
                take: 5,
                select: { id: true, name: true, description: true }
            }),

            // Search Invoices
            canViewFinances ? prisma.invoice.findMany({
                where: { OR: createSearchConditions(['reference', 'notes']) },
                take: 5,
                select: { id: true, reference: true, notes: true }
            }) : Promise.resolve([]),

            // Search Purchases
            canViewFinances ? prisma.purchase.findMany({
                where: { OR: createSearchConditions(['orderNumber', 'description']) },
                take: 5,
                select: { id: true, orderNumber: true, description: true }
            }) : Promise.resolve([]),

            // Search Users
            prisma.user.findMany({
                where: { OR: createSearchConditions(['name', 'email', 'phone']) },
                take: 5,
                select: { id: true, name: true, role: true }
            })
        ]);

        const results: SearchResult[] = [
            ...projects.map((p) => ({
                id: p.id,
                title: p.name,
                description: p.description || 'مشروع',
                type: 'project' as const,
                url: `/projects/${p.id}`
            })),
            ...invoices.map((i) => ({
                id: i.id,
                title: `فاتورة #${i.reference}`,
                description: i.notes || 'سجل مالي',
                type: 'invoice' as const,
                url: `/finances?tab=invoices&id=${i.id}`
            })),
            ...purchases.map((p) => ({
                id: p.id,
                title: `طلب شراء #${p.orderNumber}`,
                description: p.description || 'مشتريات',
                type: 'purchase' as const,
                url: `/finances?tab=purchases&id=${p.id}`
            })),
            ...users.map((u) => ({
                id: u.id,
                title: u.name,
                description: u.role === 'ADMIN' ? 'مدير نظام' : u.role === 'GLOBAL_ACCOUNTANT' ? 'محاسب عام' : u.role === 'GENERAL_MANAGER' ? 'المدير العام' : 'موظف',
                type: 'user' as const,
                url: `/settings?tab=users&id=${u.id}`
            }))
        ];

        return { data: results };
    } catch (error) {
        console.error("Global Search Error:", error);
        return { error: "حدث خطأ أثناء الاتصال بقاعدة البيانات. حاول مجدداً." };
    }
}
