"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, FolderKanban, FileText, ShoppingCart,
    Archive, HeadphonesIcon, BarChart3, Users,
    Trash2, BellRing, Settings, LogOut, MessageSquare, PlusCircle, Wallet,
    KanbanSquare, ChevronDown, X, Banknote, BadgeDollarSign, HandCoins,
    Download
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { logout } from '@/actions/auth';
import { canDo } from '@/lib/permissions';
import { UserRole } from '@/context/AuthContext';

// ─── Navigation Structure ─────────────────────────────────────────────────────
// Each item specifies a `check` function that receives the role and returns
// whether this item should be visible. This is the SINGLE SOURCE OF TRUTH for
// UI visibility — derived from permissions.ts via canDo().
//
// Edge cases handled:
//  - USER can VIEW purchases list but cannot create via global nav
//  - Archives visible only to finance/management roles (matches proxy.ts guard)
//  - Custody: split between 'my-custodies' (USER only) and 'deposits' (ADMIN/ACC)
//  - Finance Requests: hidden from USER
//  - Notifications/Send: only ADMIN can broadcast
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = {
    name: string;
    icon: React.ElementType;
    href?: string;
    // check receives system role + optional coordinator flag for project-role-based visibility
    check: (role: UserRole, isCoordinatorInAny?: boolean) => boolean;
    subItems?: {
        name: string;
        href: string;
        check: (role: UserRole, isCoordinatorInAny?: boolean) => boolean;
    }[];
};

type NavGroup = {
    section: string;
    items: NavItem[];
};

