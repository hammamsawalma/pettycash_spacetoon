"use client";
import { EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Brand Section */}
            <div className="md:w-1/2 bg-[#102550] flex flex-col justify-center items-center p-8 text-white min-h-[30vh] md:min-h-screen">
                <h1 className="text-5xl font-bold tracking-tight mb-4">لوجو</h1>
                <p className="text-blue-200 text-center max-w-sm hidden md:block">
                    قم بإنشاء حسابك الآن وانضم إلى منصتنا لإدارة مشاريعك بسهولة
                </p>
            </div>

            {/* Form Section */}
            <div className="md:w-1/2 flex justify-center items-center p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">إنشاء حساب جديد</h2>
                        <p className="text-gray-500">ادخل بياناتك للتسجيل في النظام</p>
                    </div>

                    <form className="space-y-4" action="/verify-otp">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="الاسم الأول"
                                    className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    placeholder="الاسم الأخير"
                                    className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <input
                                type="tel"
                                placeholder="رقم الهاتف"
                                className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                required
                            />
                        </div>

                        <div>
                            <input
                                type="email"
                                placeholder="البريد الالكتروني"
                                className="block w-full rounded-xl border-0 py-3.5 px-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                required
                            />
                        </div>

                        <div>
                            <div className="relative rounded-xl shadow-sm">
                                <input
                                    type="password"
                                    placeholder="كلمة المرور"
                                    className="block w-full rounded-xl border-0 py-3.5 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                    required
                                />
                                <button type="button" className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600">
                                    <EyeOff className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="relative rounded-xl shadow-sm">
                                <input
                                    type="password"
                                    placeholder="تأكيد كلمة المرور"
                                    className="block w-full rounded-xl border-0 py-3.5 pl-12 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#102550] sm:text-sm sm:leading-6 bg-gray-50"
                                    required
                                />
                                <button type="button" className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-gray-600">
                                    <EyeOff className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex bg-gray-50 rounded-xl p-4 gap-3 border border-gray-100 items-start">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#102550] focus:ring-[#102550]"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                                بالتسجيل، أنت توافق على <Link href="/manual" target="_blank" className="font-semibold text-[#102550] hover:underline">الشروط والأحكام</Link> المتصلة بخدمات منصتنا.
                            </label>
                        </div>

                        <Button type="submit" className="w-full text-base py-6 rounded-xl mt-2" variant="primary">
                            إنشاء حساب
                        </Button>

                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-600">
                                لديك حساب بالفعل؟{' '}
                                <Link href="/login" className="font-bold text-[#102550] hover:text-[#1a3a7c]">
                                    تسجيل الدخول هنا
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
