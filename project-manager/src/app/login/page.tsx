"use client";

import { useState } from "react";
import { EyeOff, Fingerprint, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
    const [isPending, setIsPending] = useState(false);
    const { t, locale } = useLanguage();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email");
        const password = formData.get("password");

        if (!email || !password) {
            toast.error(locale === 'ar' ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
            return;
        }

        if (typeof email === "string" && !email.includes("@")) {
            toast.error(locale === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format');
            return;
        }

        setIsPending(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
            } else if (data.success) {
                window.location.href = "/";
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(locale === 'ar' ? 'حدث خطأ بالاتصال. يرجى المحاولة لاحقاً.' : 'Connection error. Please try again later.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Brand Section */}
            <div className="md:w-1/2 bg-[#102550] flex flex-col justify-center items-center p-8 text-white min-h-[30vh] md:min-h-screen">
                <img
                    src="/spacetoon-logo.png"
                    alt="Spacetoon Logo"
                    className="w-48 h-auto object-contain mb-4 drop-shadow-[0_0_3px_rgba(255,255,255,1)]"
                />
                <p className="text-blue-200 text-center max-w-sm hidden md:block">
                    {locale === 'ar' ? 'النظام الأذكى لإدارة مشاريعك وفريق عملك بكفاءة عالية' : 'The smartest system for managing your projects and team efficiently'}
                </p>
            </div>

            {/* Form Section */}
            <div className="md:w-1/2 flex justify-center items-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{locale === 'ar' ? 'مرحبًا بعودتك!' : 'Welcome back!'}</h2>
                        <p className="text-gray-500">{locale === 'ar' ? 'تسجيل الدخول إلى حسابك' : 'Sign in to your account'}</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Quick Login for testing */}
                        <div className="space-y-2 pb-4 border-b border-gray-100">
                            <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {locale === 'ar' ? 'دخول سريع للاختبار — كلمة المرور: 123456' : 'Quick Login for Testing — Password: 123456'}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: locale === 'ar' ? "👑 مدير النظام" : "👑 Admin", email: "admin@pocket.com", color: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" },
                                    { label: locale === 'ar' ? "🌟 المدير العام" : "🌟 Gen. Manager", email: "gm@pocket.com", color: "bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700" },
                                    { label: locale === 'ar' ? "🧾 المحاسب العام" : "🧾 Accountant", email: "accountant@pocket.com", color: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700" },
                                    { label: locale === 'ar' ? "🗂️ منسق المشتريات — خالد" : "🗂️ Coordinator — Khalid", email: "coordinator@pocket.com", color: "bg-green-50 hover:bg-green-100 border-green-200 text-green-700" },
                                    { label: locale === 'ar' ? "👤 محمد — عهدة ✅" : "👤 Mohd — Custody ✅", email: "emp1@pocket.com", color: "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700" },
                                    { label: locale === 'ar' ? "👤 سارة — عهدة ⏳" : "👤 Sara — Custody ⏳", email: "emp2@pocket.com", color: "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700" },
                                    { label: locale === 'ar' ? "👤 فيصل — طلب 🚨" : "👤 Faisal — Request 🚨", email: "emp3@pocket.com", color: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700" },
                                ].map(({ label, email, color }) => (
                                    <Button
                                        key={email}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className={`text-xs ${color} font-bold`}
                                        onClick={() => {
                                            const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
                                            const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
                                            if (emailInput && passwordInput) {
                                                emailInput.value = email;
                                                passwordInput.value = '123456';
                                                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                                                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                                            }
                                        }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-[9px] text-center text-gray-300 mt-1">
                                {locale === 'ar' 
                                    ? '✅ عهدة مؤكدة  |  ⏳ عهدة تنتظر توقيع + دين  |  🚨 طلب شراء عاجل'
                                    : '✅ Settled Custody  |  ⏳ Pending Custody + Debt  |  🚨 Urgent POS Request'}
                            </p>
                        </div>

                        <div>
                            <div className="relative mt-2 rounded-xl shadow-sm">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder={t('login.emailLabel')}
                                    className="block w-full rounded-xl border-0 py-3.5 pl-4 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="relative mt-2 rounded-xl shadow-sm">
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder={t('login.passwordLabel')}
                                    className="block w-full rounded-xl border-0 py-3.5 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                />
                                <button type="button" className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600">
                                    <EyeOff className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-[#102550] focus:ring-[#102550]"
                                />
                                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-500">
                                    {t('login.rememberMe')}
                                </label>
                            </div>
                        </div>

                        <Button type="submit" disabled={isPending} isLoading={isPending} className="w-full text-base py-6 rounded-xl" variant="primary">
                            {t('login.loginButton')}
                        </Button>
                    </form>



                    <a
                        href="/manual"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#102550]/30 text-[#102550] hover:bg-[#dbeafe] transition-colors text-sm font-semibold"
                    >
                        <span className="text-base">📖</span>
                        {t('header.userManual')}
                    </a>

                </div>
            </div>
        </div>
    );
}
