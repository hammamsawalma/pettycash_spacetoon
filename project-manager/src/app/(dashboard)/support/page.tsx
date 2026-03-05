"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HeadphonesIcon, Ticket, MessageCircle, AlertCircle, FileText } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { createSupportTicket } from "@/actions/communications";
import toast from "react-hot-toast";

export default function SupportPage() {
    const [state, formAction, isPending] = useActionState(createSupportTicket, null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
        }
        if (state?.success) {
            toast.success("تم إرسال تذكرتك بنجاح، سيتم التواصل معك قريباً.");
            formRef.current?.reset();
        }
    }, [state]);

    return (
        <DashboardLayout title="الدعم الفني">
            <div className="space-y-6 md:space-y-8 pb-6 w-full max-w-6xl mx-auto">

                {/* Hero / Header Card */}
                <Card className="p-6 md:p-8 bg-gradient-to-r from-purple-50 to-white border-2 border-purple-50 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right rounded-2xl shadow-sm">
                    <div className="order-2 md:order-1 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">كيف يمكننا مساعدتك اليوم؟</h2>
                        <p className="text-xs md:text-sm text-gray-600 max-w-2xl leading-relaxed font-medium">فريق الدعم الفني متواجد للإجابة على جميع استفساراتك وحل المشاكل التقنية التي قد تواجهها أثناء استخدام النظام.</p>
                    </div>
                    <div className="order-1 md:order-2 w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-4 border-purple-100 shadow-sm flex items-center justify-center text-[#7F56D9] shrink-0">
                        <HeadphonesIcon className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Ticket Form */}
                    <Card className="lg:col-span-2 p-5 md:p-8 shadow-sm border-gray-100 rounded-2xl">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-50 pb-5">
                            <span className="p-2 bg-purple-50 text-[#7F56D9] rounded-lg">
                                <Ticket className="w-5 h-5 md:w-6 md:h-6" />
                            </span>
                            فتح تذكرة دعم فني جديدة
                        </h3>

                        <form ref={formRef} className="space-y-6" action={formAction}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">نوع المشكلة</label>
                                    <select name="type" className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white text-gray-900 text-xs md:text-sm font-bold shadow-sm">
                                        <option>مشكلة في تسجيل الدخول / الصلاحيات</option>
                                        <option>مشكلة في الفواتير أو الماليّات</option>
                                        <option>مشكلة في إدارة المشاريع</option>
                                        <option>اقتراح / تحسين</option>
                                        <option>أخرى</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">أولوية التذكرة</label>
                                    <select name="priority" className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white text-gray-900 text-xs md:text-sm font-bold shadow-sm">
                                        <option>عادية</option>
                                        <option>متوسطة</option>
                                        <option>عاجلة (حرجة)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-gray-700">عنوان التذكرة</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="اكتب عنواناً يصف المشكلة باختصار..."
                                    className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] bg-white text-xs md:text-sm font-bold shadow-sm placeholder:font-normal placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-gray-700">وصف المشكلة تفصيلياً</label>
                                <textarea
                                    name="description"
                                    rows={5}
                                    placeholder="يرجى كتابة كافة التفاصيل التي تساعدنا في حل مشكلتك..."
                                    className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#7F56D9] resize-none bg-white text-xs md:text-sm font-bold shadow-sm placeholder:font-normal placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm w-full sm:w-auto">
                                    إرسال التذكرة
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Support Channels Sidebar */}
                    <div className="space-y-4 md:space-y-6">
                        <Card className="p-5 md:p-6 text-center space-y-4 border-gray-100 hover:border-[#7F56D9]/50 transition-colors cursor-pointer group shadow-sm rounded-2xl">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-50 rounded-full flex items-center justify-center text-[#7F56D9] mx-auto group-hover:scale-105 transition-transform duration-300 shadow-inner">
                                <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm md:text-base mb-1">المحادثة المباشرة</h4>
                                <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">تحدث مع أحد ممثلي خدمة العملاء بشكل مباشر الآن.</p>
                            </div>
                            <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 text-xs md:text-sm h-11 md:h-12 font-bold" onClick={() => alert("بدء المحادثة المباشرة...")}>بدء محادثة</Button>
                        </Card>

                        <Card className="p-5 md:p-6 text-center space-y-4 border-gray-100 hover:border-gray-300 transition-colors cursor-pointer shadow-sm rounded-2xl group">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 mx-auto group-hover:scale-105 transition-transform duration-300 border border-gray-100">
                                <FileText className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm md:text-base mb-1">دليل المستخدم</h4>
                                <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">تصفح الأسئلة الشائعة والمقالات التعليمية حول النظام.</p>
                            </div>
                            <Button variant="secondary" className="w-full text-xs md:text-sm h-11 md:h-12 font-bold text-gray-700 bg-gray-100 border-transparent hover:bg-gray-200" onClick={() => alert("جارٍ فتح الدليل...")}>تصفح الدليل</Button>
                        </Card>

                        <Card className="p-5 border-l-4 border-l-yellow-400 bg-gradient-to-l from-white to-yellow-50/50 shadow-sm rounded-2xl border border-gray-100">
                            <div className="flex gap-4 items-start">
                                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-xs md:text-sm mb-1.5">أوقات العمل</h4>
                                    <p className="text-[10px] md:text-[11px] text-gray-600 leading-relaxed font-bold">فريق الدعم متاح من السبت إلى الخميس، من الساعة 9 صباحاً حتى 6 مساءً بتوقيت مكة المكرمة.</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
