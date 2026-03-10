import { Metadata } from "next";

export const metadata: Metadata = {
    title: "الشروط والأحكام | Pocket Manager",
    description: "الشروط والأحكام وسياسة الخصوصية لنظام إدارة المشاريع والمصروفات",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30" dir="rtl">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#102550] rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">PM</span>
                        </div>
                        <h1 className="text-lg font-black text-gray-900">الشروط والأحكام</h1>
                    </div>
                    <a href="/register" className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors">
                        العودة للتسجيل ←
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">

                {/* مقدمة */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">📋</span>
                        <h2 className="text-xl font-black text-gray-900">مقدمة</h2>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        مرحباً بك في نظام <strong className="text-gray-900">Pocket Manager</strong> لإدارة المشاريع والمصروفات.
                        باستخدامك لهذا النظام، فإنك توافق على الالتزام بالشروط والأحكام التالية.
                        يرجى قراءة هذه الشروط بعناية قبل استخدام النظام.
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                        آخر تحديث: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </section>

                {/* شروط الاستخدام */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">⚖️</span>
                        <h2 className="text-xl font-black text-gray-900">شروط الاستخدام</h2>
                    </div>
                    <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                            <p>يُستخدم هذا النظام لأغراض إدارة المشاريع والمصروفات المالية ضمن بيئة العمل فقط. يمنع استخدامه لأي غرض شخصي أو غير مصرح به.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                            <p>يلتزم المستخدم بالحفاظ على سرية بيانات تسجيل الدخول الخاصة به وعدم مشاركتها مع أي شخص آخر.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                            <p>جميع العمليات المالية المسجلة عبر النظام (فواتير، عهد، مشتريات) تعتبر مستندات رسمية ويتحمل المستخدم مسؤولية دقة البيانات المدخلة.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                            <p>يحق للإدارة مراجعة جميع البيانات والمعاملات المسجلة في النظام لأغراض التدقيق والمراقبة.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                            <p>أي محاولة للتلاعب بالبيانات المالية أو الوصول غير المصرح به لصلاحيات أعلى يعرّض المستخدم للمساءلة القانونية والإدارية.</p>
                        </div>
                    </div>
                </section>

                {/* سياسة الخصوصية */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🔒</span>
                        <h2 className="text-xl font-black text-gray-900">سياسة الخصوصية</h2>
                    </div>
                    <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                            <p><strong className="text-gray-800">جمع البيانات:</strong> يقوم النظام بجمع البيانات الضرورية لتشغيل الخدمة فقط، مثل: الاسم، البريد الإلكتروني، رقم الهاتف، والمعاملات المالية المرتبطة بالعمل.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                            <p><strong className="text-gray-800">حماية البيانات:</strong> يتم تشفير جميع البيانات الحساسة بما في ذلك كلمات المرور. لا يتم تخزين كلمات المرور بنص واضح.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                            <p><strong className="text-gray-800">مشاركة البيانات:</strong> لا يتم مشاركة بيانات المستخدمين مع أي طرف خارجي. البيانات مخصصة للاستخدام الداخلي فقط.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                            <p><strong className="text-gray-800">الاحتفاظ بالبيانات:</strong> يتم الاحتفاظ بسجلات المعاملات المالية وفقاً لسياسات الشركة والمتطلبات القانونية.</p>
                        </div>
                    </div>
                </section>

                {/* المسؤوليات */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">👤</span>
                        <h2 className="text-xl font-black text-gray-900">مسؤوليات المستخدم</h2>
                    </div>
                    <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>إدخال بيانات دقيقة وصحيحة في جميع النماذج والمعاملات.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>رفع صور واضحة ومقروءة للفواتير والمستندات المالية.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>الإبلاغ الفوري عن أي خلل أو خطأ في البيانات المسجلة.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>الالتزام بالصلاحيات المحددة لدوره والعمل ضمن نطاق مسؤولياته.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <p>تأكيد استلام العهد المالية في الوقت المناسب وتسويتها وفق الإجراءات المعتمدة.</p>
                        </div>
                    </div>
                </section>

                {/* إخلاء المسؤولية */}
                <section className="bg-amber-50 rounded-2xl border border-amber-100 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">⚠️</span>
                        <h2 className="text-xl font-black text-amber-900">إخلاء المسؤولية</h2>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">
                        يُقدّم النظام &quot;كما هو&quot; دون أي ضمانات صريحة أو ضمنية. لا تتحمل الشركة أي مسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام النظام، بما في ذلك فقدان البيانات أو انقطاع الخدمة.
                        يحق للشركة تعديل هذه الشروط في أي وقت، وسيتم إشعار المستخدمين بأي تعديلات جوهرية.
                    </p>
                </section>

                {/* التواصل */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 text-center">
                    <p className="text-sm text-gray-500">
                        لأي استفسارات تتعلق بالشروط والأحكام، يرجى التواصل عبر{" "}
                        <a href="/support" className="text-blue-600 hover:underline font-bold">صفحة الدعم الفني</a>.
                    </p>
                </section>

            </main>
        </div>
    );
}
