"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FolderKanban, FileText, User, Wallet, Camera, Plus, X, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/context/AuthContext';
import { canDo } from '@/lib/permissions';
import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnreadCount } from '@/actions/notifications';
import { useProjectRoles } from '@/context/ProjectRolesContext';

// ─── Employee (USER role) nav ─────────────────────────────────────────────────
const employeeNavItems = [
    { name: 'الرئيسية', href: '/', icon: Home },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban },
    { name: 'عهدي', href: '/my-custodies', icon: Wallet },
    { name: 'حسابي', href: '/settings', icon: User },
];

// ─── Pages where the bottom nav should be hidden ──────────────────────────────
// These pages have their own fixed CTAs that would overlap with the nav.
const HIDE_NAV_PATHS = [
    '/invoices/new',
    '/purchases/new',
    '/projects/new',
    '/deposits/new',
];

// ─── Management nav items ─────────────────────────────────────────────────────
type NavItemDef = {
    name: string;
    href: string;
    icon: React.ElementType;
    check: (role: UserRole) => boolean;
};

const allNavItems: NavItemDef[] = [
    { name: 'حسابي', href: '/settings', icon: User, check: () => true },
    { name: 'الفواتير', href: '/invoices', icon: FileText, check: (r) => canDo(r, 'invoices', 'viewAll') || canDo(r, 'invoices', 'create') },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban, check: (r) => canDo(r, 'projects', 'viewAll') },
    { name: 'الرئيسية', href: '/', icon: Home, check: () => true },
];

type QuickAddDef = {
    name: string;
    href: string;
    icon: React.ElementType;
    color: string;
    // second arg: isCoordinatorInAny (for coordinator-gated items)
    check: (role: UserRole, isCoordinatorInAny?: boolean) => boolean;
};

