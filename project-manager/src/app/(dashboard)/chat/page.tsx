"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Search, Send, Paperclip, MoreVertical, FolderKanban, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getMessages, sendMessage } from "@/actions/communications";
import { getProjects } from "@/actions/projects";
import { useAuth } from "@/context/AuthContext";
import { Message, User, Project } from "@prisma/client";

type MessageWithRelations = Message & {
    sender: User;
    receiver: User;
};

export default function ChatPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<MessageWithRelations[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeChat, setActiveChat] = useState<{ type: 'project', data: Project } | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const loadChatData = async () => {
            // v5: Only load project messages — no employees needed
            const [msgsData, projectsData] = await Promise.all([
                getMessages(),
                getProjects()
            ]);

            const sortedData = (msgsData as MessageWithRelations[]).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            setMessages(sortedData);
            setProjects(projectsData as Project[]);

            setIsLoading(false);
            setTimeout(scrollToBottom, 100);
        };
        loadChatData();
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeChat]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeChat) return;

        // v5: Only project chats
        const projectId = activeChat.data.id;

        const res = await sendMessage(inputValue, undefined, projectId);

        if (res.error) {
            console.error(res.error);
            return;
        }

        if (res.message) {
            setMessages(prev => [...prev, res.message as MessageWithRelations]);
            setInputValue("");
            setTimeout(scrollToBottom, 50);
        }
    };

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter messages for active project chat
    const activeMessages = activeChat
        ? messages.filter(m => m.projectId === activeChat.data.id)
        : [];

    return (
        <DashboardLayout title="شات المشاريع">
            <Card className="flex h-[calc(100vh-10rem)] overflow-hidden">

                {/* Chat Sidebar — Project Groups Only */}
                <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-l border-gray-100 flex-col bg-white shrink-0`}>
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ابحث في المشاريع..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-[#102550] border-transparent text-sm"
                            />
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="px-4 py-3 uppercase text-xs font-bold text-gray-400 tracking-wider">شات المشاريع</div>
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-500 text-sm">جاري التحميل...</div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">لا توجد مشاريع متاحة.</div>
                        ) : filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => setActiveChat({ type: 'project', data: project })}
                                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors border-l-4 ${activeChat?.data.id === project.id ? 'bg-blue-50 border-[#102550]' : 'border-transparent hover:bg-gray-50'}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#d97706]"><FolderKanban className="w-5 h-5" /></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <p className={`text-sm font-semibold truncate ${activeChat?.data.id === project.id ? 'text-[#102550]' : 'text-gray-900'}`}>{project.name}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate font-medium">مجموعة المشروع</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#F9FAFB] relative main-chat w-full`}>
                    {/* Chat Header */}
                    <div className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 shrink-0 z-10 w-full">
                        <div className="flex items-center gap-2 md:gap-3">
                            <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -mr-2 text-gray-400 hover:text-[#102550] transition-colors rounded-lg">
                                <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#d97706] font-bold text-lg md:text-xl">
                                <FolderKanban className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{activeChat ? activeChat.data.name : "اختر مشروع"}</h3>
                                <p className="text-xs text-gray-500">{activeChat ? 'مجموعة نقاش المشروع' : "---"}</p>
                            </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">

                        <div className="flex justify-center mb-4">
                            <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-medium">الرسائل</span>
                        </div>

                        {!activeChat ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <FolderKanban className="w-12 h-12 mb-3 opacity-30" />
                                <p className="font-bold">اختر مشروعاً من القائمة للبدء</p>
                                <p className="text-sm mt-1">المحادثات متاحة فقط ضمن المشاريع</p>
                            </div>
                        ) : activeMessages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <p className="font-bold">لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                            </div>
                        ) : (
                            activeMessages.map((msg) => {
                                const isMine = msg.senderId === user?.id;
                                const timeStr = new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 max-w-lg ${isMine ? 'mr-auto flex-row-reverse' : ''}`} dir={isMine ? 'ltr' : 'rtl'}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${isMine ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {msg.sender?.name ? msg.sender.name.charAt(0) : "👤"}
                                        </div>
                                        <div className={`p-4 rounded-2xl shadow-sm border ${isMine ? 'bg-[#102550] text-white rounded-bl-sm border-transparent' : 'bg-white text-gray-700 rounded-br-sm border-gray-100'}`} dir="rtl">
                                            {!isMine && <p className="text-xs text-[#102550] font-bold mb-1">{msg.sender?.name}</p>}

                                            <p className={`text-sm leading-relaxed ${isMine ? 'text-white' : 'text-gray-700'}`}>
                                                {msg.content}
                                            </p>

                                            <p className={`text-[10px] mt-2 ${isMine ? 'text-blue-200 text-left' : 'text-gray-400 text-right'}`}>
                                                {timeStr}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form className="p-4 bg-white border-t border-gray-100 shrink-0" onSubmit={handleSendMessage}>
                        <div className="flex items-center gap-2">
                            <button type="button" className="p-3 text-gray-400 hover:text-[#102550] hover:bg-gray-50 rounded-xl transition-colors shrink-0">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                placeholder="اكتب رسالتك هنا..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                            />
                            <Button type="submit" variant="primary" className="h-12 w-12 rounded-xl p-0 flex items-center justify-center bg-[#102550] hover:bg-blue-700 shrink-0" disabled={!inputValue.trim() || !activeChat}>
                                <Send className="w-5 h-5 -scale-x-100 ml-1" />
                            </Button>
                        </div>
                    </form>
                </div>

            </Card>
        </DashboardLayout>
    );
}
