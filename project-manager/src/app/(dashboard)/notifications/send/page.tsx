"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BellRing, Send } from "lucide-react";
import { useState, useEffect, useActionState } from "react";
import { getNotifications, createNotification } from "@/actions/notifications";
import { Notification } from "@prisma/client";
import toast from "react-hot-toast";

export default function SendNotificationPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [state, formAction, isPending] = useActionState(createNotification, null);

    const loadNotifications = () => {
        getNotifications().then(data => {
            setNotifications(data);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    useEffect(() => {
        if (state?.success) {
            toast.success("تم إرسال الإشعار بنجاح", { id: "notify-toast" });
            loadNotifications(); // Reload list
            (document.getElementById('notification-form') as HTMLFormElement)?.reset();
        } else if (state?.error) {
            toast.error(state.error, { id: "notify-toast" });
        }
    }, [state]);

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " سنة";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " شهر";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " يوم";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " ساعة";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " دقيقة";
        return Math.floor(seconds) + " ثانية";
    };

    return (
        <DashboardLayout title="ارسال اشعارات">
            <div className="flex flex-col lg:flex-row gap-6 pb-6">

                {/* Main Form */}
                <Card className="flex-1 p-5 md:p-8 shadow-sm border-gray-100">
                    <form id="notification-form" className="space-y-6 md:space-y-8" action={(formData) => {
                        toast.loading("جاري إرسال الإشعار...", { id: "notify-toast" });
                        formAction(formData);
                    }}>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <BellRing className="w-5 h-5 text-[#102550]" />
                                ارسال اشعار جديد
                            </h3>

                            <div className="space-y-5 md:space-y-6 max-w-2xl">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">عنوان الاشعار</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        placeholder="مثال: تحديث مهم في النظام..."
                                        className="w-full rounded-xl border border-gray-200 p-3 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-gray-50 text-sm md:text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">محتوى الاشعار</label>
                                    <textarea
                                        name="content"
                                        required
                                        rows={6}
                                        placeholder="اكتب رسالتك هنا..."
                                        className="w-full rounded-xl border border-gray-200 p-3 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] resize-none bg-gray-50 text-sm md:text-base"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs md:text-sm font-bold text-gray-700 block mb-2">الفئة المستهدفة</label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#102550]/50 transition-colors cursor-pointer bg-white">
                                            <input type="radio" name="target" value="ALL" className="w-4 h-4 text-[#102550] focus:ring-[#102550] border-gray-300" defaultChecked />
                                            <span className="text-sm font-medium text-gray-700">الجميع</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#102550]/50 transition-colors cursor-pointer bg-white opacity-50">
                                            <input type="radio" name="target" value="PROJECT" disabled className="w-4 h-4 text-[#102550] focus:ring-[#102550] border-gray-300" />
                                            <span className="text-sm font-medium text-gray-700">موظفي مشروع محدد (قريباً)</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#102550]/50 transition-colors cursor-pointer bg-white opacity-50">
                                            <input type="radio" name="target" value="SPECIFIC" disabled className="w-4 h-4 text-[#102550] focus:ring-[#102550] border-gray-300" />
                                            <span className="text-sm font-medium text-gray-700">موظفين محددين فقط (قريباً)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="px-8 py-3 rounded-xl font-bold shadow-sm w-full sm:w-auto text-sm">
                                إرسال الأشعار
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Recent Notifications Sidebar */}
                <div className="w-full lg:w-96 space-y-4 md:space-y-6">
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base">الاشعارات المرسلة مؤخراً</h3>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-sm text-gray-500 text-center">جاري التحميل...</p>
                            ) : notifications.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center bg-gray-50 rounded-xl p-4">لا توجد إشعارات مسجلة.</p>
                            ) : notifications.slice(0, 5).map(notification => (
                                <div key={notification.id} className="p-3 md:p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors">
                                    <h4 className="font-bold text-gray-900 text-xs md:text-sm">{notification.title}</h4>
                                    <p className="text-[11px] md:text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                        {notification.content}
                                    </p>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100/50">
                                        <span className="text-[10px] text-gray-400 font-medium">منذ {timeAgo(notification.createdAt)}</span>
                                        <span className="text-[10px] bg-blue-50 text-[#102550] px-2.5 py-1 rounded-lg font-bold">
                                            {notification.targetRole === 'ALL' ? 'الجميع' : notification.targetRole || 'غير محدد'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

            </div>
        </DashboardLayout>
    );
}
