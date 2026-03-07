"use client";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandMenu } from "../ui/CommandMenu";
import { Toaster } from "react-hot-toast";
import { NetworkStatus } from "../ui/NetworkStatus";

export default function DashboardLayout({
    children,
    title = "الرئيسية",
}: {
    children: React.ReactNode;
    title?: string;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen relative flex bg-[#f8f9fa] overflow-x-hidden">
            {/* Premium Ambient Background — reduced blur on mobile for perf */}
            <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-blue-50/40 to-[#f8f9fa] rtl:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]">
                <div className="absolute top-[-20%] end-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 md:blur-[120px] blur-[60px] mix-blend-multiply" />
                <div className="hidden md:block absolute top-[20%] start-[-10%] w-[600px] h-[600px] rounded-full bg-blue-300/20 blur-[140px] mix-blend-multiply" />
                <div className="hidden md:block absolute bottom-[-10%] start-[20%] w-[500px] h-[500px] rounded-full bg-blue-300/20 blur-[120px] mix-blend-multiply" />
                <div className="hidden md:block absolute top-[50%] end-[30%] w-[400px] h-[400px] rounded-full bg-blue-200/30 blur-[150px] mix-blend-multiply" />
            </div>

            <div className="hidden md:block">
                <Sidebar isOpen={false} />
            </div>

            <div className="md:hidden">
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            </div>

            <div className="md:ms-[280px] flex flex-col min-h-screen w-full pb-24 md:pb-0 transition-all duration-300">
                <Header title={title} onMenuClick={() => setIsSidebarOpen(true)} />
                <AnimatePresence mode="wait">
                    <motion.main
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
            <MobileBottomNav />
            <CommandMenu />
            <NetworkStatus />
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        padding: '12px 24px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    }
                }}
            />
        </div>
    );
}