const quickAddDefs: QuickAddDef[] = [
    {
        name: 'فاتورة جديدة',
        href: '/invoices/new',
        icon: FileText,
        color: 'bg-green-100 text-green-700',
        check: (r) => canDo(r, 'invoices', 'create') && r !== 'GENERAL_MANAGER',
    },
    {
        name: 'مشروع جديد',
        href: '/projects/new',
        icon: FolderKanban,
        color: 'bg-blue-100 text-blue-700',
        check: (r) => canDo(r, 'employees', 'create'),
    },
    {
        name: 'طلب شراء',
        href: '/purchases/new',
        icon: ShoppingCart,
        color: 'bg-teal-100 text-teal-700',
        // Mirrors Sidebar: ADMIN/GM at system level; USER-coordinator via isCoordinatorInAny
        check: (r, isCoordinatorInAny) => canDo(r, 'purchases', 'createGlobal') || (r === 'USER' && !!isCoordinatorInAny),
    },
    {
        name: 'تسجيل عهدة',
        href: '/deposits/new',
        icon: Wallet,
        color: 'bg-orange-100 text-orange-700',
        check: (r) => canDo(r, 'custodies', 'recordReturn'),
    },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isCoordinatorInAny } = useAuth();
    const role = (user?.role ?? 'USER') as UserRole;
    const [fabOpen, setFabOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { flags } = useProjectRoles();

    useEffect(() => {
        // Initial fetch on route change
        getUnreadCount().then(count => setUnreadCount(count ?? 0)).catch(() => { });

        // Poll every 30s to keep count fresh without WebSocket complexity
        const interval = setInterval(() => {
            getUnreadCount().then(count => setUnreadCount(count ?? 0)).catch(() => { });
        }, 30_000);

        return () => clearInterval(interval);
    }, [pathname]);

    useEffect(() => {
        setFabOpen(false);
    }, [pathname]);

    // ── Hide nav on form pages to prevent CTA overlap ─────────────────────────
    const isFormPage = HIDE_NAV_PATHS.some(p => pathname.startsWith(p));
    if (isFormPage) return null;

    // ── Employee (USER) view ──────────────────────────────────────────────────
    if (role === 'USER') {
        const canAddInvoice = !flags.loaded || flags.canAddInvoice;
        const ctaHref = canAddInvoice ? '/invoices/new' : '/purchases/new';
        const CtaIcon = canAddInvoice ? Camera : ShoppingCart;
        const ctaLabel = canAddInvoice ? 'رفع فاتورة' : 'طلب شراء';

        return (
            /* Outer wrapper — position:relative so the floating CTA can anchor to it */
            <div className="fixed bottom-0 inset-x-0 z-50 w-full md:hidden">
                {/* ── Floating CTA — floats above the bar, centered ─────────────── */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <button
                        onClick={() => router.push(ctaHref)}
                        aria-label={ctaLabel}
                        className="flex flex-col items-center justify-center gap-0.5 bg-[#102550] text-white w-14 h-14 rounded-full shadow-xl shadow-[#102550]/40 active:scale-95 transition-transform border-4 border-white"
                    >
                        <CtaIcon className="w-5 h-5" />
                        <span className="text-[8px] font-black leading-none">{ctaLabel}</span>
                    </button>
                </div>

                {/* ── Bar ─────────────────────────────────────────────────────── */}
                <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
                    <div className="flex items-center h-16 max-w-lg mx-auto px-2 font-medium">
                        {employeeNavItems.map((item) => {
                            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                            return (
                                <Link
                                    href={item.href}
                                    key={item.href}
                                    className="flex-1 inline-flex flex-col items-center justify-center py-2 hover:bg-gray-50 group transition-all duration-200 rounded-xl min-h-[48px] active:scale-95"
                                >
                                    <item.icon
                                        className={`w-5 h-5 mb-0.5 transition-all duration-200 ${isActive ? 'text-[#102550] scale-110' : 'text-gray-400 group-hover:text-gray-600'}`}
                                    />
                                    <span className={`text-[10px] transition-colors duration-200 ${isActive ? 'text-[#102550] font-bold' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ── Management nav (ADMIN, GLOBAL_ACCOUNTANT, GENERAL_MANAGER) ─────────────
    const navItems = allNavItems.filter(item => item.check(role));
    const roleQuickAdd = quickAddDefs.filter(item => item.check(role, isCoordinatorInAny));

    return (
        <>
            {/* FAB Overlay */}
            <AnimatePresence>
                {fabOpen && (
                    <>
                        <motion.div
                            key="fab-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm md:hidden"
                            onClick={() => setFabOpen(false)}
                        />
                        <motion.div
                            key="fab-menu"
                            initial={{ opacity: 0, y: 16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="fixed bottom-[88px] inset-x-0 z-50 md:hidden px-4 pb-[env(safe-area-inset-bottom)]"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-sm mx-auto">
                                <div className="p-4 border-b border-gray-50">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-wider">إضافة سريعة</p>
                                </div>
                                <div className="p-3 space-y-1">
                                    {roleQuickAdd.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setFabOpen(false)}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] transition-all duration-150 group min-h-[48px]"
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-gray-800 group-hover:text-[#102550] transition-colors">{item.name}</span>
                                        </Link>
                                    ))}
                                    {roleQuickAdd.length === 0 && (
                                        <p className="text-center text-sm text-gray-400 py-4">لا توجد إجراءات سريعة</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Nav Bar */}
            <div className="fixed bottom-0 inset-x-0 z-50 w-full bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_30px_rgba(0,0,0,0.05)] md:hidden pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-center h-16 max-w-lg mx-auto font-medium px-2">
                    {navItems.map((item, idx) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                        const midIndex = Math.floor(navItems.length / 2);
                        return (
                            <Fragment key={item.href}>
                                {/* FAB button inserted in the middle */}
                                {idx === midIndex && roleQuickAdd.length > 0 && (
                                    <div className="flex items-center justify-center px-2">
                                        <button
                                            onClick={() => setFabOpen(v => !v)}
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${fabOpen
                                                ? 'bg-gray-800 shadow-gray-400/30 rotate-45'
                                                : 'bg-[#102550] shadow-blue-300/60'
                                                }`}
                                            aria-label="قائمة الإضافة السريعة"
                                        >
                                            {fabOpen
                                                ? <X className="w-5 h-5 text-white" />
                                                : <Plus className="w-5 h-5 text-white" />
                                            }
                                        </button>
                                    </div>
                                )}
                                <Link
                                    href={item.href}
                                    className="flex-1 inline-flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-2 hover:bg-gray-50 group transition-all duration-200 rounded-xl active:scale-95"
                                >
                                    <div className="relative">
                                        <item.icon
                                            className={`w-5 h-5 mb-1 transition-all duration-200 ${isActive ? 'text-[#102550] scale-110 drop-shadow-[0_2px_4px_rgba(127,86,217,0.4)]' : 'text-gray-400 group-hover:text-gray-600'}`}
                                        />
                                        {/* Notification badge */}
                                        {item.href === '/' && unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center leading-none">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] transition-colors duration-200 ${isActive ? 'text-[#102550] font-bold' : 'text-gray-400 group-hover:text-gray-600'}`}
                                    >
                                        {item.name}
                                    </span>
                                </Link>
                            </Fragment>
                        );
                    })}

                    {/* Edge case: GENERAL_MANAGER has no quick add actions */}
                    {roleQuickAdd.length === 0 && navItems.length === 0 && (
                        <p className="text-gray-300 text-xs text-center w-full">لا توجد عناصر</p>
                    )}
                </div>
            </div>
        </>
    );
}
