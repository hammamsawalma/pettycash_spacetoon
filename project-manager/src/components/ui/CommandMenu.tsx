"use client";

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, FolderKanban, Users, FileText, Settings, LayoutDashboard } from "lucide-react";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            <Command
                className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white/80 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/60"
                label="Command Menu"
            >
                <div className="flex items-center border-b border-gray-100/50 px-4">
                    <Search className="h-5 w-5 text-gray-400 shrink-0" />
                    <Command.Input
                        autoFocus
                        placeholder="ابحث عن مشاريع، موظفين، صفحات..."
                        className="flex-1 border-0 bg-transparent py-5 pl-2 pr-4 text-base outline-none placeholder:text-gray-400"
                    />
                    <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 font-mono text-[10px] font-medium text-gray-500">
                        ESC
                    </kbd>
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                    <Command.Empty className="py-10 text-center text-sm text-gray-500">
                        لا توجد نتائج مطابقة.
                    </Command.Empty>

                    <Command.Group heading={<span className="text-[11px] font-bold text-gray-400 px-3 uppercase tracking-wider">التنقل السريع</span>}>
                        <Command.Item onSelect={() => runCommand(() => router.push("/"))} className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-[#102550]/10 hover:text-[#102550] rounded-xl cursor-pointer transition-colors outline-none aria-[selected=true]:bg-[#102550]/10 aria-[selected=true]:text-[#102550]">
                            <LayoutDashboard className="h-4 w-4" />
                            <span>لوحة التحكم الرئيسية</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push("/projects"))} className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-[#102550]/10 hover:text-[#102550] rounded-xl cursor-pointer transition-colors outline-none aria-[selected=true]:bg-[#102550]/10 aria-[selected=true]:text-[#102550]">
                            <FolderKanban className="h-4 w-4" />
                            <span>المشاريع</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push("/employees"))} className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-[#102550]/10 hover:text-[#102550] rounded-xl cursor-pointer transition-colors outline-none aria-[selected=true]:bg-[#102550]/10 aria-[selected=true]:text-[#102550]">
                            <Users className="h-4 w-4" />
                            <span>الموظفين</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push("/invoices"))} className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-[#102550]/10 hover:text-[#102550] rounded-xl cursor-pointer transition-colors outline-none aria-[selected=true]:bg-[#102550]/10 aria-[selected=true]:text-[#102550]">
                            <FileText className="h-4 w-4" />
                            <span>الفواتير</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push("/settings"))} className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-[#102550]/10 hover:text-[#102550] rounded-xl cursor-pointer transition-colors outline-none aria-[selected=true]:bg-[#102550]/10 aria-[selected=true]:text-[#102550]">
                            <Settings className="h-4 w-4" />
                            <span>الاعدادات</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading={<span className="text-[11px] font-bold text-gray-400 px-3 uppercase tracking-wider mt-4 block">إجراءات سريعة</span>}>
                        <Command.Item onSelect={() => runCommand(() => router.push("/projects/new"))} className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-green-500/10 hover:text-green-600 rounded-xl cursor-pointer transition-colors outline-none aria-[selected=true]:bg-green-500/10 aria-[selected=true]:text-green-600">
                            <FolderKanban className="h-4 w-4" />
                            <span>إضافة مشروع جديد...</span>
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => router.push("/employees/new"))} className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-blue-500/10 hover:text-blue-600 rounded-xl cursor-pointer transition-colors outline-none aria-[selected=true]:bg-blue-500/10 aria-[selected=true]:text-blue-600">
                            <Users className="h-4 w-4" />
                            <span>تسجيل موظف جديد...</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
}