const navigationGroups: NavGroup[] = [
    {
        section: 'الأساسيات',
        items: [
            {
                name: 'لوحة التحكم',
                href: '/',
                icon: Home,
                // All authenticated roles see the dashboard
                check: () => true,
            },
            {
                name: 'المشاريع',
                icon: FolderKanban,
                // Visible if the user can either view all projects OR is a USER (sees own projects)
                check: (r) => canDo(r, 'projects', 'viewAll') || r === 'USER',
                subItems: [
                    {
                        name: 'قائمة المشاريع',
                        href: '/projects',
                        check: (r) => canDo(r, 'projects', 'viewAll') || r === 'USER',
                    },
                    {
                        name: 'إضافة مشروع جديد',
                        href: '/projects/new',
                        // Only ADMIN can create from global nav; USER/Coordinator creates inside project
                        check: (r) => canDo(r, 'employees', 'create'), // same as ADMIN-only
                    },
                ],
            },
            {
                name: 'المحادثات',
                href: '/chat',
                icon: MessageSquare,
                check: () => true,
            },
        ],
    },
    {
        section: 'المالية والمشتريات',
        items: [
            {
                name: 'الفواتير',
                icon: FileText,
                // All roles that can create OR approve invoices see this section
                check: (r) => canDo(r, 'invoices', 'create') || canDo(r, 'invoices', 'viewAll'),
                subItems: [
                    {
                        name: 'جميع الفواتير',
                        href: '/invoices',
                        check: (r) => canDo(r, 'invoices', 'create') || canDo(r, 'invoices', 'viewAll'),
                    },
                    {
                        name: 'إضافة فاتورة',
                        href: '/invoices/new',
                        // GENERAL_MANAGER cannot create invoices (view-only) — handled in permissions.ts
                        check: (r) => canDo(r, 'invoices', 'create') && r !== 'GENERAL_MANAGER',
                    },
                ],
            },
            {
                name: 'المشتريات',
                icon: ShoppingCart,
                // All roles that can view purchases list see the parent item
                check: (r) => canDo(r, 'purchases', 'view'),
                subItems: [
                    {
                        name: 'جميع المشتريات',
                        href: '/purchases',
                        check: (r) => canDo(r, 'purchases', 'view'),
                    },
                    {
                        name: 'إضافة طلب شراء',
                        href: '/purchases/new',
                        // ADMIN + GM at system level; USER-coordinator via isCoordinatorInAny
                        check: (r, isCoordinatorInAny) => canDo(r, 'purchases', 'createGlobal') || (r === 'USER' && !!isCoordinatorInAny),
                    },
                ],
            },
            {
                name: 'الطلبات المالية',
                icon: BadgeDollarSign,
                check: (r) => canDo(r, 'financialRequests', 'view'),
                subItems: [
                    {
                        name: 'طلبات المحاسبين',
                        href: '/finance-requests',
                        check: (r) => canDo(r, 'financialRequests', 'view'),
                    },
                ],
            },
            {
                name: 'العهدة',
                icon: HandCoins,
                // Visible to all who can view custodies (management) or specific USER custodies
                check: (r) => canDo(r, 'custodies', 'view'),
                subItems: [
                    {
                        name: 'عهد الموظفين',
                        href: '/employee-custodies',
                        check: (r) => r === 'ADMIN' || r === 'GLOBAL_ACCOUNTANT' || r === 'GENERAL_MANAGER',
                    },
                    {
                        name: 'إدارة عهدي',
                        href: '/my-custodies',
                        // Only USER role has their own custody page — edge case: ADMIN/ACC do not
                        check: (r) => r === 'USER',
                    },
                    {
                        name: 'العهد الخارجية',
                        href: '/external-custodies',
                        // v5.1: ADMIN + GLOBAL_ACCOUNTANT + GENERAL_MANAGER
                        check: (r) => r === 'ADMIN' || r === 'GLOBAL_ACCOUNTANT' || r === 'GENERAL_MANAGER',
                    },
                    {
                        name: 'عهد مصاريف الشركة',
                        href: '/company-custodies',
                        // v7: ADMIN + GLOBAL_ACCOUNTANT + GENERAL_MANAGER
                        check: (r) => r === 'ADMIN' || r === 'GLOBAL_ACCOUNTANT' || r === 'GENERAL_MANAGER',
                    },
                ],
            },
            {
                name: 'خزنة الشركة',
                icon: Wallet,
                check: (r) => canDo(r, 'wallet', 'view'),
                subItems: [
                    {
                        name: 'لوحة الخزنة',
                        href: '/wallet',
                        check: (r) => canDo(r, 'wallet', 'view'),
                    },
                    {
                        name: 'إيداع جديد',
                        href: '/wallet/deposit',
                        check: (r) => canDo(r, 'wallet', 'deposit'),
                    },
                ],
            },
            {
                name: 'الديون',
                href: '/debts',
                icon: Banknote,
                // All roles can view debts — USER sees own debts only (server-filtered)
                check: (r) => canDo(r, 'debts', 'view'),
            },
        ],
    },
    {
        section: 'الإدارة',
        items: [
            {
                name: 'الموظفين',
                icon: Users,
                // Only management roles see this section — USER has no access to employees list
                check: (r) => canDo(r, 'employees', 'viewAll'),
                subItems: [
                    {
                        name: 'قائمة الموظفين',
                        href: '/employees',
                        check: (r) => canDo(r, 'employees', 'viewAll'),
                    },
                    {
                        name: 'إضافة موظف جديد',
                        href: '/employees/new',
                        check: (r) => canDo(r, 'employees', 'create'),
                    },
                ],
            },
            {
                name: 'التقارير',
                href: '/reports',
                icon: BarChart3,
                check: (r) => canDo(r, 'reports', 'viewAll'),
            },
            {
                name: 'مركز التصدير',
                href: '/exports',
                icon: Download,
                check: (r) => canDo(r, 'exports', 'view'),
            },
            {
                name: 'إرسال إشعارات',
                href: '/notifications/send',
                icon: BellRing,
                check: (r) => canDo(r, 'notifications', 'send'),
            },
        ],
    },
    {
        section: 'النظام',
        items: [
            {
                name: 'إدارة التصنيفات',
                href: '/settings/categories',
                icon: FolderKanban,
                // v5: Only ADMIN + GLOBAL_ACCOUNTANT
                check: (r) => r === 'ADMIN' || r === 'GLOBAL_ACCOUNTANT',
            },
            {
                name: 'الدعم الفني',
                icon: HeadphonesIcon,
                // All roles get support access
                check: () => true,
                subItems: [
                    {
                        name: 'تذاكر الدعم',
                        href: '/support',
                        check: () => true,
                    },
                    {
                        name: 'محادثات الدعم',
                        href: '/support/admin',
                        // Only ADMIN can manage support conversations
                        check: (r) => r === 'ADMIN',
                    },
                ],
            },
            {
                name: 'المؤرشفات',
                href: '/archives',
                icon: Archive,
                // Must match proxy.ts guard: ADMIN, GLOBAL_ACCOUNTANT, GENERAL_MANAGER
                check: (r) => canDo(r, 'archive', 'view'),
            },
            {
                name: 'السلة',
                href: '/trash',
                icon: Trash2,
                check: (r) => canDo(r, 'trash', 'manage'),
            },
        ],
    },
];

// ─── Quick Add items — derived from PERMISSIONS ───────────────────────────────
// Edge case: Quick Add items are a subset of "create" nav items.
// We do NOT include items where permission requires project-level context
// (USER/Coordinator purchases — they use the project page for that).
type QuickAddItem = {
    name: string;
    icon: React.ElementType;
    href: string;
    desc: string;
    color: string;
    check: (role: UserRole, isCoordinatorInAny?: boolean) => boolean;
};

