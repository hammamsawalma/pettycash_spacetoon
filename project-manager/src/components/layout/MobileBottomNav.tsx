"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, FolderKanban, FileText, User, Wallet, Camera, Plus, X, ShoppingCart, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnreadCount } from '@/actions/notifications';

// Nav items for non-employee roles
const allNavItems = [
    { name: 'حسابي', href: '/settings', icon: User, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
    { name: 'الفواتير', href: '/invoices', icon: FileText, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
    { name: 'الرئيسية', href: '/', icon: Home, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
];

// Quick add actions per role
const quickAddItems: Record<string, { name: string; href: string; icon: React.ElementType; color: string }[]> = {
    ADMIN: [
        { name: 'فاتورة جديدة', href: '/invoices/new', icon: FileText, color: 'bg-green-100 text-green-700' },
        { name: 'مشروع جديد', href: '/projects/new', icon: FolderKanban, color: 'bg-blue-100 text-blue-700' },
        { name: 'طلب شراء', href: '/purchases/new', icon: ShoppingCart, color: 'bg-teal-100 text-teal-700' },
        { name: 'تسجيل عهدة', href: '/deposits/new', icon: Wallet, color: 'bg-orange-100 text-orange-700' },
    ],
    GLOBAL_ACCOUNTANT: [
        { name: 'فاتورة جديدة', href: '/invoices/new', icon: FileText, color: 'bg-green-100 text-green-700' },
        { name: 'طلب شراء', href: '/purchases/new', icon: ShoppingCart, color: 'bg-teal-100 text-teal-700' },
        { name: 'تسجيل عهدة', href: '/deposits/new', icon: Wallet, color: 'bg-orange-100 text-orange-700' },
    ],
    GENERAL_MANAGER: [],
};

// Employee-specific nav with prominent "Upload Invoice" CTA
const employeeNavItems = [
    { name: 'الرئيسية', href: '/', icon: Home },
    { name: 'المشاريع', href: '/projects', icon: FolderKanban },
    { name: 'عهدي', href: '/my-custodies', icon: Wallet },
    { name: 'حسابي', href: '/settings', icon: User },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const role = user?.role ?? 'USER';
    const [fabOpen, setFabOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        getUnreadCount().then(count => setUnreadCount(count ?? 0)).catch(() => { });
    }, [pathname]);

    // Close FAB when navigating
    useEffect(() => {
        setFabOpen(false);
    }, [pathname]);

    if (role === 'USER') {
        return (
            <div className="fixed bottom-0 inset-x-0 z-50 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] md:hidden pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-center h-20 max-w-lg mx-auto px-2 gap-1 font-medium pt-1">
                    {/* Regular nav items */}
                    {employeeNavItems.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                        return (
                            <Link
                                href={item.href}
                                key={item.href}
                                className="flex-1 inline-flex flex-col items-center justify-center py-2 hover:bg-gray-50 group transition-all duration-200 rounded-xl min-h-[44px]"
                            >
                                <item.icon
                                    className={`w-5 h-5 mb-1 transition-all duration-200 ${isActive ? 'text-[#7F56D9] scale-110 drop-shadow-[0_2px_4px_rgba(127,86,217,0.4)]' : 'text-gray-400 group-hover:text-gray-600'}`}
                                />
                                <span className={`text-[10px] transition-colors duration-200 ${isActive ? 'text-[#7F56D9] font-bold' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Prominent "رفع فاتورة" button */}
                    <button
                        onClick={() => router.push('/invoices/new')}
                        className="flex flex-col items-center justify-center gap-1 bg-[#7F56D9] text-white rounded-2xl px-4 py-3 shadow-lg shadow-purple-300 active:scale-95 transition-transform mx-1 min-h-[52px]"
                        aria-label="رفع فاتورة"
                    >
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-black whitespace-nowrap">رفع فاتورة</span>
                    </button>
                </div>
            </div>
        );
    }

    const navItems = allNavItems.filter(item => item.roles.includes(role));
    const roleQuickAdd = quickAddItems[role] ?? [];

    return (
        <>
            {/* FAB Overlay */}
            <AnimatePresence>
                {fabOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="fab-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm md:hidden"
                            onClick={() => setFabOpen(false)}
                        />
                        {/* Quick Actions */}
                        <motion.div
                            key="fab-menu"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-gray-800 group-hover:text-[#7F56D9] transition-colors">{item.name}</span>
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
                <div className="flex items-center h-20 max-w-lg mx-auto font-medium pt-1 px-1">
                    {/* Nav items — split around FAB */}
                    {navItems.map((item, idx) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
                        // Insert FAB in the middle position
                        const midIndex = Math.floor(navItems.length / 2);
                        return (
                            <Fragment key={item.href}>
                                {idx === midIndex && roleQuickAdd.length > 0 && (
                                    <div className="flex items-center justify-center px-2">
                                        <button
                                            onClick={() => setFabOpen(v => !v)}
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 ${fabOpen
                                                ? 'bg-gray-800 shadow-gray-400/30 rotate-45'
                                                : 'bg-[#7F56D9] shadow-purple-300/60'
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
                                    className="flex-1 inline-flex flex-col items-center justify-center min-h-[44px] py-2 hover:bg-gray-50 group transition-all duration-200 rounded-xl"
                                >
                                    <div className="relative">
                                        <item.icon
                                            className={`w-5 h-5 mb-1 transition-all duration-200 ${isActive ? 'text-[#7F56D9] scale-110 drop-shadow-[0_2px_4px_rgba(127,86,217,0.4)]' : 'text-gray-400 group-hover:text-gray-600'}`}
                                        />
                                        {/* Notification badge on home icon */}
                                        {item.href === '/' && unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center leading-none">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] transition-colors duration-200 ${isActive ? 'text-[#7F56D9] font-bold' : 'text-gray-400 group-hover:text-gray-600'}`}
                                    >
                                        {item.name}
                                    </span>
                                </Link>
                            </Fragment>
                        );
                    })}

                    {/* If no quick add items, just show regular nav in a grid */}
                    {roleQuickAdd.length === 0 && navItems.length === 0 && (
                        <p className="text-gray-300 text-xs text-center w-full">لا توجد عناصر</p>
                    )}
                </div>
            </div>
        </>
    );
}
