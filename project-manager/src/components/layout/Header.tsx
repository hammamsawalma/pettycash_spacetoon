"use client";
import { Search, Settings, ChevronRight, User, Home, Menu, BookOpen } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotificationDropdown } from './NotificationDropdown';

export default function Header({ title, onMenuClick }: { title: string, onMenuClick?: () => void }) {
    const { roleNameAr, user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const isHome = pathname === '/';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <header className="sticky top-0 z-40 flex h-16 md:h-20 shrink-0 items-center justify-between gap-x-4 border-b border-white/60 bg-white/70 backdrop-blur-3xl px-4 sm:gap-x-6 sm:px-8 shadow-[0_4px_40px_rgba(0,0,0,0.02)] text-gray-900 transition-all duration-300">

                {/* Mobile Header (Home) */}
                {isHome && (
                    <div className="flex md:hidden items-center justify-between w-full relative h-12">
                        {/* User Avatar & Menu */}
                        <div className="flex items-center gap-1">
                            <button onClick={onMenuClick} className="p-2 -ms-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                                <Menu className="h-6 w-6" />
                            </button>
                            <Link href="/settings" className="flex items-center gap-2 cursor-pointer group">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#102550]/10 to-[#102550]-hover/10 border border-[#102550]/20 overflow-hidden text-[#102550] shadow-inner shadow-white/50 group-hover:scale-105 transition-transform">
                                    <User className="h-5 w-5 text-[#102550]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">مرحبا</span>
                                    <span className="text-sm font-bold text-gray-900 leading-tight group-hover:text-[#102550] transition-colors line-clamp-1 max-w-[120px]">{user?.name || "مستخدم"}</span>
                                </div>
                            </Link>
                        </div>

                        {/* Notification Bell */}
                        <NotificationDropdown isMobile={true} />

                        {/* Ambient Header Glow */}
                        <div className="absolute top-[-50%] start-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-[200px] h-[100px] bg-blue-100/50 blur-[40px] rounded-full pointer-events-none" />
                    </div>
                )}

                {/* Mobile Header (Other Pages) */}
                {!isHome && (
                    <div className="flex md:hidden items-center justify-center w-full relative h-12">
                        <div className="absolute start-0 flex items-center gap-0 z-10">
                            <button onClick={onMenuClick} className="h-10 w-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                                <Menu className="h-6 w-6" />
                            </button>
                            <Link href="/" className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-[#102550] hover:bg-blue-50 rounded-full transition-all active:scale-95 hidden sm:flex">
                                <span className="sr-only">الرئيسية</span>
                                <Home className="h-5 w-5" />
                            </Link>
                        </div>
                        <div className="absolute end-0 flex items-center gap-0 z-10">
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-[#102550] hover:bg-blue-50 rounded-full transition-all active:scale-95"
                                aria-label="بحث"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                            <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all active:scale-95">
                                <ChevronRight className="h-6 w-6 rtl:rotate-180" />
                            </button>
                        </div>
                        <div className="px-20 w-full flex justify-center">
                            <Breadcrumbs fallbackTitle={title} />
                        </div>
                    </div>
                )}

                {/* Desktop Header Content */}
                <div className="hidden md:flex items-center gap-4 w-full justify-between">
                    <div className="flex items-center gap-4">
                        <Breadcrumbs fallbackTitle={title} />
                    </div>

                    <div className="flex items-center gap-x-6">
                        <div className="flex items-center gap-2 bg-gray-50/80 rounded-full p-1.5 border border-gray-100">
                            <Tooltip content="الرئيسية" position="bottom">
                                <Link href="/" className="p-2 text-gray-400 hover:text-[#102550] hover:bg-white rounded-full transition-all duration-300 shadow-sm shadow-transparent hover:shadow-gray-200/50 block">
                                    <span className="sr-only">Home</span>
                                    <Home className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Tooltip>

                            <Tooltip content="البحث (Cmd+K)" position="bottom">
                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 text-gray-400 hover:text-[#102550] hover:bg-white rounded-full transition-all duration-300 shadow-sm shadow-transparent hover:shadow-gray-200/50"
                                >
                                    <span className="sr-only">Search</span>
                                    <Search className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </Tooltip>

                            <Tooltip content="دليل الاستخدام" position="bottom">
                                <Link href="/manual" className="p-2 text-gray-400 hover:text-[#102550] hover:bg-white rounded-full transition-all duration-300 shadow-sm shadow-transparent hover:shadow-gray-200/50 block">
                                    <span className="sr-only">دليل الاستخدام</span>
                                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Tooltip>

                            <Tooltip content="الإشعارات" position="bottom">
                                <div className="flex items-center">
                                    <NotificationDropdown />
                                </div>
                            </Tooltip>

                            <Tooltip content="الإعدادات" position="bottom">
                                <Link href="/settings" className="p-2 text-gray-400 hover:text-[#102550] hover:bg-white rounded-full transition-all duration-300 shadow-sm shadow-transparent hover:shadow-gray-200/50 block">
                                    <span className="sr-only">Settings</span>
                                    <Settings className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Tooltip>
                        </div>

                        <div className="hidden lg:block lg:h-8 lg:w-px lg:bg-gray-200/80" aria-hidden="true" />

                        <Link href="/settings" className="flex items-center gap-x-4 cursor-pointer group">
                            <div className="hidden lg:flex lg:flex-col lg:items-end outline-none select-none">
                                <span className="text-sm font-bold leading-tight text-gray-900 group-hover:text-[#102550] transition-colors" aria-hidden="true">{user?.name || "مستخدم"}</span>
                                <span className="text-xs font-semibold text-gray-500 mt-0.5" aria-hidden="true">{roleNameAr}</span>
                            </div>
                            <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#102550]/10 to-[#102550]-hover/10 border border-[#102550]/20 overflow-hidden shadow-inner shadow-white/50 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 group-active:scale-95">
                                <User className="h-5 w-5 text-[#102550]" />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            <GlobalSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
}