const QUICK_ADD_ITEMS: QuickAddItem[] = [
    {
        name: 'مشروع جديد',
        icon: FolderKanban,
        href: '/projects/new',
        desc: 'إنشاء مشروع وإسناد المهام',
        color: 'bg-blue-50 text-blue-600 border-blue-100',
        check: (r) => canDo(r, 'employees', 'create'), // ADMIN only
    },
    {
        name: 'فاتورة جديدة',
        icon: FileText,
        href: '/invoices/new',
        desc: 'إصدار فاتورة لمشروع',
        color: 'bg-green-50 text-green-600 border-green-100',
        // USER and ACC can create; GM cannot (view only)
        check: (r) => canDo(r, 'invoices', 'create') && r !== 'GENERAL_MANAGER',
    },
    {
        name: 'موظف جديد',
        icon: Users,
        href: '/employees/new',
        desc: 'إضافة موظف للنظام',
        color: 'bg-blue-50 text-blue-600 border-blue-100',
        check: (r) => canDo(r, 'employees', 'create'), // ADMIN only
    },

    {
        name: 'طلب شراء',
        icon: ShoppingCart,
        href: '/purchases/new',
        desc: 'إنشاء طلب مشتريات',
        color: 'bg-teal-50 text-teal-600 border-teal-100',
        // ADMIN + GM at system level; USER-coordinator via isCoordinatorInAny
        check: (r: UserRole, isCoordinatorInAny?: boolean) => canDo(r, 'purchases', 'createGlobal') || (r === 'USER' && !!isCoordinatorInAny),
    },
    {
        name: 'طلب مالي',
        icon: BadgeDollarSign,
        href: '/finance-requests',
        desc: 'إنشاء طلب مالي للمدير',
        color: 'bg-amber-50 text-amber-600 border-amber-100',
        check: (r) => canDo(r, 'financialRequests', 'create') && r !== 'ADMIN',
    },
] satisfies QuickAddItem[];


