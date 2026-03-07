"use client";

import { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, Info, Bookmark, Ticket, ChevronLeft } from 'lucide-react';
import { getNotifications } from '@/actions/notifications';
import { Notification } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface NotificationDropdownProps {
    isMobile?: boolean;
}

export function NotificationDropdown({ isMobile = false }: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && notifications.length === 0 && isLoading) {
            getNotifications().then(data => {
                setNotifications(data.slice(0, 5));
                setIsLoading(false);
            });
        }
    }, [isOpen, notifications.length, isLoading]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getIcon = (title: string) => {
        if (title.includes("دعم فني") || title.includes("تذكرة")) return <Ticket className="w-4 h-4 text-orange-500" />;
        if (title.includes("عاجل") || title.includes("تحذير")) return <AlertCircle className="w-4 h-4 text-red-500" />;
        if (title.includes("فاتورة") || title.includes("مشروع")) return <Bookmark className="w-4 h-4 text-blue-500" />;
        return <Info className="w-4 h-4 text-[#102550]" />;
    };

    const getBgColor = (title: string) => {
        if (title.includes("دعم فني") || title.includes("تذكرة")) return "bg-orange-50";
        if (title.includes("عاجل") || title.includes("تحذير")) return "bg-red-50";
        if (title.includes("فاتورة") || title.includes("مشروع")) return "bg-blue-50";
        return "bg-blue-50";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={isMobile
                    ? "h-10 w-10 flex items-center justify-center rounded-full bg-white text-[#102550] shadow-sm relative"
                    : "p-2 text-gray-400 hover:text-[#102550] hover:bg-white rounded-full transition-all duration-300 shadow-sm shadow-transparent hover:shadow-gray-200/50 relative cursor-pointer outline-none"
                }
            >
                <span className="sr-only">View notifications</span>
                {/* Always show ping for demo purposes */}
                <span className={isMobile
                    ? "absolute top-2 start-2 flex h-2.5 w-2.5"
                    : "absolute top-1.5 start-1.5 flex h-2 w-2"
                }>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-full w-full bg-red-500"></span>
                </span>
                <Bell className="h-5 w-5" aria-hidden="true" />
            </button>

            {isOpen && (
                <div className={`absolute ${isMobile ? 'start-[-10px] sm:start-0' : 'start-auto sm:end-0'} mt-2 w-[300px] sm:w-80 md:w-96 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/80 overflow-hidden z-[100] transform origin-top transition-all animate-in fade-in zoom-in-95 duration-200`}>
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">الإشعارات</h3>
                            <span className="bg-[#102550]/10 text-[#102550] text-[10px] font-bold px-2 py-0.5 rounded-full">الجديدة</span>
                        </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto overscroll-contain bg-white">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                جاري تحميل الإشعارات...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">لا توجد إشعارات حالياً</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => {
                                            setIsOpen(false);
                                            router.push('/notifications');
                                        }}
                                        className="p-3 hover:bg-gray-50 transition-colors flex items-start gap-3 cursor-pointer group"
                                    >
                                        <div className={`w-9 h-9 mt-0.5 rounded-full flex items-center justify-center shrink-0 border border-white shadow-sm transition-transform group-hover:scale-105 ${getBgColor(notif.title)}`}>
                                            {getIcon(notif.title)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{notif.title}</h4>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5 font-medium">
                                                    {new Date(notif.createdAt).toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                {notif.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-50 bg-white">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/notifications');
                            }}
                            className="w-full py-2.5 text-sm font-bold text-[#102550] hover:text-[#1a3a7c] hover:bg-[#102550]/5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <span>عرض كل الإشعارات</span>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
