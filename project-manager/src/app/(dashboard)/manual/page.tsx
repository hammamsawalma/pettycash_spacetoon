import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ManualPage() {
    return (
        <DashboardLayout title="دليل الاستخدام">
            <ManualContent />
        </DashboardLayout>
    );
}

function ManualContent() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12" dir="rtl">

            {/* ── Header Banner ── */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#102550] via-[#1a3a7c] to-[#122b5e] text-white p-8 flex items-center gap-6 shadow-xl shadow-blue-200/40">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
                    📋
                </div>
                <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">وثيقة داخلية للموظفين</p>
                    <h1 className="text-2xl md:text-3xl font-bold">دليل استخدام نظام إدارة المشاريع</h1>
                    <p className="text-blue-200 text-sm mt-1">إصدار 4.0 — مارس 2026</p>
                </div>
            </div>

            {/* ── Chapter 1: Overview ── */}
            <Chapter icon="🏢" num="الفصل الأول" title="نظرة عامة على النظام">
                <Section title="ما هو النظام؟">
                    <p>نظام إدارة المشاريع هو منصة رقمية متكاملة تتيح للشركة متابعة مشاريعها ومصروفاتها وموظفيها في مكان واحد. يساعد النظام على تنظيم العمل، تتبع المبالغ المالية، والتأكد من أن كل ريال يُصرف في مكانه الصحيح.</p>
                    <p>يعمل النظام عبر الإنترنت من أي متصفح دون الحاجة لتنزيل أي برنامج.</p>
                </Section>
                <Section title="الفكرة الأساسية للنظام">
                    <p>يعتمد النظام على مسار مالي واضح يتدفق على ثلاثة مستويات:</p>
                    <Steps items={[
                        { n: "1", text: <><strong>خزنة الشركة ← المشاريع:</strong> يوافق المدير على تخصيص ميزانية من خزنة الشركة لكل مشروع.</> },
                        { n: "2", text: <><strong>المشاريع ← الموظفون (عهدة):</strong> يصرف المنسق أو المدير مبالغ نقدية للموظفين تُسمى "العهدة" لتغطية مصروفات الميدان.</> },
                        { n: "3", text: <><strong>الموظفون ← فواتير:</strong> يرفع الموظف فواتير مصروفاته، يراجعها المحاسب ويعتمدها أو يرفضها.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="ملاحظة مهمة" text="كل عملية في النظام مسجلة ومتتبعة. لا يمكن حذف أي سجل نهائياً دون مرور بمرحلة سلة المهملات، مما يضمن الشفافية الكاملة." />
                <Section title="كيف تسجّل الدخول؟">
                    <Steps items={[
                        { n: "1", text: "افتح متصفح الإنترنت وادخل على رابط النظام الذي زوّدك به مدير النظام." },
                        { n: "2", text: <><b>البريد الإلكتروني</b> وكلمة المرور التي أعطاك إياها المدير.  </> },
                        { n: "3", text: <>اضغط <b>"تسجيل الدخول"</b>. ستنتقل تلقائياً إلى لوحة التحكم.</> },
                        { n: "4", text: <>تبقى جلستك نشطة لمدة <b>7 أيام</b> دون الحاجة لإعادة تسجيل الدخول.</> },
                    ]} />
                </Section>
                <InfoBox type="warn" title="أمان حسابك" text="لا تشارك كلمة مرورك مع أي شخص. إذا نسيتها تواصل مع مدير النظام فوراً." />
            </Chapter>

            {/* ── Chapter 2: Roles ── */}
            <Chapter icon="👥" num="الفصل الثاني" title="الأدوار والصلاحيات">
                <p className="text-gray-600 mb-4">يعمل النظام بنظام الأدوار — كل موظف له حسابه الخاص بصلاحيات محددة. هناك <strong>أربعة أدوار</strong> رئيسية:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <RoleCard icon="👑" name="المدير (Admin)" color="blue" desc="يملك كامل الصلاحيات على النظام. يرى ويدير المشاريع التي هو عضو فيها أو المعين عليها. يدير الموظفين، ويوافق على الإجراءات الكبرى." />
                    <RoleCard icon="📊" name="المحاسب (Accountant)" color="blue" desc="مسؤول عن مراجعة الفواتير واعتمادها أو رفضها، ومتابعة خزنة الشركة. يمكنه أيضاً صرف وإدارة العهدات داخل مشاريعه." />
                    <RoleCard icon="🧭" name="المنسق (Coordinator)" color="green" desc="يدير المشاريع المسندة إليه، ولا يمكنه إنشاء مشاريع جديدة أو رفع فواتير. يصرف العهدات للموظفين ويدير المشتريات." />
                    <RoleCard icon="👷" name="الموظف (Employee)" color="orange" desc="يعمل داخل مشاريعه المسجل فيها (ولا يرى تفاصيلها المالية الحساسة). يتسلم العهدات، ويؤكد استلامها، ويرفع فواتير مصروفاته." />
                </div>
                <Section title="جدول مقارنة الصلاحيات">
                    <PermTable rows={[
                        ["إنشاء مشروع جديد", true, false, false, false],
                        ["إغلاق مشروع نهائياً", true, false, false, false],
                        ["إضافة / تعديل موظف", true, false, false, false],
                        ["عرض رواتب الموظفين", true, true, false, false],
                        ["صرف عهدة للموظف", true, "في مشاريعه", true, false],
                        ["تأكيد استلام عهدة", false, false, false, true],
                        ["رفع فاتورة جديدة", true, true, false, true],
                        ["اعتماد / رفض فاتورة", true, true, false, false],
                        ["إنشاء قائمة مشتريات", true, false, true, false],
                        ["تسوية ديون الموظفين", true, true, false, false],
                        ["إيداع في الخزنة", true, false, false, false],
                        ["تخصيص ميزانية لمشروع", true, false, false, false],
                        ["تغيير العملة العامة", true, false, false, false],
                        ["التقارير والإحصائيات", true, true, "مشاريعه فقط", false],
                        ["سلة المهملات", true, false, false, false],
                        ["إرسال تذكرة دعم فني", true, true, true, true],
                    ]} />
                </Section>
            </Chapter>

            {/* ── Chapter 3: Dashboard ── */}
            <Chapter icon="🏠" num="الفصل الثالث" title="الصفحة الرئيسية — لوحة التحكم">
                <p className="text-gray-600 mb-4">عند تسجيل دخولك، تُفتح لوحة التحكم الرئيسية تلقائياً. تُعرض فيها معلومات مختلفة حسب دورك.</p>
                <Section title="ما يراه كل دور في لوحة التحكم">
                    <SubSection title="👑 المدير والمحاسب يريان:">
                        <FeatureList items={[
                            "لمحة مالية شاملة للشركة (إجمالي المصروفات، الرصيد النقدي، وتوقعات السيولة لسداد الفواتير المعلقة)",
                            "إجمالي عدد المشاريع (الجارية والمكتملة)",
                            "إيرادات ومصروفات اليوم الحالي",
                            "آخر 4 فواتير معلقة تنتظر المراجعة",
                            "رسم بياني للمشاريع شهرياً وسنوياً",
                        ]} />
                    </SubSection>
                    <SubSection title="🧭 المنسق يرى:">
                        <FeatureList items={[
                            "المشاريع التي يديرها أو يشارك فيها فقط",
                            "المبالغ الواردة لمشاريعه والمصروفة",
                            "رسم بياني لمشاريعه",
                        ]} />
                    </SubSection>
                    <SubSection title="👷 الموظف يرى:">
                        <FeatureList items={[
                            "مشاريعه الحالية التي هو عضو فيها",
                            "إجمالي ما استلمه من عهدات وما أنفقه والمتبقي لديه",
                        ]} />
                    </SubSection>
                </Section>
            </Chapter>

            {/* ── Chapter 4: Projects ── */}
            <Chapter icon="📁" num="الفصل الرابع" title="إدارة المشاريع">
                <p className="text-gray-600 mb-4">المشروع هو الوحدة الأساسية في النظام. كل مصروف، فاتورة، وعهدة مرتبطة بمشروع محدد. يمر المشروع بثلاث حالات: <strong>قيد التنفيذ — مكتمل — محذوف</strong>.</p>
                <Section title="إنشاء مشروع جديد (المدير فقط)">
                    <Steps items={[
                        { n: "1", text: <>من القائمة الجانبية، اضغط <b>"المشاريع"</b>.</> },
                        { n: "2", text: <>اضغط على زر <b>"مشروع جديد"</b>.</> },
                        { n: "3", text: <>أدخل <b>اسم المشروع</b> (إلزامي)، ثم الوصف، وتاريخَي البداية والنهاية، والميزانية المخططة.</> },
                        { n: "4", text: <>اختر <b>أعضاء الفريق</b> من قائمة الموظفين، وحدد <b>دوراً مخصصاً</b> لكل عضو (مثل: مسؤول مشروع، محاسب، أو موظف عادي).</> },
                        { n: "5", text: <>اضغط <b>"حفظ"</b>. سيظهر المشروع فوراً في القائمة.</> },
                    ]} />
                </Section>
                <InfoBox type="tip" title="تحديثات العرض المالي" text="بطاقات المشاريع وصفحة تفاصيل المشروع تعرض بشكل محدث: المصروفات المعتمدة، المصروفات المعلقة، العهدة المتبقية، والرصيد المتبقي المتوقع." />
                <InfoBox type="warn" title="ملاحظة" text="إنشاء المشروع لا يعني تخصيص ميزانية له تلقائياً. الميزانية الفعلية تُخصَّص من خزنة الشركة بشكل منفصل." />
                <Section title="إغلاق مشروع نهائياً (المدير فقط)">
                    <p className="text-gray-600">يشترط النظام قبل الإغلاق:</p>
                    <FeatureList items={[
                        "ألا تكون هناك عهدات مفتوحة برصيد غير مُرجَع",
                        "ألا تكون هناك فواتير معلقة تنتظر المراجعة",
                        "ألا تكون هناك ديون شخصية غير مسوَّاة",
                    ]} />
                </Section>
                <InfoBox type="danger" title="تنبيه" text="عملية الإغلاق نهائية ولا يمكن التراجع عنها إلا عبر صفحة الأرشيف من قِبَل المدير." />
            </Chapter>

            {/* ── Chapter 5: Employees ── */}
            <Chapter icon="👩‍💼" num="الفصل الخامس" title="إدارة الموظفين">
                <p className="text-gray-600 mb-4">كل الأدوار يستطيعون عرض قائمة الموظفين، لكن الإضافة والتعديل والحذف للمدير حصراً.</p>
                <Section title="إضافة موظف جديد (المدير فقط)">
                    <Steps items={[
                        { n: "1", text: <>من القائمة الجانبية، اضغط <b>"الموظفون"</b>.</> },
                        { n: "2", text: <>اضغط <b>"إضافة موظف"</b>.</> },
                        { n: "3", text: <>أدخل: <b>الاسم الكامل، رقم الهاتف</b> (إلزاميان)، البريد الإلكتروني، المسمى الوظيفي، الراتب، وكلمة المرور.</> },
                        { n: "4", text: <>حدد <b>الدور</b>: موظف عادي، محاسب، أو منسق.</> },
                        { n: "5", text: <>اضغط <b>"حفظ"</b>. يمكن للموظف الآن تسجيل الدخول فوراً.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="رقم الهاتف فريد" text="لا يمكن تسجيل رقم هاتف أو بريد إلكتروني مكرر في النظام." />
            </Chapter>

            {/* ── Chapter 6: Custody ── */}
            <Chapter icon="💰" num="الفصل السادس" title="العهدات المالية">
                <p className="text-gray-600 mb-4">"العهدة" هي مبلغ مالي يُسلَّم للموظف نقداً أو بنكياً ليغطي مصروفات العمل الميداني.</p>
                <Section title="كيف تعمل العهدة؟">
                    <Steps items={[
                        { n: "1", text: <><b>الصرف:</b> يصرف المدير أو المنسق مبلغاً للموظف من ميزانية المشروع.</> },
                        { n: "2", text: <><b>التأكيد:</b> يتلقى الموظف إشعاراً ويجب عليه الضغط على <b>"تأكيد الاستلام"</b> قبل رفع أي فاتورة.</> },
                        { n: "3", text: <><b>الإنفاق:</b> كلما اعتُمدت فاتورة مرتبطة بالعهدة، يُخصم مبلغها من رصيدها تلقائياً.</> },
                        { n: "4", text: <><b>الإرجاع:</b> عند التوفر فائض، يمكن للموظف تقديم طلب "إرجاع نقد" من صفحة عهداتي ليؤكد المدير أو المحاسب استلامه.</> },
                    ]} />
                </Section>
                <InfoBox type="danger" title="مهم جداً" text="لا يمكن رفع أي فاتورة من عهدة لم تُؤكد استلامها. تأكيد الاستلام إلزامي عبر صفحة العهدات (My Custodies)." />
                <Section title="صفحة عهداتي (My Custodies)">
                    <p className="text-gray-600">صفحة مخصصة للموظفين تمكنهم من إدارة عهداتهم ومتابعتهم بشكل كامل:</p>
                    <FeatureList items={[
                        "الاطلاع على جميع عهدات الموظف النشطة والمكتملة.",
                        "تأكيد استلام عهدة جديدة أو رفضها مع ذكر السبب.",
                        "إرجاع مبلغ نقدي متبقي من العهدة للمدير وتوثيقه بأمان.",
                    ]} />
                </Section>
                <Section title="تحويل عهدة طارئ (المدير أو المنسق)">
                    <p className="text-gray-600">في حالات الطوارئ يمكن تحويل جزء من عهدة موظف إلى موظف آخر في نفس المشروع.</p>
                    <Steps items={[
                        { n: "1", text: "افتح تفاصيل العهدة ثم اضغط \"تحويل طارئ\"." },
                        { n: "2", text: "اختر الموظف المستلم، حدد المبلغ، وأضف ملاحظة." },
                        { n: "3", text: "اضغط \"تحويل\" — ستُنشأ عهدة جديدة للموظف المستلم تلقائياً." },
                    ]} />
                </Section>
            </Chapter>

            {/* ── Chapter 7: Invoices ── */}
            <Chapter icon="🧾" num="الفصل السابع" title="الفواتير والمصروفات">
                <p className="text-gray-600 mb-4">الفاتورة هي وثيقة رسمية تُثبت صرف مبلغ معين في إطار أحد المشاريع.</p>
                <Section title="رفع فاتورة جديدة">
                    <Steps items={[
                        { n: "1", text: <>من القائمة، اضغط <b>"الفواتير"</b> ثم <b>"فاتورة جديدة"</b>.</> },
                        { n: "2", text: <>اختر <b>المشروع</b> وأدخل <b>رقم المرجع</b> (فريد)، التاريخ، والمبلغ الإجمالي.</> },
                        { n: "3", text: <>حدد <b>تصنيف المصروف</b> وطريقة الدفع.</> },
                        { n: "4", text: "ارفع صورة أو ملف PDF للفاتورة (حد أقصى 5 ميجابايت)." },
                        { n: "5", text: <>اضغط <b>"رفع الفاتورة"</b>.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="صلاحيات الفواتير" text="المنسق لا يمكنه رفع فواتير. أما الموظفون، فيمكنهم رفع الفواتير وإضافة مصروفات مباشرة حتى بدون إنشاء طلبات شراء مسبقة بفضل الصلاحيات الجديدة." />
                <Section title="ُأنواع طريقة الدفع">
                    <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100"><strong>من العهدة (CUSTODY):</strong> يُخصم المبلغ من رصيد عهدة الموظف عند الاعتماد.</div>
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100"><strong>من الجيب الشخصي (PERSONAL):</strong> يُسجَّل كـ"دين" على الشركة تجاه الموظف ويُسوَّى لاحقاً.</div>
                        <div className="p-3 rounded-xl bg-green-50 border border-green-100"><strong>مختلط (SPLIT):</strong> جزء من العهدة وجزء شخصي — يحدد الموظف التوزيع.</div>
                    </div>
                </Section>
                <InfoBox type="warn" title="فصل المهام" text="لا يمكن للموظف اعتماد فاتورة قام هو بإنشائها (باستثناء المدير)." />
                <InfoBox type="info" title="الاعتماد التلقائي" text="قد يضبط المدير حداً أقصى للاعتماد التلقائي. إذا كان مبلغ الفاتورة أقل منه، تُعتمد فوراً." />
            </Chapter>

            {/* ── Chapter 8: Purchases ── */}
            <Chapter icon="🛒" num="الفصل الثامن" title="قائمة المشتريات">
                <InfoBox type="warn" title="صلاحيات إنشاء الطلبات" text="إنشاء طلبات الشراء محصور على المدير والمنسق فقط. الموظف يمكنه فقط تنفيذ الطلبات (مثل بدء التنفيذ أو الشراء)." />
                <Section title="حالات طلب الشراء">
                    <table className="w-full text-sm border-collapse">
                        <thead><tr className="bg-[#102550] text-white"><th className="p-3 text-right rounded-tr-xl">الحالة</th><th className="p-3 text-right rounded-tl-xl">المعنى</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                                ["🟡 مطلوب", "طلب الشراء أُنشئ وينتظر التنفيذ"],
                                ["🔵 قيد التنفيذ", "موظف بدأ بالتوجه للشراء"],
                                ["🟢 تم الشراء", "اشترى الموظف الصنف وربطه بفاتورة"],
                                ["🔴 ملغى", "أُلغي الطلب من المنسق أو المدير"],
                            ].map(([s, m], i) => (
                                <tr key={i} className={i % 2 === 1 ? "bg-gray-50" : ""}><td className="p-3">{s}</td><td className="p-3 text-gray-600">{m}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </Section>
            </Chapter>

            {/* ── Chapter 9: Debts ── */}
            <Chapter icon="💳" num="الفصل التاسع" title="الديون الشخصية للموظفين">
                <p className="text-gray-600 mb-4">عندما يدفع موظف من ماله الخاص لأغراض العمل، يُسجَّل النظام ذلك تلقائياً كـ<strong>"دين"</strong> على الشركة. يراه المدير والمحاسب لجميع الموظفين، والموظف يرى ديونه فقط.</p>
                <Section title="تسوية دين موظف (المدير أو المحاسب)">
                    <Steps items={[
                        { n: "1", text: <>افتح صفحة <b>"الديون"</b> من القائمة الجانبية وابحث عن الموظف.</> },
                        { n: "2", text: <>اضغط <b>"تسوية"</b> أمام الدين، أو <b>"تسوية الكل"</b> لتسوية الجميع دفعة واحدة.</> },
                        { n: "3", text: "يُسجَّل الدين كـ\"مسوَّى\" مع الوقت والتاريخ ومن قام بالتسوية." },
                    ]} />
                </Section>
            </Chapter>

            {/* ── Chapter 10: Wallet ── */}
            <Chapter icon="🏦" num="الفصل العاشر" title="خزنة الشركة">
                <p className="text-gray-600 mb-4">خزنة الشركة هي المستودع المالي المركزي. تظهر للمدير والمحاسب فقط.</p>
                <Section title="الإيداع في الخزنة (المدير فقط)">
                    <Steps items={[
                        { n: "1", text: <>من القائمة اضغط <b>"الخزنة"</b> ثم <b>"إيداع جديد"</b>.</> },
                        { n: "2", text: "أدخل المبلغ وأضف ملاحظة توضيحية." },
                        { n: "3", text: <>اضغط <b>"تأكيد الإيداع"</b>. يُضاف المبلغ فوراً للرصيد.</> },
                    ]} />
                </Section>
                <InfoBox type="info" title="إرجاع الميزانية عند إغلاق المشروع" text="عند إغلاق مشروع، أي ميزانية لم تُصرف تُعاد تلقائياً إلى خزنة الشركة." />
            </Chapter>

            {/* ── Chapter 11-17 Combined ── */}
            <Chapter icon="🗃️" num="الفصول 11 — 17" title="الطلبات المالية • التقارير • الرسائل • الإشعارات • الأرشيف • سلة المهملات • الدعم الفني">
                <Section title="الطلبات المالية">
                    <p className="text-gray-600">تُتيح للمحاسب تقديم طلبات رسمية للمدير. أنواعها: تسوية دين، تخصيص ميزانية، إرجاع عهدة. يوافق عليها المدير أو يرفضها مع ذكر السبب.</p>
                </Section>
                <Section title="التقارير والتحليلات">
                    <p className="text-gray-600">المدير والمحاسب يريان كامل التقارير. المنسق يرى تقارير مشاريعه فقط. الموظف لا يرى التقارير. يمكن تصفية التقارير بفترات زمنية مختلفة.</p>
                </Section>
                <Section title="المحادثات والإشعارات">
                    <p className="text-gray-600">يتيح النظام رسائل خاصة بين موظفَيْن أو محادثات جماعية مرتبطة بمشروع. الإشعارات تصل تلقائياً لكل جهة معنية بكل حدث.</p>
                </Section>
                <Section title="سلة المهملات (المدير فقط)">
                    <p className="text-gray-600">أي عنصر محذوف ينتقل للسلة أولاً. المدير يستطيع استعادته أو حذفه نهائياً. أي عنصر في السلة أكثر من 30 يوماً يُحذف تلقائياً.</p>
                    <InfoBox type="danger" title="تحذير" text="الحذف النهائي لا يمكن التراجع عنه بأي وسيلة." />
                </Section>
                <Section title="الدعم الفني">
                    <Steps items={[
                        { n: "1", text: <>من القائمة اضغط <b>"الدعم الفني"</b>.</> },
                        { n: "2", text: "اختر نوع التذكرة (مشكلة / اقتراح / استفسار) ومستوى الأولوية." },
                        { n: "3", text: <>أدخل عنواناً ووصفاً واضحاً ثم اضغط <b>"إرسال"</b>. تصل التذكرة للمدير فوراً.</> },
                    ]} />
                </Section>
            </Chapter>

            {/* ── Final summary table ── */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="bg-gradient-to-r from-[#102550] to-[#122b5e] text-white px-6 py-4">
                    <h2 className="text-lg font-bold">📌 جدول الصلاحيات المرجعي الشامل</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="p-3 text-right font-bold text-gray-700">الصفحة / الوظيفة</th>
                            <th className="p-3 text-center text-blue-700">👑 مدير</th>
                            <th className="p-3 text-center text-blue-700">📊 محاسب</th>
                            <th className="p-3 text-center text-green-700">🧭 منسق</th>
                            <th className="p-3 text-center text-orange-700">👷 موظف</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                                ["لوحة التحكم الرئيسية", "✔ كاملة", "✔ مالية", "✔ مشاريعه", "✔ عهدته"],
                                ["إنشاء / إغلاق مشروع", true, false, false, false],
                                ["إضافة / تعديل موظف", true, false, false, false],
                                ["صرف عهدة", true, "في مشاريعه", true, false],
                                ["تأكيد استلام عهدة", false, false, false, true],
                                ["رفع فاتورة", true, true, false, true],
                                ["اعتماد / رفض فاتورة", true, true, false, false],
                                ["إنشاء مشتريات", true, false, true, false],
                                ["تسوية ديون", true, true, false, false],
                                ["إيداع في الخزنة", true, false, false, false],
                                ["تغيير العملة العامة", true, false, false, false],
                                ["التقارير", true, true, "مشاريعه", false],
                                ["سلة المهملات", true, false, false, false],
                                ["الإعدادات العامة", true, false, false, false],
                                ["إرسال تذكرة دعم", true, true, true, true],
                            ].map(([label, a, b, c, d], i) => (
                                <tr key={i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                                    <td className="p-3 font-medium text-gray-800">{label}</td>
                                    {[a, b, c, d].map((v, j) => (
                                        <td key={j} className="p-3 text-center">
                                            {v === true ? <span className="text-green-600 font-bold text-base">✔</span>
                                                : v === false ? <span className="text-red-400 font-bold text-base">✘</span>
                                                    : <span className="text-xs text-gray-500 font-medium">{v}</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-100">
                نظام إدارة المشاريع — دليل الاستخدام الشامل — إصدار 4.0 — مارس 2026
            </div>
        </div>
    );
}

/* ─────────────── Helper Components ─────────────── */

function Chapter({ icon, num, title, children }: { icon: string; num: string; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#102550] to-[#122b5e] text-white px-6 py-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
                <div>
                    <div className="text-blue-200 text-xs font-medium tracking-wide">{num}</div>
                    <div className="text-lg font-bold leading-snug">{title}</div>
                </div>
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-3">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#102550] to-[#A5B4FC] block flex-shrink-0" />
                {title}
            </h2>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-3">
            <h3 className="text-sm font-bold text-gray-700 mb-2">{title}</h3>
            {children}
        </div>
    );
}

function Steps({ items }: { items: { n: string; text: React.ReactNode }[] }) {
    return (
        <ol className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex gap-3 items-start bg-[#F0F5FF] border border-[#C7D2FE] rounded-xl p-3">
                    <span className="min-w-6 h-6 rounded-full bg-gradient-to-br from-[#102550] to-[#6366F1] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{item.text}</span>
                </li>
            ))}
        </ol>
    );
}

function InfoBox({ type, title, text }: { type: "info" | "warn" | "danger" | "tip"; title: string; text: string }) {
    const styles = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warn: "bg-amber-50 border-amber-200 text-amber-800",
        danger: "bg-red-50 border-red-200 text-red-800",
        tip: "bg-emerald-50 border-emerald-200 text-emerald-800",
    };
    const icons = { info: "💡", warn: "⚠️", danger: "🔴", tip: "✅" };
    return (
        <div className={`rounded-xl border p-4 flex gap-3 items-start ${styles[type]}`}>
            <span className="text-xl flex-shrink-0">{icons[type]}</span>
            <div className="text-sm leading-relaxed"><strong className="block mb-0.5">{title}</strong>{text}</div>
        </div>
    );
}

function FeatureList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-1.5">
            {items.map((item, i) => (
                <li key={i} className="flex gap-2 items-start text-sm text-gray-700">
                    <span className="text-[#102550] font-bold mt-0.5">←</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function RoleCard({ icon, name, color, desc }: { icon: string; name: string; color: string; desc: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 border-blue-200",
        green: "bg-emerald-50 border-emerald-200",
        orange: "bg-orange-50 border-orange-200",
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color]}`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-bold text-gray-800 mb-1 text-sm">{name}</div>
            <div className="text-xs text-gray-600 leading-relaxed">{desc}</div>
        </div>
    );
}

function PermTable({ rows }: { rows: (string | boolean | null)[][] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[#102550] text-white">
                        <th className="p-3 text-right">الإجراء</th>
                        <th className="p-3 text-center">👑 المدير</th>
                        <th className="p-3 text-center">📊 المحاسب</th>
                        <th className="p-3 text-center">🧭 المنسق</th>
                        <th className="p-3 text-center">👷 الموظف</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                            <td className="p-3 font-medium text-gray-800">{row[0]}</td>
                            {row.slice(1).map((v, j) => (
                                <td key={j} className="p-3 text-center">
                                    {v === true ? <span className="text-green-600 font-bold">✔</span>
                                        : v === false ? <span className="text-red-400 font-bold">✘</span>
                                            : <span className="text-xs text-gray-500">{v}</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
