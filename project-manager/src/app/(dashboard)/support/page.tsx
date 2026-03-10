"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HeadphonesIcon, Ticket, MessageCircle, AlertCircle, FileText, Send, X, ArrowRight } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { createSupportTicket, getSupportMessages, sendSupportMessage } from "@/actions/communications";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

type SupportMessage = {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    sender: { id: string; name: string; role: string; image: string | null };
    receiver: { id: string; name: string; role: string; image: string | null } | null;
};

export default function SupportPage() {
    const { user } = useAuth();
    const [state, formAction, isPending] = useActionState(createSupportTicket, null);
    const formRef = useRef<HTMLFormElement>(null);

    // ─── Live Chat State ─────────────────────────────────────────────
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
        }
        if (state?.success) {
            toast.success("تم إرسال تذكرتك بنجاح، سيتم التواصل معك قريباً.");
            formRef.current?.reset();
        }
    }, [state]);

    // Scroll chat to bottom
    const scrollChatToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Load messages
    const loadMessages = useCallback(async () => {
        const msgs = await getSupportMessages();
        setChatMessages(msgs as SupportMessage[]);
        setTimeout(scrollChatToBottom, 100);
    }, [scrollChatToBottom]);

    // Open chat + start polling
    const openChat = useCallback(async () => {
        setIsChatOpen(true);
        setIsChatLoading(true);
        await loadMessages();
        setIsChatLoading(false);

        // Poll every 5 seconds
        pollRef.current = setInterval(async () => {
            const msgs = await getSupportMessages();
            setChatMessages(msgs as SupportMessage[]);
        }, 5000);
    }, [loadMessages]);

    // Close chat + stop polling
    const closeChat = useCallback(() => {
        setIsChatOpen(false);
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    // Send message
    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isSending) return;

        setIsSending(true);
        const res = await sendSupportMessage(chatInput.trim());
        setIsSending(false);

        if (res.error) {
            toast.error(res.error);
            return;
        }

        if (res.message) {
            setChatMessages(prev => [...prev, res.message as SupportMessage]);
            setChatInput("");
            setTimeout(scrollChatToBottom, 50);
        }
    };

    return (
        <DashboardLayout title="الدعم الفني">
            <div className="space-y-6 md:space-y-8 pb-6 w-full max-w-6xl mx-auto">

                {/* Hero / Header Card */}
                <Card className="p-6 md:p-8 bg-gradient-to-r from-blue-50 to-white border-2 border-blue-50 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right rounded-2xl shadow-sm">
                    <div className="order-2 md:order-1 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">كيف يمكننا مساعدتك اليوم؟</h2>
                        <p className="text-xs md:text-sm text-gray-600 max-w-2xl leading-relaxed font-medium">فريق الدعم الفني متواجد للإجابة على جميع استفساراتك وحل المشاكل التقنية التي قد تواجهها أثناء استخدام النظام.</p>
                    </div>
                    <div className="order-1 md:order-2 w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-4 border-blue-100 shadow-sm flex items-center justify-center text-[#102550] shrink-0">
                        <HeadphonesIcon className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Ticket Form */}
                    <Card className="lg:col-span-2 p-5 md:p-8 shadow-sm border-gray-100 rounded-2xl">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-50 pb-5">
                            <span className="p-2 bg-blue-50 text-[#102550] rounded-lg">
                                <Ticket className="w-5 h-5 md:w-6 md:h-6" />
                            </span>
                            فتح تذكرة دعم فني جديدة
                        </h3>

                        <form ref={formRef} className="space-y-6" action={formAction}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">نوع المشكلة</label>
                                    <select name="type" className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-900 text-xs md:text-sm font-bold shadow-sm">
                                        <option>مشكلة في تسجيل الدخول / الصلاحيات</option>
                                        <option>مشكلة في الفواتير أو الماليّات</option>
                                        <option>مشكلة في إدارة المشاريع</option>
                                        <option>اقتراح / تحسين</option>
                                        <option>أخرى</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">أولوية التذكرة</label>
                                    <select name="priority" className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-900 text-xs md:text-sm font-bold shadow-sm">
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
                                    className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-xs md:text-sm font-bold shadow-sm placeholder:font-normal placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-gray-700">وصف المشكلة تفصيلياً</label>
                                <textarea
                                    name="description"
                                    rows={5}
                                    placeholder="يرجى كتابة كافة التفاصيل التي تساعدنا في حل مشكلتك..."
                                    className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] resize-none bg-white text-xs md:text-sm font-bold shadow-sm placeholder:font-normal placeholder:text-gray-400"
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
                        {/* Live Chat Card */}
                        <Card className="p-5 md:p-6 text-center space-y-4 border-gray-100 hover:border-[#102550]/50 transition-colors cursor-pointer group shadow-sm rounded-2xl">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#102550] mx-auto group-hover:scale-105 transition-transform duration-300 shadow-inner">
                                <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm md:text-base mb-1">المحادثة المباشرة</h4>
                                <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">تحدث مع أحد ممثلي خدمة العملاء بشكل مباشر الآن.</p>
                            </div>
                            <Button
                                variant="primary"
                                className="w-full text-xs md:text-sm h-11 md:h-12 font-bold bg-[#102550] hover:bg-blue-800"
                                onClick={openChat}
                            >
                                💬 بدء محادثة
                            </Button>
                        </Card>

                        <Card className="p-5 md:p-6 text-center space-y-4 border-gray-100 hover:border-gray-300 transition-colors cursor-pointer shadow-sm rounded-2xl group">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 mx-auto group-hover:scale-105 transition-transform duration-300 border border-gray-100">
                                <FileText className="w-6 h-6 md:w-7 md:h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm md:text-base mb-1">دليل المستخدم</h4>
                                <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">تصفح الأسئلة الشائعة والمقالات التعليمية حول النظام.</p>
                            </div>
                            <Button variant="secondary" className="w-full text-xs md:text-sm h-11 md:h-12 font-bold text-gray-700 bg-gray-100 border-transparent hover:bg-gray-200" onClick={() => window.open("/manual", "_blank")}>تصفح الدليل</Button>
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

            {/* ═══════════ LIVE CHAT PANEL (Slide-up overlay) ═══════════ */}
            {isChatOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/30 backdrop-blur-sm" onClick={closeChat}>
                    <div
                        className="w-full sm:w-[28rem] h-[85vh] sm:h-[70vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-[#102550] to-blue-700 text-white px-5 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <HeadphonesIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">الدعم الفني</h3>
                                    <p className="text-[10px] text-blue-200">محادثة مباشرة مع فريق الدعم</p>
                                </div>
                            </div>
                            <button onClick={closeChat} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50" dir="rtl">
                            {isChatLoading ? (
                                <div className="flex-1 flex items-center justify-center py-20">
                                    <div className="text-center text-gray-400">
                                        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-sm font-medium">جاري تحميل المحادثة...</p>
                                    </div>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                        <MessageCircle className="w-8 h-8 text-blue-300" />
                                    </div>
                                    <p className="font-bold text-gray-700 text-sm">مرحباً بك!</p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-[220px]">اكتب رسالتك وسنقوم بالرد عليك في أقرب وقت ممكن.</p>
                                </div>
                            ) : (
                                chatMessages.map(msg => {
                                    const isMine = msg.senderId === user?.id;
                                    const time = new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isMine
                                                    ? 'bg-[#102550] text-white rounded-br-sm'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                                }`}>
                                                {!isMine && (
                                                    <p className="text-[10px] text-blue-600 font-bold mb-1">
                                                        {msg.sender.name} — {msg.sender.role === 'ADMIN' ? 'مدير النظام' : 'الدعم'}
                                                    </p>
                                                )}
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <p className={`text-[10px] mt-1.5 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>{time}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendChat} className="border-t border-gray-100 bg-white p-3 flex items-center gap-2 shrink-0" dir="rtl">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="اكتب رسالتك هنا..."
                                className="flex-1 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 text-sm border-none"
                                autoFocus
                                maxLength={2000}
                            />
                            <button
                                type="submit"
                                disabled={!chatInput.trim() || isSending}
                                className="w-11 h-11 bg-[#102550] hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center transition-colors shrink-0"
                            >
                                {isSending ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 -scale-x-100" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
