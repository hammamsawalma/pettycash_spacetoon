"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Bell, AlertCircle, Info, Bookmark, Ticket } from "lucide-react";
import { useState, useEffect } from "react";
import { getNotifications } from "@/actions/notifications";
import { Notification } from "@prisma/client";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getNotifications().then(data => {
            setNotifications(data);
            setIsLoading(false);
        });
    }, []);

    const getIcon = (title: string) => {
        if (title.includes("دعم فني") || title.includes("تذكرة")) return <Ticket className="w-5 h-5 text-orange-500" />;
        if (title.includes("عاجل") || title.includes("تحذير")) return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (title.includes("فاتورة") || title.includes("مشروع")) return <Bookmark className="w-5 h-5 text-blue-500" />;
        return <Info className="w-5 h-5 text-[#102550]" />;
    };

    const getBgColor = (title: string) => {
        if (title.includes("دعم فني") || title.includes("تذكرة")) return "bg-orange-50";
        if (title.includes("عاجل") || title.includes("تحذير")) return "bg-red-50";
        if (title.includes("فاتورة") || title.includes("مشروع")) return "bg-blue-50";
        return "bg-blue-50";
    };

    return (
        <DashboardLayout title="الإشعارات">
            <div className="space-y-6 md:space-y-8 pb-6 w-full max-w-4xl mx-auto">
                <Card className="p-0 overflow-hidden shadow-sm border-gray-100 rounded-2xl">
                    <div className="p-5 md:p-6 border-b border-gray-100/50 bg-gray-50/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#102550] flex items-center justify-center shrink-0">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1">صندوق الإشعارات</h3>
                            <p className="text-xs text-gray-500">آخر التنبيهات والأحداث الخاصة بالنظام والمشاريع.</p>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {isLoading ? (
                            /* Skeleton loading rows */
                            <div className="divide-y divide-gray-100 animate-pulse">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="p-5 md:p-6 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                                        <div className="flex-1 space-y-2 pt-1">
                                            <div className="h-3.5 bg-gray-100 rounded-lg w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded-lg w-full" />
                                            <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 pl-12 text-center text-gray-500 flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                    <Bell className="w-8 h-8" />
                                </div>
                                <p className="font-bold">لا توجد إشعارات حالياً</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div key={notif.id} className="p-5 md:p-6 hover:bg-gray-50/50 transition-colors flex items-start gap-4">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${getBgColor(notif.title)}`}>
                                        {getIcon(notif.title)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-baseline mb-1 gap-1">
                                            <h4 className="font-bold text-gray-900 text-sm md:text-base">{notif.title}</h4>
                                            <span className="text-[10px] md:text-xs text-gray-400 font-medium whitespace-nowrap">
                                                {new Date(notif.createdAt).toLocaleDateString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs md:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {notif.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
