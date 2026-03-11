import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Fragment } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const routeMapAr: Record<string, string> = {
    'projects': 'المشاريع',
    'invoices': 'الفواتير',
    'purchases': 'المشتريات',
    'employees': 'الموظفين',
    'deposits': 'العهدة',
    'support': 'الدعم الفني',
    'reports': 'التقارير',
    'settings': 'الإعدادات',
    'new': 'إضافة جديد',
    'edit': 'تعديل',
    'details': 'التفاصيل',
    'chat': 'المحادثات',
    'trash': 'السلة',
    'archives': 'المؤرشفات',
    'notifications': 'الإشعارات',
    'send': 'إرسال',
};

const routeMapEn: Record<string, string> = {
    'projects': 'Projects',
    'invoices': 'Invoices',
    'purchases': 'Purchases',
    'employees': 'Employees',
    'deposits': 'Custody',
    'support': 'Support',
    'reports': 'Reports',
    'settings': 'Settings',
    'new': 'Add New',
    'edit': 'Edit',
    'details': 'Details',
    'chat': 'Chat',
    'trash': 'Trash',
    'archives': 'Archives',
    'notifications': 'Notifications',
    'send': 'Send',
};

export function Breadcrumbs({ fallbackTitle }: { fallbackTitle: string }) {
    const pathname = usePathname();
    const { locale } = useLanguage();
    const segments = pathname.split('/').filter(Boolean);
    const routeMap = locale === 'ar' ? routeMapAr : routeMapEn;
    const homeLabel = locale === 'ar' ? 'الرئيسية' : 'Home';

    if (segments.length === 0) {
        return <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r rtl:bg-gradient-to-l from-gray-900 via-gray-700 to-gray-900 tracking-tight">{fallbackTitle}</h1>;
    }

    const breadcrumbs = segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join('/')}`;
        let name = routeMap[segment] || segment;
        if (segment.length >= 20 || !isNaN(Number(segment))) {
            name = locale === 'ar' ? `تفاصيل (${segment.slice(0, 4)}...)` : `Details (${segment.slice(0, 4)}...)`;
        }

        return { name, url };
    });

    const isLong = breadcrumbs.length > 3;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 space-x-reverse md:space-x-2 md:space-x-reverse text-xs md:text-lg">
            <Link href="/" className="text-gray-500 hover:text-[#102550] font-bold transition-colors">
                {homeLabel}
            </Link>

            {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                const isHidden = isLong && idx > 0 && idx < breadcrumbs.length - 2; // Hide middle items if > 3

                if (isHidden) {
                    if (idx === 1) {
                        return (
                            <Fragment key="ellipsis">
                                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 rtl:rotate-180 shrink-0" />
                                <span className="text-gray-400 bg-gray-50 rounded px-1.5 py-0.5 border border-gray-100 shadow-sm">
                                    <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4" />
                                </span>
                            </Fragment>
                        );
                    }
                    return null;
                }

                return (
                    <Fragment key={crumb.url}>
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 rtl:rotate-180 shrink-0" />
                        {isLast ? (
                            <h1 className="font-black bg-clip-text text-transparent bg-gradient-to-r rtl:bg-gradient-to-l from-[#102550] to-blue-600 tracking-tight text-sm md:text-2xl line-clamp-1" aria-current="page" title={fallbackTitle}>
                                {fallbackTitle !== homeLabel && !routeMap[segments[segments.length - 1]] ? fallbackTitle : crumb.name}
                            </h1>
                        ) : (
                            <Link href={crumb.url} className="text-gray-500 hover:text-[#102550] font-bold transition-colors line-clamp-1 max-w-[80px] md:max-w-xs text-xs md:text-base">
                                {crumb.name}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
