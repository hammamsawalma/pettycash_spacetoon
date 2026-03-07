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
import PWAInstallBanner from "../ui/PWAInstallBanner";
import { useScrollRestoration } from "@/hooks/useMobileUtils";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export default function DashboardLayout({
    children,
    title = "الرئيسية",
}: {
    children: React.ReactNode;
    title?: string;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Restore scroll position when navigating back (#199)
    useScrollRestoration();

    // Auto-hide header on scroll down, show on scroll up (mobile only)
    const scrollDirection = useScrollDirection();
    const isHeaderHidden = scrollDirection === 'down' && !isSidebarOpen;

    return (
        <div className="min-h-screen relative flex bg-[#f8f9fa]">

            {/* ─── Skip to Content Link (Accessibility #143) ───────────────── */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-[#102550] focus:text-white focus:rounded-xl focus:font-bold focus:shadow-lg"
            >
                تخطى إلى المحتوى الرئيسي
            </a>

            {/* ─── ARIA Live Region for screen reader announcements (#153) ─── */}
            <div aria-live="polite" aria-atomic="true" className="sr-only" id="aria-announcer" />

            {/* Premium Ambient Background
              * Desktop: full 4-orb effect
              * Mobile: single lightweight orb (avoids expensive paint on low-end phones)
              */}
            <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-blue-50/40 to-[#f8f9fa] rtl:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]">
                {/* Mobile: one orb only */}
                <div className="absolute top-[-20%] end-[-10%] w-[300px] h-[300px] rounded-full bg-blue-400/15 blur-[60px] mix-blend-multiply md:w-[500px] md:h-[500px] md:bg-blue-400/20 md:blur-[120px]" />
                {/* Desktop-only orbs */}
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

            <div className="md:ms-[280px] flex flex-col min-h-screen w-full pb-28 md:pb-0 overflow-x-hidden transition-all duration-300">
                <Header title={title} onMenuClick={() => setIsSidebarOpen(true)} isHidden={isHeaderHidden} />
                <AnimatePresence mode="popLayout">
                    <motion.main
                        id="main-content"
                        role="main"
                        key={pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.12,
                            ease: "easeOut",
                        }}
                        className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
            <MobileBottomNav hiddenBySidebar={isSidebarOpen} />
            <PWAInstallBanner />
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

