import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function VerifyOtpPage() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Brand Section */}
            <div className="md:w-1/2 bg-[#7F56D9] flex flex-col justify-center items-center p-8 text-white min-h-[30vh] md:min-h-screen">
                <h1 className="text-5xl font-bold tracking-tight mb-4">لوجو</h1>
                <p className="text-purple-200 text-center max-w-sm hidden md:block">
                    أمان حسابك هو أولويتنا. يرجى إدخال رمز التحقق لضمان حماية بياناتك.
                </p>
            </div>

            {/* Form Section */}
            <div className="md:w-1/2 flex justify-center items-center p-6 md:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">تأكيد رقم الهاتف</h2>
                        <p className="text-gray-500 mb-6">لقد قمنا بإرسال رمز تحقق إلى رقم هاتفك المسجل</p>
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
                                    className="w-16 h-16 text-center text-2xl font-bold rounded-2xl border-2 border-gray-200 text-gray-900 bg-gray-50 focus:border-[#7F56D9] focus:ring-0 focus:outline-none transition-colors"
                                    placeholder="-"
                                />
                            ))}
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-2">
                                لم تستلم الرمز؟ إعادة الإرسال خلال:
                            </p>
                            <span className="inline-flex items-center justify-center bg-purple-50 text-[#7F56D9] font-bold px-4 py-2 rounded-full mb-4">
                                00:59
                            </span>
                            <div>
                                <button type="button" className="text-sm font-semibold text-[#7F56D9] hover:text-[#6941C6] disabled:text-gray-400 disabled:cursor-not-allowed">
                                    إعادة إرسال الرمز
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full text-lg py-6 rounded-xl" variant="primary">
                            تأكيد الكود
                        </Button>

                        <div className="text-center mt-6">
                            <Link href="/register" className="text-sm font-semibold text-gray-600 hover:text-gray-900 focus:underline">
                                العودة واختيار رقم آخر
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