export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (val: boolean) => void }) {
    const pathname = usePathname();
    const { user, isCoordinatorInAny, roleNameAr } = useAuth();
    const role = user?.role as UserRole | undefined;

    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // ── Swipe-to-close (RTL-aware touch gesture) ──────────────────────────────
    const touchStartX = useRef(0);
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!setIsOpen || !isOpen) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        // In RTL: sidebar slides from the right, so swipe-right closes it
        // In LTR: sidebar slides from the left, so swipe-left closes it
        const isRTL = document.documentElement.dir === 'rtl';
        if (isRTL ? diff > 60 : diff < -60) {
            setIsOpen(false);
        }
    }, [isOpen, setIsOpen]);

    // ── Focus trap when sidebar is open on mobile ──────────────────────────────
    useEffect(() => {
        if (!isOpen || !sidebarRef.current) return;
        const sidebar = sidebarRef.current;
        const focusable = sidebar.querySelectorAll<HTMLElement>(
            'a, button, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setIsOpen && setIsOpen(false); return; }
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        first?.focus();
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Auto-expand menu if active item is inside
    useEffect(() => {
        if (!role) return;
        const newExpanded = { ...expandedMenus };
        let hasChanges = false;

        navigationGroups.forEach(group => {
            group.items.forEach(item => {
                if (item.subItems) {
                    const isAnySubActive = item.subItems.some(sub =>
                        sub.check(role, isCoordinatorInAny) && (pathname === sub.href || (pathname.startsWith(sub.href + '/') && !pathname.endsWith('/new') && sub.href !== '/'))
                    );
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
    }, [pathname, role]);

    const toggleMenu = (name: string) => {
        setExpandedMenus(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    // Nothing to render if role is not yet loaded — prevents flash of wrong nav
    if (!role) return null;

    const availableQuickAddItems = QUICK_ADD_ITEMS.filter(item => role && item.check(role, isCoordinatorInAny));

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-x-0 top-16 bottom-0 z-40 bg-gray-900/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen && setIsOpen(false)}
                />
            )}

            <div
                ref={sidebarRef}
                role={isOpen ? 'dialog' : undefined}
                aria-modal={isOpen ? 'true' : undefined}
                aria-label="القائمة الجانبية"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`
                    fixed z-50 flex flex-col
                    bg-white/85 backdrop-blur-3xl
                    shadow-[6px_0_40px_rgba(0,0,0,0.12),2px_0_12px_rgba(0,0,0,0.06)]
                    transform transition-transform duration-300 ease-in-out
                    start-0
                    top-[calc(4rem+0.5rem)] bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)]
                    w-[min(280px,85vw)]
                    rounded-e-3xl border border-white/60 border-s-0
                    md:inset-y-0 md:top-0 md:bottom-0 md:w-[280px] md:rounded-none md:border-s-0 md:border-e md:border-white/60
                    ${isOpen ? 'translate-x-0 rtl:translate-x-0' : '-translate-x-full rtl:translate-x-full'}
                    md:translate-x-0 md:rtl:translate-x-0
                `}>
                <div className="flex h-16 shrink-0 items-center justify-center border-b border-gray-100/50 px-6 md:h-20">
                    <div className="flex items-center justify-center gap-3 w-full">
                        <img src="/spacetoon-logo.png" alt="Spacetoon Logo" className="h-12 w-auto object-contain drop-shadow-md" />
                    </div>
                </div>

                {/* Quick Add Button — only render if user has any quick add actions */}
                {availableQuickAddItems.length > 0 && (
                    <div className="px-5 pt-3 pb-2">
                        <button
                            onClick={() => setIsQuickAddOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-[#102550] hover:bg-[#1a3a7c] text-white py-2.5 rounded-xl font-semibold shadow-sm shadow-[#102550]/30 transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <PlusCircle className="w-5 h-5" />
                            إضافة سريعة
                        </button>
                    </div>
                )}

                <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {navigationGroups.map((group, groupIdx) => {
                        // Filter items visible to this role
                        const visibleItems = group.items.filter(item => item.check(role));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={group.section || groupIdx}>
                                <h3 className="text-[11px] font-black text-gray-500 mb-3 uppercase tracking-widest px-2">{group.section}</h3>
                                <ul className="space-y-1.5 relative">
                                    {visibleItems.map((item) => {
                                        const visibleSubItems = item.subItems?.filter(sub => role && sub.check(role, isCoordinatorInAny)) || [];
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
                                                                ${isActive ? 'text-[#102550] bg-[#102550]/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 hover:shadow-sm'}`}
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
                                                                                            ${isSubActive ? 'text-[#102550] bg-[#102550]/5 font-bold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                                                                    >
                                                                                        <div className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-[#102550]' : 'bg-gray-300 group-hover:bg-gray-400'} transition-colors`} />
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
                                                                className="absolute inset-0 bg-gradient-to-r from-[#102550]/10 to-transparent rounded-xl border-e-2 border-[#102550]"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                            />
                                                        )}
                                                        <Link
                                                            href={item.href || '#'}
                                                            onClick={() => setIsOpen && setIsOpen(false)}
                                                            className={`group relative flex items-center gap-x-3.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200
                                                                ${isActive ? 'text-[#102550]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 hover:shadow-sm hover:translate-x-[-4px]'}`}
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
                {/* ── Footer: User card + actions ─────────────────────────── */}
                <div className="shrink-0 mx-3 mb-3">
                    {/* Gradient divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-3" />

                    {/* User card → settings */}
                    <Link
                        href="/settings"
                        onClick={() => setIsOpen && setIsOpen(false)}
                        className="group flex items-center gap-3 p-3 rounded-2xl bg-gray-50/80 hover:bg-[#102550]/5 border border-gray-100/80 hover:border-[#102550]/20 transition-all duration-200 mb-2"
                    >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#102550]/10 to-[#102550]/20 border border-[#102550]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <span className="text-[#102550] font-black text-sm">{user?.name?.charAt(0) ?? '؟'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#102550] transition-colors">{user?.name || 'مستخدم'}</p>
                            <p className="text-[10px] text-gray-400 font-medium truncate">{roleNameAr}</p>
                        </div>
                        <Settings className="h-4 w-4 text-gray-300 group-hover:text-[#102550] group-hover:rotate-45 transition-all shrink-0" />
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={async () => {
                            if (setIsOpen) setIsOpen(false);
                            await logout();
                        }}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500/80 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200"
                    >
                        <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1" />
                        تسجيل الخروج
                    </button>
                </div>

            </div>

            {/* Quick Add Modal */}
            <AnimatePresence>
                {isQuickAddOpen && (
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
                                    {availableQuickAddItems.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {availableQuickAddItems.map((item, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={item.href}
                                                    onClick={(e) => { e.stopPropagation(); setIsQuickAddOpen(false); }}
                                                    className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#102550]/30 hover:shadow-md hover:bg-[#102550]/5 transition-all duration-200"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${item.color}`}>
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 group-hover:text-[#102550] transition-colors">{item.name}</h4>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.desc}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
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
