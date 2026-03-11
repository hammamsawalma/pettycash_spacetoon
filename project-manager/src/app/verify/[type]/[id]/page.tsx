import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/verification';
import { getSession } from '@/lib/auth';
import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ShieldCheck, XCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { cookies } from 'next/headers';

export default async function VerificationPage({
    params,
    searchParams
}: {
    params: Promise<{ type: string; id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { type, id } = await params;
    const { token } = await searchParams;
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ar'; // Default Arabic

    const t = {
        missingToken: locale === 'en' ? 'Missing verification token (URL is incomplete)' : 'معرّف التحقق مفقود (Missing Token)',
        unsupportedType: locale === 'en' ? 'Unsupported document type' : 'نوع المستند غير مدعوم (Unsupported Type)',
        notFound: locale === 'en' ? 'This document does not exist in the system' : 'هذا المستند غير موجود في النظام (Not Found)',
        invalidToken: locale === 'en' ? 'Invalid or forged verification token' : 'المستند مزوّر أو تم التلاعب بالرابط (Invalid/Forged Document)',
        dbError: locale === 'en' ? 'A database error occurred while verifying' : 'حدث خطأ أثناء الاتصال بقاعدة البيانات (Database Error)',
        verified: locale === 'en' ? 'Verified Document' : 'مستند موثّق',
        typeLabel: locale === 'en' ? 'Document Type' : 'نوع المستند',
        invoiceType: locale === 'en' ? 'Purchase Invoice' : 'فاتورة مشتريات',
        purchaseType: locale === 'en' ? 'Purchase Request' : 'طلب شراء',
        numberLabel: locale === 'en' ? 'Reference Number' : 'الرقم المرجعي',
        dateLabel: locale === 'en' ? 'Date' : 'التاريخ',
        amountLabel: locale === 'en' ? 'Total Amount' : 'المبلغ الإجمالي',
        currency: locale === 'en' ? 'QAR' : 'ر.ق',
        statusLabel: locale === 'en' ? 'Status' : 'الحالة',
        viewSystem: locale === 'en' ? 'View Full Details in System' : 'عرض التفاصيل كاملة في النظام',
        errorTitle: locale === 'en' ? 'Verification Failed' : 'عذراً، لا يمكن التحقق'
    };

    if (!token || typeof token !== 'string') {
        return <ErrorState message={t.missingToken} title={t.errorTitle} dir={locale === 'en' ? 'ltr' : 'rtl'} />;
    }

    if (type !== 'invoice' && type !== 'purchase') {
        return <ErrorState message={t.unsupportedType} title={t.errorTitle} dir={locale === 'en' ? 'ltr' : 'rtl'} />;
    }

    let document: any = null;
    let internalPath = '';
    let dbId = '';

    try {
        if (type === 'invoice') {
            document = await prisma.invoice.findUnique({
                where: { reference: id },
                include: { creator: { select: { name: true } } }
            });
            internalPath = `/invoices/${document?.id}`;
            dbId = document?.id;
        } else if (type === 'purchase') {
            document = await prisma.purchase.findUnique({
                where: { orderNumber: id },
                include: { creator: { select: { name: true } } }
            });
            internalPath = `/purchases/${document?.id}`;
            dbId = document?.id;
        }

        if (!document || !dbId) {
            return <ErrorState message={t.notFound} title={t.errorTitle} dir={locale === 'en' ? 'ltr' : 'rtl'} />;
        }

        const isValid = verifyToken(dbId, token);
        if (!isValid) {
            return <ErrorState message={t.invalidToken} title={t.errorTitle} dir={locale === 'en' ? 'ltr' : 'rtl'} />;
        }
    } catch (e) {
        return <ErrorState message={t.dbError} title={t.errorTitle} dir={locale === 'en' ? 'ltr' : 'rtl'} />;
    }

    const session = await getSession();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-cairo" dir={locale === 'en' ? 'ltr' : 'rtl'}>
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 opacity-20" style={{ backgroundImage: "url('/spacetoon-logo.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
                    <ShieldCheck className="w-20 h-20 mx-auto text-white drop-shadow-md relative z-10" />
                    <h1 className="text-2xl font-black mt-4 drop-shadow-sm relative z-10">{t.verified}</h1>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div className="text-gray-500 text-sm font-bold">{t.typeLabel}</div>
                        <div className="font-black text-gray-900">{type === 'invoice' ? t.invoiceType : t.purchaseType}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                            <div className="text-xs text-gray-500 font-bold mb-1">{t.numberLabel}</div>
                            <div className="font-black text-gray-900 text-sm md:text-base break-all focus:outline-none">{type === 'invoice' ? document.reference : document.orderNumber}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                            <div className="text-xs text-gray-500 font-bold mb-1">{t.dateLabel}</div>
                            <div className="font-black text-gray-900 text-sm md:text-base">
                                {new Date(document.date || document.createdAt).toLocaleDateString('en-GB')}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div className="text-gray-500 text-sm font-bold">{t.amountLabel}</div>
                        <div className="font-black text-2xl text-[#102550]">
                            {document.amount.toLocaleString('en-US')} <span className="text-sm">{t.currency}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="text-gray-500 text-sm font-bold">{t.statusLabel}</div>
                        <div>
                            <StatusBadge status={document.status} />
                        </div>
                    </div>

                    {session && (
                        <div className="pt-6 mt-6 border-t border-gray-100">
                            <a href={internalPath} className="w-full flex items-center justify-center gap-2 py-4 bg-[#102550] hover:bg-[#0c1c3d] text-white rounded-2xl font-bold transition-all shadow-md group">
                                {t.viewSystem}
                                <ExternalLink className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ErrorState({ message, title, dir }: { message: string; title: string; dir: "rtl" | "ltr" }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-cairo" dir={dir}>
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <XCircle className="w-24 h-24 mx-auto text-red-500 drop-shadow-sm" />
                <h1 className="text-2xl font-black text-gray-900">{title}</h1>
                <p className="text-red-600 font-medium bg-red-50 p-4 rounded-2xl text-sm leading-relaxed border border-red-100">
                    {message}
                </p>
            </div>
        </div>
    );
}
