"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Image as ImageIcon, Phone, Lock, LogOut, Settings2, ShieldCheck } from "lucide-react";
import { useState, useTransition, useActionState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCanDo } from "@/components/auth/Protect";
import { logout } from "@/actions/auth";
import { updateProfile, updatePhone, updatePassword } from "@/actions/users";
import { FileUpload } from "@/components/ui/FileUpload";
import toast from "react-hot-toast";
import { getAutoApprovalRule, setAutoApprovalRule, disableAutoApprovalRule } from "@/actions/autoApproval";
import { useCurrency } from "@/context/CurrencyContext";
import { updateGlobalCurrency } from "@/actions/settings";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
    const { user, roleNameAr } = useAuth();
    const { currency, setCurrency } = useCurrency();
    const { locale } = useLanguage();
    const [activeTab, setActiveTab] = useState("profile");
    const [isPending, startTransition] = useTransition();
    const canManageSystem = useCanDo('settings', 'manage');

    const [profileState, profileAction, profilePending] = useActionState(updateProfile, null);
    const [phoneState, phoneAction, phonePending] = useActionState(updatePhone, null);
    const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, null);

    const profileFormRef = useRef<HTMLFormElement>(null);
    const phoneFormRef = useRef<HTMLFormElement>(null);
    const passwordFormRef = useRef<HTMLFormElement>(null);

    // AutoApproval state (ADMIN only)
    const [autoRule, setAutoRule] = useState<{ maxAmount: number; requiresManager: boolean; isActive: boolean } | null>(null);
    const [autoAmount, setAutoAmount] = useState("");
    const [autoRequiresManager, setAutoRequiresManager] = useState(false);
    const [isSavingAuto, setIsSavingAuto] = useState(false);

    useEffect(() => {
        if (profileState?.error) toast.error(profileState.error);
        if (profileState?.success) { toast.success(profileState.message || (locale === 'ar' ? "تم حفظ التعديلات بنجاح" : "Changes saved successfully")); }
    }, [profileState]);

    useEffect(() => {
        if (phoneState?.error) toast.error(phoneState.error);
        if (phoneState?.success) { toast.success(phoneState.message || (locale === 'ar' ? "تم تحديث رقم الجوال" : "Phone number updated")); phoneFormRef.current?.reset(); }
    }, [phoneState]);

    useEffect(() => {
        if (passwordState?.error) toast.error(passwordState.error);
        if (passwordState?.success) { toast.success(passwordState.message || (locale === 'ar' ? "تم تحديث كلمة المرور" : "Password updated")); passwordFormRef.current?.reset(); }
    }, [passwordState]);

    // Load auto-approval rule (ADMIN only — via canManageSystem)
    useEffect(() => {
        if (canManageSystem) {
            getAutoApprovalRule().then(rule => {
                if (rule) {
                    setAutoRule(rule);
                    setAutoAmount(rule.maxAmount.toString());
                    setAutoRequiresManager(rule.requiresManager);
                }
            });
        }
    }, [canManageSystem]);

    const handleSaveAutoRule = async () => {
        const amount = parseFloat(autoAmount);
        if (isNaN(amount) || amount < 0) { toast.error(locale === 'ar' ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount"); return; }
        setIsSavingAuto(true);
        const res = await setAutoApprovalRule(amount, autoRequiresManager);
        setIsSavingAuto(false);
        if (res?.error) toast.error(res.error);
        else { toast.success(locale === 'ar' ? "تم حفظ قاعدة الاعتماد التلقائي ✅" : "Auto-approval rule saved ✅"); getAutoApprovalRule().then(r => r && setAutoRule(r)); }
    };

    const handleDisableAutoRule = async () => {
        setIsSavingAuto(true);
        const res = await disableAutoApprovalRule();
        setIsSavingAuto(false);
        if (res?.error) toast.error(res.error);
        else { toast.success(locale === 'ar' ? "تم تعطيل الاعتماد التلقائي" : "Auto-approval disabled"); setAutoRule(null); }
    };

    const handleLogout = () => {
        startTransition(() => {
            logout();
        });
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "إدارة حسابك" : "Account Settings"}>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-6 w-full max-w-4xl mx-auto">

                {/* Settings Sidebar Menu */}
                {/* Settings Sidebar / Top Nav */}
                <Card className="w-full md:w-64 flex flex-col shrink-0 p-2 md:p-6 shadow-sm border-gray-100 rounded-2xl">
                    {/* Tab buttons — scroll on mobile, stack on desktop */}
                    <div className="flex md:flex-col gap-2 overflow-x-auto mobile-tabs-scroll md:overflow-visible pb-1 md:pb-0">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-3 font-bold text-xs md:text-sm rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-[#102550]/10 text-[#102550]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <User className="w-4 h-4 md:w-5 md:h-5" />
                            الملف الشخصي
                        </button>
                        <button
                            onClick={() => setActiveTab("phone")}
                            className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-3 font-bold text-xs md:text-sm rounded-xl transition-colors ${activeTab === 'phone' ? 'bg-[#102550]/10 text-[#102550]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Phone className="w-4 h-4 md:w-5 md:h-5" />
                            {locale === 'ar' ? 'رقم الجوال' : 'Phone'}
                        </button>
                        <button
                            onClick={() => setActiveTab("password")}
                            className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-3 font-bold text-xs md:text-sm rounded-xl transition-colors ${activeTab === 'password' ? 'bg-[#102550]/10 text-[#102550]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <Lock className="w-4 h-4 md:w-5 md:h-5" />
                            {locale === 'ar' ? 'كلمة المرور' : 'Password'}
                        </button>
                        {/* Admin-only: advanced settings */}
                        {canManageSystem && (
                            <button
                                onClick={() => setActiveTab("advanced")}
                                className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-4 py-3 font-bold text-xs md:text-sm rounded-xl transition-colors ${activeTab === 'advanced' ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
                                {locale === 'ar' ? 'إعدادات متقدمة' : 'Advanced Settings'}
                            </button>
                        )}
                    </div>
                    {/* Logout — always visible, outside the scroll area */}
                    <div className="pt-3 mt-2 border-t border-gray-100 md:pt-4 md:mt-4">
                        <Button type="button" disabled={isPending} isLoading={isPending} variant="danger" className="w-full flex items-center gap-2 md:gap-3 px-4 py-3 text-xs md:text-sm rounded-xl font-bold shadow-sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                            {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                        </Button>
                    </div>
                </Card>

                {/* Settings Content */}
                <Card className="flex-1 p-5 md:p-8 shadow-sm border-gray-100 rounded-2xl">
                    {activeTab === 'profile' && (
                        <>
                            <h3 className="text-base md:text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">{locale === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}</h3>
                            <form ref={profileFormRef} className="space-y-6 md:space-y-8" action={profileAction}>
                                {/* Profile Image Upload */}
                                <div className="mb-6 md:mb-8">
                                    <label className="block text-xs md:text-sm font-bold text-gray-400 mb-2">{locale === 'ar' ? 'الصورة الشخصية' : 'Profile Photo'}</label>
                                    <FileUpload
                                        name="image"
                                        accept="image/png, image/jpeg, image/webp"
                                        maxSizeMB={5}
                                        placeholder={locale === 'ar' ? "اضغط لرفع صورة شخصية" : "Click to upload photo"}
                                        description={locale === 'ar' ? "أو اسحب واسقط الصورة هنا" : "Or drag and drop here"}
                                        variant="avatar"
                                        previewUrl={user?.image || null}
                                    />
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Using design image style: label at top-right (small grey text), value below (bold black text), edit icon far-start */}
                                    <div className="relative group p-4 border border-gray-100 rounded-2xl bg-gray-50 focus-within:ring-2 focus-within:ring-[#102550]/50 focus-within:bg-white transition-all">
                                        <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-1">{locale === 'ar' ? 'اسم الموظف' : 'Employee Name'}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            defaultValue={user?.name || ""}
                                            className="w-full bg-transparent font-bold text-gray-900 text-sm md:text-base outline-none pr-1 focus:ring-0"
                                        />
                                        <div className="absolute start-4 top-1/2 -translate-y-1/2 text-[#102550] opacity-50 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                        </div>
                                    </div>

                                    <div className="relative group p-4 border border-gray-100 rounded-2xl bg-gray-50 focus-within:ring-2 focus-within:ring-[#102550]/50 focus-within:bg-white transition-all">
                                        <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-1">{locale === 'ar' ? 'البريد الالكتروني' : 'Email'}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            defaultValue={user?.email || ""}
                                            className="w-full bg-transparent font-bold text-gray-900 text-sm md:text-base outline-none pr-1 flex-1 focus:ring-0"
                                        />
                                        <div className="absolute start-4 top-1/2 -translate-y-1/2 text-[#102550] opacity-50 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                        </div>
                                    </div>

                                    <div className="relative group p-4 border border-gray-100 rounded-2xl bg-gray-50 transition-all md:col-span-2 flex items-center justify-between">
                                        <div className="flex-1 w-full">
                                            <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-1">{locale === 'ar' ? 'رقم الجوال' : 'Phone Number'}</label>
                                            <input
                                                type="tel"
                                                defaultValue={user?.phone || (locale === 'ar' ? "لم يتم تسجيل رقم جوال" : "No phone registered")}
                                                disabled
                                                className="w-full bg-transparent font-bold text-gray-600 text-sm md:text-base outline-none pr-1 dir-ltr text-right cursor-not-allowed"
                                                title={locale === 'ar' ? "لتغيير رقم الجوال الرجاء الانتقال الى تبويب رقم الجوال" : "To change phone go to Phone tab"}
                                            />
                                        </div>
                                        <button type="button" onClick={() => setActiveTab("phone")} className="shrink-0 me-2 text-[#102550] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-[#102550] hover:text-white transition-colors text-[10px] md:text-xs font-bold shadow-sm">
                                            {locale === 'ar' ? 'تغيير' : 'Change'}
                                        </button>
                                    </div>

                                    {/* Role badge — read-only, shows user's system role */}
                                    <div className="relative group p-4 border border-gray-100 rounded-2xl bg-gray-50 transition-all md:col-span-2">
                                        <label className="block text-[10px] md:text-xs font-bold text-gray-400 mb-1">{locale === 'ar' ? 'الدور في النظام' : 'System Role'}</label>
                                        <p className="font-bold text-gray-600 text-sm md:text-base">
                                            {roleNameAr}
                                        </p>
                                    </div>

                                </div>

                                <div className="pt-4 mt-6 md:mt-8 flex flex-col sm:flex-row gap-3">
                                    <Button variant="primary" type="submit" className="w-full sm:w-1/2 py-3 text-sm md:text-base font-bold rounded-xl shadow-sm" disabled={profilePending}>
                                        {profilePending ? (locale === 'ar' ? "جاري الحفظ..." : "Saving...") : (locale === 'ar' ? "حفظ التغييرات" : "Save Changes")}
                                    </Button>
                                    <Button variant="outline" type="button" className="w-full sm:w-1/2 py-3 text-sm md:text-base font-bold rounded-xl border-gray-200">
                                        {locale === 'ar' ? 'الغاء' : 'Cancel'}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}

                    {activeTab === 'phone' && (
                        <>
                            <h3 className="text-base md:text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">{locale === 'ar' ? 'تغيير رقم الجوال' : 'Change Phone Number'}</h3>
                            <form ref={phoneFormRef} className="space-y-6" action={phoneAction}>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-gray-400 mb-2">{locale === 'ar' ? 'رقم الجوال الجديد' : 'New Phone Number'}</label>
                                    <div className="w-full flex rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#102550] shadow-sm">
                                        <span className="px-5 py-4 bg-gray-50 border-e border-gray-200 text-gray-500 font-bold dir-ltr">+966</span>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="5XXXXXXXX"
                                            className="w-full p-4 outline-none bg-transparent text-gray-900 font-bold dir-ltr text-right placeholder:font-normal placeholder:text-gray-300"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button variant="primary" type="submit" className="w-full py-3.5 text-sm md:text-base font-bold rounded-xl shadow-sm" disabled={phonePending}>
                                    {phonePending ? (locale === 'ar' ? "جاري التحديث..." : "Updating...") : (locale === 'ar' ? "تحديث رقم الجوال" : "Update Phone Number")}
                                </Button>
                            </form>
                        </>
                    )}

                    {activeTab === 'password' && (
                        <>
                            <h3 className="text-base md:text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">{locale === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
                            <form ref={passwordFormRef} className="space-y-4 md:space-y-6" action={passwordAction}>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-gray-400 mb-2">{locale === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-[#102550] font-bold shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-gray-400 mb-2">{locale === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-[#102550] font-bold shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-gray-400 mb-2">{locale === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-[#102550] font-bold shadow-sm"
                                        required
                                    />
                                </div>
                                <Button variant="primary" type="submit" className="w-full py-3.5 text-sm md:text-base font-bold rounded-xl mt-4 shadow-sm" disabled={passwordPending}>
                                    {passwordPending ? (locale === 'ar' ? "جاري التحديث..." : "Updating...") : (locale === 'ar' ? "تحديث كلمة المرور" : "Update Password")}
                                </Button>
                            </form>
                        </>
                    )}

                    {activeTab === 'advanced' && canManageSystem && (
                        <>
                            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                                <ShieldCheck className="w-6 h-6 text-amber-600" />
                                <h3 className="text-base md:text-xl font-bold text-gray-900">الاعتماد التلقائي للفواتير</h3>
                            </div>

                            {/* Status badge */}
                            <div className={`flex items-center gap-2 mb-6 px-4 py-3 rounded-xl ${autoRule ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                                <span className={`w-2.5 h-2.5 rounded-full ${autoRule ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                <p className={`text-sm font-bold ${autoRule ? 'text-emerald-700' : 'text-gray-500'}`}>
                                    {autoRule
                                        ? (locale === 'ar' ? `مُفعَّل — الفواتير حتى ${autoRule.maxAmount.toLocaleString('en-US')} ${currency} تُعتمد تلقائياً` : `Enabled — Invoices up to ${autoRule.maxAmount.toLocaleString('en-US')} ${currency} auto-approved`)
                                        : (locale === 'ar' ? 'معطَّل — جميع الفواتير تحتاج موافقة يدوية' : 'Disabled — All invoices require manual approval')}
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-gray-600 mb-2">{locale === 'ar' ? `الحد الأقصى للاعتماد التلقائي (${currency})` : `Max auto-approval amount (${currency})`}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={autoAmount}
                                        onChange={e => setAutoAmount(e.target.value)}
                                        placeholder={locale === 'ar' ? "مثال: 500" : "e.g. 500"}
                                        className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-amber-400 font-bold shadow-sm"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{locale === 'ar' ? 'الفواتير بمبلغ أقل من أو يساوي هذا المبلغ ستُعتمد تلقائياً عند إنشائها.' : 'Invoices at or below this amount will be auto-approved on creation.'}</p>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <input
                                        id="requiresManager"
                                        type="checkbox"
                                        checked={autoRequiresManager}
                                        onChange={e => setAutoRequiresManager(e.target.checked)}
                                        className="w-4 h-4 accent-[#102550]"
                                    />
                                    <label htmlFor="requiresManager" className="text-sm font-bold text-gray-700 cursor-pointer">
                                        {locale === 'ar' ? 'يحتاج موافقة المدير حتى عند تجاوز الحد' : 'Requires manager approval even when exceeding limit'}
                                    </label>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button
                                        variant="primary"
                                        className="flex-1 font-bold rounded-xl h-11 bg-amber-600 hover:bg-amber-700"
                                        onClick={handleSaveAutoRule}
                                        disabled={isSavingAuto}
                                        isLoading={isSavingAuto}
                                    >
                                        {locale === 'ar' ? 'حفظ الإعداد' : 'Save Setting'}
                                    </Button>
                                    {autoRule && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 font-bold rounded-xl h-11 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={handleDisableAutoRule}
                                            disabled={isSavingAuto}
                                        >
                                            {locale === 'ar' ? 'تعطيل الاعتماد التلقائي' : 'Disable Auto-Approval'}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Global Currency Setting */}
                            <div className="pt-6 mt-6 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">{locale === 'ar' ? 'إعدادات العملة الافتراضية' : 'Default Currency Settings'}</h3>
                                <div className="space-y-4">
                                    <label className="block text-xs md:text-sm font-bold text-gray-600 mb-2">{locale === 'ar' ? 'اختر العملة للمشروع بأكمله' : 'Select project currency'}</label>
                                    <select
                                        value={currency}
                                        onChange={async (e) => {
                                            const newCurrency = e.target.value;
                                            setCurrency(newCurrency);
                                            const res = await updateGlobalCurrency(newCurrency);
                                            if (res.error) toast.error(res.error);
                                            else toast.success(locale === 'ar' ? "تم تحديث العملة بنجاح" : "Currency updated successfully");
                                        }}
                                        className="w-full rounded-xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-[#102550] font-bold shadow-sm"
                                    >
                                        <option value="ر.ق">ريال قطري (ر.ق)</option>
                                        <option value="ر.س">ريال سعودي (ر.س)</option>
                                        <option value="د.إ">درهم إماراتي (د.إ)</option>
                                        <option value="د.ك">دينار كويتي (د.ك)</option>
                                        <option value="ر.ع">ريال عماني (ر.ع)</option>
                                        <option value="د.ب">دينار بحريني (د.ب)</option>
                                        <option value="USD">دولار أمريكي (USD)</option>
                                        <option value="EUR">يورو (EUR)</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-2">{locale === 'ar' ? 'تحديث هذه العملة سيؤثر على جميع الحسابات والفواتير في النظام.' : 'Updating currency affects all calculations and invoices in the system.'}</p>
                                </div>
                            </div>
                        </>
                    )}

                </Card>
            </div>
        </DashboardLayout>
    );
}
