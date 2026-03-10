"use client"
import { formatDateAr } from "@/lib/format-utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HeadphonesIcon, MessageCircle, Send, ArrowRight, Users, Clock, Inbox } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { getSupportConversations, getSupportMessages, sendSupportMessage } from "@/actions/communications";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Conversation = {
    userId: string;
    userName: string;
    userRole: string;
    userImage: string | null;
    userJobTitle: string | null;
    lastMessage: string;
    lastMessageAt: Date;
    lastMessageByAdmin: boolean;
    unreadCount: number;
    totalMessages: number;
};

type SupportMessage = {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    sender: { id: string; name: string; role: string; image: string | null };
    receiver: { id: string; name: string; role: string; image: string | null } | null;
};

export default function AdminSupportPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // RBAC: Only ADMIN
    useEffect(() => {
        if (user && user.role !== "ADMIN") {
            router.push("/support");
        }
    }, [user, router]);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Load conversations
    const loadConversations = useCallback(async () => {
        const data = await getSupportConversations();
        setConversations(data as Conversation[]);
    }, []);

    // Initial load
    useEffect(() => {
        loadConversations().then(() => setIsLoadingConversations(false));

        // Poll conversations list every 10s
        const interval = setInterval(loadConversations, 10000);
        return () => clearInterval(interval);
    }, [loadConversations]);

    // Load messages for active conversation
    const selectConversation = useCallback(async (userId: string) => {
        setActiveUserId(userId);
        setIsLoadingMessages(true);

        const msgs = await getSupportMessages(userId);
        setMessages(msgs as SupportMessage[]);
        setIsLoadingMessages(false);
        setTimeout(scrollToBottom, 100);

        // Stop previous poll
        if (pollRef.current) clearInterval(pollRef.current);

        // Start polling messages every 5s
        pollRef.current = setInterval(async () => {
            const fresh = await getSupportMessages(userId);
            setMessages(fresh as SupportMessage[]);
        }, 5000);
    }, [scrollToBottom]);

    // Cleanup polls on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    // Send reply
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeUserId || isSending) return;

        setIsSending(true);
        const res = await sendSupportMessage(inputValue.trim(), activeUserId);
        setIsSending(false);

        if (res.error) {
            toast.error(res.error);
            return;
        }

        if (res.message) {
            setMessages(prev => [...prev, res.message as SupportMessage]);
            setInputValue("");
            setTimeout(scrollToBottom, 50);
        }
    };

    const activeConversation = conversations.find(c => c.userId === activeUserId);

    if (!user || user.role !== "ADMIN") return null;

    return (
        <DashboardLayout title="محادثات الدعم الفني">
            <Card className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-2xl shadow-sm border-gray-100">

                {/* ─── Conversations List ─── */}
                <div className={`${activeUserId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-l border-gray-100 flex-col bg-white shrink-0`}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-[#102550]">
                            <HeadphonesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-gray-900">محادثات الدعم</h3>
                            <p className="text-[10px] text-gray-400">{conversations.length} محادثة</p>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="p-8 text-center text-gray-400 text-sm">جاري التحميل...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center">
                                <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">لا توجد محادثات دعم حالياً</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.userId}
                                    onClick={() => selectConversation(conv.userId)}
                                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors border-l-4 ${activeUserId === conv.userId
                                        ? 'bg-blue-50 border-[#102550]'
                                        : 'border-transparent hover:bg-gray-50'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#102550] font-bold text-sm">
                                            {conv.userName.charAt(0)}
                                        </div>
                                        {conv.unreadCount > 0 && !conv.lastMessageByAdmin && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <p className="text-sm font-bold text-gray-900 truncate">{conv.userName}</p>
                                            <span className="text-[10px] text-gray-400 shrink-0 mr-2">
                                                {formatDateAr(new Date(conv.lastMessageAt), { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {conv.lastMessageByAdmin ? '← أنت: ' : ''}{conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ─── Chat Area ─── */}
                <div className={`${activeUserId ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#F9FAFB] relative w-full`}>
                    {/* Chat Header */}
                    <div className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setActiveUserId(null); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }} className="md:hidden p-2 -mr-2 text-gray-400 hover:text-[#102550]">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            {activeConversation ? (
                                <>
                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#102550] font-bold text-sm">
                                        {activeConversation.userName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900">{activeConversation.userName}</h3>
                                        <p className="text-[10px] text-gray-400">{activeConversation.userJobTitle || activeConversation.userRole} • {activeConversation.totalMessages} رسالة</p>
                                    </div>
                                </>
                            ) : (
                                <h3 className="text-sm text-gray-400 font-medium">اختر محادثة من القائمة</h3>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3" dir="rtl">
                        {!activeUserId ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-gray-400">
                                <Users className="w-12 h-12 mb-3 opacity-30" />
                                <p className="font-bold text-sm">اختر محادثة للبدء</p>
                                <p className="text-xs mt-1">المحادثات مرتبة حسب آخر رسالة</p>
                            </div>
                        ) : isLoadingMessages ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                                <p className="font-bold text-sm">لا توجد رسائل في هذه المحادثة</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isAdmin = msg.sender.role === "ADMIN";
                                const time = new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isAdmin
                                            ? 'bg-[#102550] text-white rounded-br-sm'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                            }`}>
                                            {!isAdmin && (
                                                <p className="text-[10px] text-blue-600 font-bold mb-1">{msg.sender.name}</p>
                                            )}
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            <p className={`text-[10px] mt-1.5 ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {time} {isAdmin && '✓'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Reply Input */}
                    {activeUserId && (
                        <form onSubmit={handleSend} className="border-t border-gray-100 bg-white p-3 flex items-center gap-2 shrink-0" dir="rtl">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder={`الرد على ${activeConversation?.userName || ''}...`}
                                className="flex-1 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 text-sm border-none"
                                maxLength={2000}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isSending}
                                className="w-11 h-11 bg-[#102550] hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center transition-colors shrink-0"
                            >
                                {isSending ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 -scale-x-100" />
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </Card>
        </DashboardLayout>
    );
}
