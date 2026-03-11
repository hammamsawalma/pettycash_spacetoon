"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export default function VerifyOtpPage() {
    const { locale } = useLanguage();
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Brand Section */}
            <div className="md:w-1/2 bg-[#102550] flex flex-col justify-center items-center p-8 text-white min-h-[30vh] md:min-h-screen">
                <h1 className="text-5xl font-bold tracking-tight mb-4">{locale === 'ar' ? 'لوجو' : 'Logo'}</h1>
                <p className="text-blue-200 text-center max-w-sm hidden md:block">
                    {locale === 'ar' ? 'أمان حسابك هو أولويتنا. يرجى إدخال رمز التحقق لضمان حماية بياناتك.' : 'Your account security is our priority. Please enter the verification code to ensure your data is protected.'}
                </p>
            </div>

            {/* Form Section */}
            <div className="md:w-1/2 flex justify-center items-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{locale === 'ar' ? 'تأكيد رقم الهاتف' : 'Verify Phone Number'}</h2>
                        <p className="text-gray-500 mb-6">{locale === 'ar' ? 'لقد قمنا بإرسال رمز تحقق إلى رقم هاتفك المسجل' : 'We have sent a verification code to your registered phone number'}</p>
                        <p className="font-semibold text-gray-800 dir-ltr text-lg tracking-wider" dir="ltr">
                            +966 50 123 4567
                        </p>
                    </div>

                    <form className="space-y-8" action="/">
                        {/* OTP Input Fields */}
                        <div className="flex gap-4 justify-center" dir="ltr">
                            {[1, 2, 3, 4].map((i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength={1}
                                    className="w-16 h-16 text-center text-2xl font-bold rounded-2xl border-2 border-gray-200 text-gray-900 bg-gray-50 focus:border-[#102550] focus:ring-0 focus:outline-none transition-colors"
                                    placeholder="-"
                                />
                            ))}
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-2">
                                {locale === 'ar' ? 'لم تستلم الرمز؟ إعادة الإرسال خلال:' : 'Didn\'t receive the code? Resend in:'}
                            </p>
                            <span className="inline-flex items-center justify-center bg-blue-50 text-[#102550] font-bold px-4 py-2 rounded-full mb-4">
                                00:59
                            </span>
                            <div>
                                <button type="button" className="text-sm font-semibold text-[#102550] hover:text-[#1a3a7c] disabled:text-gray-400 disabled:cursor-not-allowed">
                                    {locale === 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code'}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full text-lg py-6 rounded-xl" variant="primary">
                            {locale === 'ar' ? 'تأكيد الكود' : 'Verify Code'}
                        </Button>

                        <div className="text-center mt-6">
                            <Link href="/register" className="text-sm font-semibold text-gray-600 hover:text-gray-900 focus:underline">
                                {locale === 'ar' ? 'العودة واختيار رقم آخر' : 'Go back and choose another number'}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
