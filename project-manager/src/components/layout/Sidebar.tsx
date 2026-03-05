"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, FolderKanban, FileText, ShoppingCart,
    Archive, HeadphonesIcon, BarChart3, Users,
    Trash2, BellRing, Settings, LogOut, MessageSquare, PlusCircle, Wallet,
    KanbanSquare, ChevronDown, X
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { logout } from '@/actions/auth';

const navigationGroups = [
    {
        section: 'الأساسيات',
        items: [
            { name: 'لوحة التحكم', href: '/', icon: Home, roles: ['ADMIN', 'USER', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
            {
                name: 'المشاريع', icon: FolderKanban, roles: ['ADMIN', 'USER', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'],
                subItems: [
                    { name: 'قائمة المشاريع', href: '/projects', roles: ['ADMIN', 'USER', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
                    { name: 'إضافة مشروع جديد', href: '/projects/new', roles: ['ADMIN'] },
                ]
            },
            { name: 'المحادثات', href: '/chat', icon: MessageSquare, roles: ['ADMIN', 'USER', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
        ]
    },
    {
        section: 'المالية والمشتريات',
        items: [
            {
                name: 'الفواتير', icon: FileText, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'],
                subItems: [
                    { name: 'جميع الفواتير', href: '/invoices', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },
                    { name: 'إضافة فاتورة', href: '/invoices/new', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER'] },
                ]
            },
            {
                // U1: Removed USER — plain employees cannot create purchases (they need PROJECT_MANAGER role)
                name: 'المشتريات', icon: ShoppingCart, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'],
                subItems: [
                    { name: 'جميع المشتريات', href: '/purchases', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },
                    { name: 'إضافة طلب شراء', href: '/purchases/new', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
                ]
            },
            {
                // W2: Added GENERAL_MANAGER so they can navigate to Finance Requests
                name: 'الطلبات المالية', icon: Wallet, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'],
                subItems: [
                    { name: 'طلبات المحاسبين', href: '/finance-requests', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
                ]
            },
            {
                name: 'العهدة', icon: Wallet, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER'],
                subItems: [
                    { name: 'سجل العهدة', href: '/deposits', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT'] },
                    { name: 'تسجيل معاملة', href: '/deposits/new', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT'] },
                    { name: 'إدارة عهدي', href: '/my-custodies', roles: ['USER'] },
                ]
            },
            {
                name: 'خزنة الشركة', icon: Wallet, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'],
                subItems: [
                    { name: 'لوحة الخزنة', href: '/wallet', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
                    { name: 'إيداع جديد', href: '/wallet/deposit', roles: ['ADMIN'] },
                ]
            }
        ]
    },
    {
        section: 'الإدارة',
        items: [
            {
                // C3: Removed USER from Employees group — they saw an empty menu
                name: 'الموظفين', icon: Users, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'],
                subItems: [
                    { name: 'قائمة الموظفين', href: '/employees', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
                    { name: 'إضافة موظف جديد', href: '/employees/new', roles: ['ADMIN'] },
                    { name: 'ديون الموظفين', href: '/debts', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT'] },
                ]
            },
            { name: 'التقارير', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'GENERAL_MANAGER'] },
            // M3: Removed USER from notifications sender — only ADMIN should broadcast
            { name: 'إرسال إشعارات', href: '/notifications/send', icon: BellRing, roles: ['ADMIN'] },
        ]
    },
    {
        section: 'النظام',
        items: [
            { name: 'الدعم الفني', href: '/support', icon: HeadphonesIcon, roles: ['ADMIN', 'USER', 'GLOBAL_ACCOUNTANT'] },
            { name: 'المؤرشفات', href: '/archives', icon: Archive, roles: ['ADMIN'] },
            { name: 'السلة', href: '/trash', icon: Trash2, roles: ['ADMIN'] },
        ]
    }
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (val: boolean) => void }) {
    const pathname = usePathname();
    const { role } = useAuth();

    // State to keep track of expanded menus
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

    // Quick Add Modal state
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    // Auto-expand menu if active item is inside
    useEffect(() => {
        const newExpanded = { ...expandedMenus };
        let hasChanges = false;

        navigationGroups.forEach(group => {
            group.items.forEach(item => {
                if (item.subItems) {
                    const isAnySubActive = item.subItems.some(sub => pathname === sub.href || (pathname.startsWith(sub.href + '/') && !pathname.endsWith('/new') && sub.href !== '/'));
                    if (isAnySubActive && !expandedMenus[item.name]) {
                        newExpanded[item.name] = true;
                        hasChanges = true;
                    }
                }
            });
        });

        if (hasChanges) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setExpandedMenus(newExpanded);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const toggleMenu = (name: string) => {
        setExpandedMenus(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm md:hidden transition-all duration-300"
                    onClick={() => setIsOpen && setIsOpen(false)}
                />
            )}

            <div className={`fixed inset-y-0 start-0 z-50 flex w-[280px] flex-col bg-white/70 backdrop-blur-3xl border-e border-white/60 shadow-[0_0_40px_rgba(0,0,0,0.03)] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:rtl:translate-x-0 md:ltr:translate-x-0 ${isOpen ? 'translate-x-0 rtl:translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}>
                <div className="flex h-20 shrink-0 items-center justify-center border-b border-gray-100/50 mt-2 mb-2 px-6">
                    <div className="flex items-center justify-center gap-3 w-full">
                        <img src="/spacetoon-logo.png" alt="Spacetoon Logo" className="h-12 w-auto object-contain drop-shadow-md" />
                    </div>
                </div>

                {/* Quick Add Button */}
                <div className="px-5 pt-3 pb-2">
                    <button
                        onClick={() => setIsQuickAddOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-[#7F56D9] hover:bg-[#6941C6] text-white py-2.5 rounded-xl font-semibold shadow-sm shadow-[#7F56D9]/30 transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <PlusCircle className="w-5 h-5" />
                        إضافة سريعة
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {navigationGroups.map((group, groupIdx) => {
                        // Filter items where user has role access
                        const visibleItems = group.items.filter(item =>
                            (role && item.roles.includes(role)) ||
                            (item.subItems && item.subItems.some(sub => role && sub.roles.includes(role)))
                        );

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.section || groupIdx}>
                                <h3 className="text-[11px] font-black text-gray-500 mb-3 uppercase tracking-widest px-2">{group.section}</h3>
                                <ul className="space-y-1.5 relative">
                                    {visibleItems.map((item) => {
                                        const visibleSubItems = item.subItems?.filter(sub => role && sub.roles.includes(role)) || [];
                                        const hasSubItems = visibleSubItems.length > 0;

                                        const isActiveParent = item.href ? (pathname === item.href || (pathname.startsWith(item.href + '/') && !pathname.endsWith('/new') && item.href !== '/')) : false;
                                        const isAnySubActive = hasSubItems ? visibleSubItems.some(sub => pathname === sub.href || (pathname.startsWith(sub.href + '/') && !pathname.endsWith('/new') && sub.href !== '/')) : false;
                                        const isActive = isActiveParent || isAnySubActive;

                                        const isExpanded = expandedMenus[item.name];

                                        return (
                                            <li key={item.name} className="relative">
                                                {hasSubItems ? (
                                                    <div className="flex flex-col">
                                                        <button
                                                            onClick={() => toggleMenu(item.name)}
                                                            className={`group relative flex items-center justify-between w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200
                                                                ${isActive ? 'text-[#7F56D9] bg-[#7F56D9]/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 hover:shadow-sm'}`}
                                                        >
                                                            <div className="flex items-center gap-x-3.5">
                                                                <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                                                                {item.name}
                                                            </div>
                                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.ul
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="overflow-hidden space-y-1 mt-1 pe-3 as-container"
                                                                >
                                                                    <div className="border-s-2 border-gray-100/80 ms-4 ps-3 py-1 space-y-1">
                                                                        {visibleSubItems.map(subItem => {
                                                                            const isSubActive = pathname === subItem.href || (pathname.startsWith(subItem.href + '/') && !pathname.endsWith('/new') && subItem.href !== '/');
                                                                            return (
                                                                                <li key={subItem.name}>
                                                                                    <Link
                                                                                        href={subItem.href}
                                                                                        onClick={() => setIsOpen && setIsOpen(false)}
                                                                                        className={`group relative flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                                                                                            ${isSubActive ? 'text-[#7F56D9] bg-[#7F56D9]/5 font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                                                                    >
                                                                                        <div className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-[#7F56D9]' : 'bg-gray-300 group-hover:bg-gray-400'} transition-colors`} />
                                                                                        {subItem.name}
                                                                                    </Link>
                                                                                </li>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </motion.ul>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ) : (
                                                    // Standard nav item
                                                    <>
                                                        {isActive && !hasSubItems && (
                                                            <motion.div
                                                                layoutId="active-sidebar-item"
                                                                className="absolute inset-0 bg-gradient-to-r from-[#7F56D9]/10 to-transparent rounded-xl border-e-2 border-[#7F56D9]"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                            />
                                                        )}
                                                        <Link
                                                            href={item.href || '#'}
                                                            onClick={() => setIsOpen && setIsOpen(false)}
                                                            className={`group relative flex items-center gap-x-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200
                                                                ${isActive ? 'text-[#7F56D9]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 hover:shadow-sm hover:translate-x-[-4px]'}`}
                                                        >
                                                            <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                                                            {item.name}
                                                        </Link>
                                                    </>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </nav>
                <div className="border-t border-gray-100/50 p-4 space-y-2 mb-4 shrink-0">
                    <Link href="/settings" onClick={() => setIsOpen && setIsOpen(false)} className="group flex items-center gap-x-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 transition-all duration-200">
                        <Settings className="h-5 w-5 shrink-0 transition-transform group-hover:rotate-45" aria-hidden="true" />
                        الإعدادات
                    </Link>
                    <button
                        onClick={async () => {
                            if (setIsOpen) setIsOpen(false);
                            await logout();
                        }}
                        className="group flex w-full items-center gap-x-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                        <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                        تسجيل الخروج
                    </button>
                </div>
            </div>

            {/* Quick Add Modal */}
            <AnimatePresence>
                {isQuickAddOpen && role && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => { e.stopPropagation(); setIsQuickAddOpen(false); }}
                            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]"
                        />
                        <div className="relative z-[101] flex items-center justify-center w-full pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden pointer-events-auto border border-gray-100"
                                dir="rtl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">إضافة سريعة</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">ماذا تريد أن تضيف اليوم؟</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsQuickAddOpen(false); }}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors mr-auto"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { name: 'مشروع جديد', icon: FolderKanban, href: '/projects/new', desc: 'إنشاء مشروع وإسناد المهام', color: 'bg-blue-50 text-blue-600 border-blue-100', roles: ['ADMIN'] },
                                            { name: 'فاتورة جديدة', icon: FileText, href: '/invoices/new', desc: 'إصدار فاتورة لعميل', color: 'bg-green-50 text-green-600 border-green-100', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER'] },
                                            { name: 'موظف جديد', icon: Users, href: '/employees/new', desc: 'إضافة موظف للنظام', color: 'bg-purple-50 text-purple-600 border-purple-100', roles: ['ADMIN'] },
                                            { name: 'تسجيل عهدة', icon: Wallet, href: '/deposits/new', desc: 'تسجيل معاملة مالية', color: 'bg-orange-50 text-orange-600 border-orange-100', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT'] },
                                            { name: 'طلب شراء', icon: ShoppingCart, href: '/purchases/new', desc: 'إنشاء طلب مشتريات', color: 'bg-teal-50 text-teal-600 border-teal-100', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },
                                        ].filter(item => item.roles.includes(role)).map((item, idx) => (
                                            <Link
                                                key={idx}
                                                href={item.href}
                                                onClick={(e) => { e.stopPropagation(); setIsQuickAddOpen(false); }}
                                                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#7F56D9]/30 hover:shadow-md hover:bg-[#7F56D9]/5 transition-all duration-200"
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${item.color}`}>
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 group-hover:text-[#7F56D9] transition-colors">{item.name}</h4>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.desc}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {[
                                        { name: 'مشروع جديد', icon: FolderKanban, href: '/projects/new', desc: 'إنشاء مشروع وإسناد المهام', color: 'bg-blue-50 text-blue-600 border-blue-100', roles: ['ADMIN'] },
                                        { name: 'فاتورة جديدة', icon: FileText, href: '/invoices/new', desc: 'إصدار فاتورة لعميل', color: 'bg-green-50 text-green-600 border-green-100', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER'] },
                                        { name: 'موظف جديد', icon: Users, href: '/employees/new', desc: 'إضافة موظف للنظام', color: 'bg-purple-50 text-purple-600 border-purple-100', roles: ['ADMIN'] },
                                        { name: 'تسجيل عهدة', icon: Wallet, href: '/deposits/new', desc: 'تسجيل معاملة مالية', color: 'bg-orange-50 text-orange-600 border-orange-100', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT'] },
                                        { name: 'طلب شراء', icon: ShoppingCart, href: '/purchases/new', desc: 'إنشاء طلب مشتريات', color: 'bg-teal-50 text-teal-600 border-teal-100', roles: ['ADMIN', 'GLOBAL_ACCOUNTANT', 'USER', 'GENERAL_MANAGER'] },
                                    ].filter(item => item.roles.includes(role)).length === 0 && (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500">لا توجد لديك صلاحيات للإضافة السريعة.</p>
                                            </div>
                                        )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
