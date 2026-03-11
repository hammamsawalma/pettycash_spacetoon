"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BellRing, Send } from "lucide-react";
import { useState, useEffect, useActionState } from "react";
import { getNotifications, createNotification } from "@/actions/notifications";
import { getProjects } from "@/actions/projects";
import { getEmployees } from "@/actions/employees";
import { Notification } from "@prisma/client";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function SendNotificationPage() {
    const { user } = useAuth();
    const router = useRouter();
    const canSend = useCanDo('notifications', 'send');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { locale } = useLanguage();
    const [target, setTarget] = useState("ALL");
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

    const [state, formAction, isPending] = useActionState(createNotification, null);

    const loadNotifications = () => {
        getNotifications().then(data => {
            setNotifications(data);
            setIsLoading(false);
        });
    };

    // Redirect if not authorized
    useEffect(() => {
        if (user && !canSend) {
            router.push("/");
        }
    }, [user, canSend, router]);

    useEffect(() => {
        if (user && canSend) {
            loadNotifications();
            getProjects().then((data: any[]) => setProjects(data.map(p => ({ id: p.id, name: p.name }))));
            getEmployees().then((data: any[]) => setEmployees(data.map(e => ({ id: e.id, name: e.name }))));
        }
    }, [user, canSend]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (state?.success) {
            toast.success(locale === 'ar' ? "تم إرسال الإشعار بنجاح" : "Notification sent successfully", { id: "notify-toast" });
            loadNotifications(); // Reload list
            (document.getElementById('notification-form') as HTMLFormElement)?.reset();
        } else if (state?.error) {
            toast.error(state.error, { id: "notify-toast" });
        }
    }, [state]);

    if (!user || !canSend) return null;

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + (locale === 'ar' ? " سنة" : "y");
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + (locale === 'ar' ? " شهر" : "mo");
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + (locale === 'ar' ? " يوم" : "d");
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + (locale === 'ar' ? " ساعة" : "h");
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + (locale === 'ar' ? " دقيقة" : "m");
        return Math.floor(seconds) + (locale === 'ar' ? " ثانية" : "s");
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "ارسال اشعارات" : "Send Notifications"}>
            <div className="flex flex-col lg:flex-row gap-6 pb-6">

                {/* Main Form */}
                <Card className="flex-1 p-5 md:p-8 shadow-sm border-gray-100">
                    <form id="notification-form" className="space-y-6 md:space-y-8" action={(formData) => {
                        toast.loading(locale === 'ar' ? "جاري إرسال الإشعار..." : "Sending notification...", { id: "notify-toast" });
                        formAction(formData);
                    }}>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <BellRing className="w-5 h-5 text-[#102550]" />
                                {locale === 'ar' ? 'ارسال اشعار جديد' : 'Send New Notification'}
                            </h3>

                            <div className="space-y-5 md:space-y-6 max-w-2xl">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'عنوان الاشعار' : 'Notification Title'}</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        placeholder={locale === 'ar' ? "مثال: تحديث مهم في النظام..." : "e.g. Important system update..."}
                                        className="w-full rounded-xl border border-gray-200 p-3 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-gray-50 text-sm md:text-base"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'محتوى الاشعار' : 'Notification Content'}</label>
                                    <textarea
                                        name="content"
                                        required
                                        rows={6}
                                        placeholder={locale === 'ar' ? "اكتب رسالتك هنا..." : "Write your message here..."}
                                        className="w-full rounded-xl border border-gray-200 p-3 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] resize-none bg-gray-50 text-sm md:text-base"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs md:text-sm font-bold text-gray-700 block mb-2">{locale === 'ar' ? 'الفئة المستهدفة' : 'Target Audience'}</label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#102550]/50 transition-colors cursor-pointer bg-white">
                                            <input type="radio" name="target" value="ALL" className="w-4 h-4 text-[#102550] focus:ring-[#102550] border-gray-300" checked={target === "ALL"} onChange={() => setTarget("ALL")} />
                                            <span className="text-sm font-medium text-gray-700">{locale === 'ar' ? 'الجميع' : 'Everyone'}</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#102550]/50 transition-colors cursor-pointer bg-white">
                                            <input type="radio" name="target" value="PROJECT" className="w-4 h-4 text-[#102550] focus:ring-[#102550] border-gray-300" checked={target === "PROJECT"} onChange={() => setTarget("PROJECT")} />
                                            <span className="text-sm font-medium text-gray-700">{locale === 'ar' ? 'موظفي مشروع محدد' : 'Specific Project Team'}</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#102550]/50 transition-colors cursor-pointer bg-white">
                                            <input type="radio" name="target" value="SPECIFIC" className="w-4 h-4 text-[#102550] focus:ring-[#102550] border-gray-300" checked={target === "SPECIFIC"} onChange={() => setTarget("SPECIFIC")} />
                                            <span className="text-sm font-medium text-gray-700">{locale === 'ar' ? 'موظفين محددين فقط' : 'Specific Employees Only'}</span>
                                        </label>
                                    </div>

                                    {/* Project selector */}
                                    {target === "PROJECT" && (
                                        <div className="space-y-2 mt-3">
                                            <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'اختر المشروع' : 'Select Project'}</label>
                                            <select name="targetProjectId" required value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-[#102550] text-sm bg-white">
                                                <option value="">{locale === 'ar' ? '— اختر مشروعاً —' : '— Select a project —'}</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {/* Employee multi-select */}
                                    {target === "SPECIFIC" && (
                                        <div className="space-y-2 mt-3">
                                            <label className="text-xs font-bold text-gray-700">{locale === 'ar' ? 'اختر الموظفين' : 'Select Employees'}</label>
                                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-white">
                                                {employees.map(emp => (
                                                    <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                        <input type="checkbox" name="targetEmployeeIds" value={emp.id} checked={selectedEmployeeIds.includes(emp.id)} onChange={e => {
                                                            if (e.target.checked) setSelectedEmployeeIds(prev => [...prev, emp.id]);
                                                            else setSelectedEmployeeIds(prev => prev.filter(id => id !== emp.id));
                                                        }} className="w-4 h-4 rounded accent-[#102550]" />
                                                        <span className="text-sm font-medium text-gray-700">{emp.name}</span>
                                                    </label>
                                                ))}
                                                {employees.length === 0 && <p className="text-xs text-gray-400 text-center py-2">{locale === 'ar' ? 'لا يوجد موظفين' : 'No employees'}</p>}
                                            </div>
                                            {selectedEmployeeIds.length > 0 && <p className="text-xs text-gray-500">{locale === 'ar' ? `تم اختيار ${selectedEmployeeIds.length} موظف` : `${selectedEmployeeIds.length} employee(s) selected`}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="px-8 py-3 rounded-xl font-bold shadow-sm w-full sm:w-auto text-sm">
                                {locale === 'ar' ? 'إرسال الأشعار' : 'Send Notification'}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Recent Notifications Sidebar */}
                <div className="w-full lg:w-96 space-y-4 md:space-y-6">
                    <Card className="p-5 md:p-6 shadow-sm border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base">{locale === 'ar' ? 'الاشعارات المرسلة مؤخراً' : 'Recently Sent Notifications'}</h3>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-sm text-gray-500 text-center">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                            ) : notifications.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center bg-gray-50 rounded-xl p-4">{locale === 'ar' ? 'لا توجد إشعارات مسجلة.' : 'No notifications recorded.'}</p>
                            ) : notifications.slice(0, 5).map(notification => (
                                <div key={notification.id} className="p-3 md:p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white transition-colors">
                                    <h4 className="font-bold text-gray-900 text-xs md:text-sm">{notification.title}</h4>
                                    <p className="text-[11px] md:text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                        {notification.content}
                                    </p>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100/50">
                                        <span className="text-[10px] text-gray-400 font-medium">{locale === 'ar' ? 'منذ' : ''} {timeAgo(notification.createdAt)} {locale !== 'ar' ? 'ago' : ''}</span>
                                        <span className="text-[10px] bg-blue-50 text-[#102550] px-2.5 py-1 rounded-lg font-bold">
                                            {notification.targetRole === 'ALL' ? (locale === 'ar' ? 'الجميع' : 'Everyone') : notification.targetRole || (locale === 'ar' ? 'غير محدد' : 'Unspecified')}
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
