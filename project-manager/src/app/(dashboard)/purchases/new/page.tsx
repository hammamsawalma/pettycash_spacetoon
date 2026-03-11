"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect, useActionState, useRef } from "react";
import { getProjectsForPurchase } from "@/actions/projects";
import { createPurchase, createBatchPurchases } from "@/actions/purchases";
import { Project } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Suspense } from "react";
import { useCanDo } from "@/components/auth/Protect";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { FormPageSkeleton } from "@/components/ui/FormPageSkeleton";
import { Camera, ImagePlus, X, FileSpreadsheet, Upload, Check, Sparkles, Edit3, Trash2, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";

interface ParsedItem {
    description: string;
    quantity: string;
    notes: string;
    selected: boolean;
}

type Step = 'upload' | 'review' | 'confirm';

function NewPurchaseForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultProjectId = searchParams.get('projectId') || "";
    const { isCoordinatorInAny, role } = useAuth();
    const { locale } = useLanguage();
    const canCreate = useCanDo('purchases', 'createGlobal') || (role === 'USER' && isCoordinatorInAny);

    const [projects, setProjects] = useState<Project[]>([]);
    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

    // ─── Single Purchase State ───
    const [state, formAction, isPending] = useActionState(createPurchase, null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    // ─── Bulk Purchase State ───
    const [step, setStep] = useState<Step>('upload');
    const [bulkProjectId, setBulkProjectId] = useState(defaultProjectId);
    const [batchLabel, setBatchLabel] = useState("");
    const [items, setItems] = useState<ParsedItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!canCreate) {
            toast.error(locale === 'ar' ? "ليس لديك صلاحية لإنشاء طلبات الشراء" : "You do not have permission to create purchase requests");
            router.replace("/purchases");
            return;
        }
        getProjectsForPurchase().then(data => setProjects(data as unknown as Project[]));
    }, [canCreate]);

    // Handle single purchase success
    useEffect(() => {
        if (state?.success) {
            sessionStorage.removeItem("purchases_cache");
            router.push("/purchases");
        }
    }, [state, router]);

    // ─── Single Purchase Methods ───
    const handleImageSelect = (file: File | null) => {
        if (!file) {
            setImageFile(null);
            setImagePreview(null);
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error(locale === 'ar' ? "نوع الملف غير مدعوم. يرجى رفع صورة (JPG/PNG/WEBP) أو PDF" : "Unsupported file type. Please upload an image (JPG/PNG/WEBP) or PDF");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(locale === 'ar' ? "حجم الملف يتجاوز الحد المسموح (5 ميجابايت)" : "File size exceeds limit (5MB)");
            return;
        }

        setImageFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (cameraRef.current) cameraRef.current.value = "";
        if (galleryRef.current) galleryRef.current.value = "";
    };

    // ─── Bulk Purchase Methods ───
    const handleFileUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) {
            toast.error(locale === 'ar' ? "يرجى اختيار ملف Excel أولاً" : "Please select an Excel file first");
            return;
        }
        if (!bulkProjectId) {
            toast.error(locale === 'ar' ? "يرجى اختيار المشروع أولاً" : "Please select a project first");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/parse-purchases', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                toast.error(data.error || (locale === 'ar' ? 'حدث خطأ في التحليل' : 'Analysis error occurred'));
                setIsUploading(false);
                return;
            }

            const parsed: ParsedItem[] = data.items.map((item: any) => ({
                ...item,
                selected: true,
            }));

            setItems(parsed);
            setStep('review');
            toast.success(locale === 'ar' ? `تم تحليل ${parsed.length} عنصر بنجاح ✨` : `Successfully analyzed ${parsed.length} items ✨`);
        } catch (err) {
            toast.error(locale === 'ar' ? "حدث خطأ في الاتصال بالخادم" : "Server connection error");
        } finally {
            setIsUploading(false);
        }
    };

    const toggleItem = (index: number) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
    };

    const editItem = (index: number, field: keyof ParsedItem, value: string) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const addManualItem = () => {
        setItems(prev => [...prev, { description: '', quantity: '1', notes: '', selected: true }]);
    };

    const handleSubmitBulk = async () => {
        const selectedItems = items.filter(i => i.selected && i.description.trim());
        if (selectedItems.length === 0) {
            toast.error(locale === 'ar' ? "يرجى اختيار عنصر واحد على الأقل" : "Please select at least one item");
            return;
        }

        setIsSubmittingBulk(true);

        const result = await createBatchPurchases({
            projectId: bulkProjectId,
            batchLabel: batchLabel || (locale === 'ar' ? `دفعة مشتريات` : `Purchase Batch`),
            items: selectedItems.map(({ description, quantity, notes }) => ({
                description, quantity, notes
            })),
        });

        setIsSubmittingBulk(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(locale === 'ar' ? `تم إنشاء ${result.count} طلب شراء بنجاح! 🎉` : `Successfully created ${result.count} purchase requests! 🎉`);
            router.push('/purchases');
        }
    };

    const selectedCount = items.filter(i => i.selected && i.description.trim()).length;

    return (
        <DashboardLayout title={locale === 'ar' ? "اضافة طلب شراء جديد" : "New Purchase Request"}>
            <div className="pb-6 max-w-4xl mx-auto">
                
                {/* ─── Type Selection Tabs ─── */}
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-6 shadow-inner mx-auto max-w-lg">
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'single'
                                ? 'bg-white text-[#102550] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        {locale === 'ar' ? 'عنصر واحد' : 'Single Item'}
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'bulk'
                                ? 'bg-white text-[#102550] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        {locale === 'ar' ? 'إضافة مجمعة (Excel)' : 'Bulk Import (Excel)'}
                    </button>
                </div>

                {activeTab === 'single' ? (
                    /* ─── SINGLE PURCHASE FORM ─── */
                    <Card className="p-5 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                        {state?.error && (
                            <div className="mb-6 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:text-red-400" role="alert">
                                {state.error}
                            </div>
                        )}
                        <form className="space-y-6 md:space-y-8" encType="multipart/form-data" action={(formData) => {
                            const projectId = formData.get("projectId");
                            const quantity = formData.get("quantity");
                            const description = formData.get("description");

                            if (!projectId) {
                                toast.error(locale === 'ar' ? "يرجى اختيار المشروع" : "Please select a project");
                                return;
                            }
                            if (!description) {
                                toast.error(locale === 'ar' ? "يرجى كتابة وصف تفصيلي للطلب" : "Please write a detailed description");
                                return;
                            }
                            if (!quantity) {
                                toast.error(locale === 'ar' ? "الكمية مطلوبة للمتابعة" : "Quantity is required");
                                return;
                            }

                            if (imageFile) formData.set("image", imageFile);
                            formAction(formData);
                        }}>

                            <div className="space-y-4">
                                <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{locale === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'المشروع' : 'Project'}</label>
                                        <select name="projectId" required defaultValue={defaultProjectId} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium min-h-[52px]">
                                            <option value="">{locale === 'ar' ? 'اختر المشروع' : 'Select Project'}</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'الموعد النهائي لموافقة الطلب (اختياري)' : 'Request Approval Deadline (Optional)'}</label>
                                        <input type="date" name="deadline" className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium min-h-[52px]" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'الكمية' : 'Quantity'}</label>
                                        <input type="text" name="quantity" required inputMode="numeric" placeholder={locale === 'ar' ? "مثال: 3 حبات، 2 كرتون..." : "e.g. 3 pieces, 2 boxes..."} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium min-h-[52px]" />
                                    </div>

                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'وصف الطلب' : 'Request Description'}</label>
                                        <textarea name="description" required rows={4} placeholder={locale === 'ar' ? "اكتب وصف تفصيلي للمشتريات..." : "Write a detailed description of purchases..."} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] resize-none text-xs md:text-sm shadow-sm font-medium" />
                                    </div>

                                    {/* Image Upload Section */}
                                    <div className="space-y-3 col-span-1 md:col-span-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'مرفق الشراء (اختياري)' : 'Purchase Attachment (Optional)'}</label>
                                        <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />
                                        <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />

                                        {imageFile ? (
                                            <div className="relative group">
                                                {imagePreview ? (
                                                    <div className="relative w-full aspect-[16/9] max-h-56 rounded-2xl overflow-hidden border-2 border-dashed border-[#102550]/30 bg-gray-50">
                                                        <Image src={imagePreview} alt={locale === 'ar' ? "معاينة الصورة" : "Image preview"} fill className="object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full rounded-2xl border-2 border-dashed border-[#102550]/30 bg-gray-50 p-6 text-center">
                                                        <p className="text-sm font-bold text-gray-600">{imageFile.name}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                )}
                                                <button type="button" onClick={removeImage} className="absolute -top-2 -left-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full p-1.5 shadow-md transition-all z-10">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button type="button" onClick={() => cameraRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#102550]/50 hover:bg-[#102550]/5 transition-all duration-200 active:scale-[0.98] group">
                                                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-[#102550]/10 transition-colors">
                                                        <Camera className="w-6 h-6 text-blue-500 group-hover:text-[#102550]" />
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-gray-600 group-hover:text-[#102550]">📷 {locale === 'ar' ? 'التقاط صورة' : 'Take Photo'}</span>
                                                    <span className="text-[10px] text-gray-400">{locale === 'ar' ? 'فتح الكاميرا مباشرة' : 'Open camera directly'}</span>
                                                </button>
                                                <button type="button" onClick={() => galleryRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#102550]/50 hover:bg-[#102550]/5 transition-all duration-200 active:scale-[0.98] group">
                                                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-[#102550]/10 transition-colors">
                                                        <ImagePlus className="w-6 h-6 text-emerald-500 group-hover:text-[#102550]" />
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-gray-600 group-hover:text-[#102550]">🖼️ {locale === 'ar' ? 'اختيار صورة' : 'Choose Image'}</span>
                                                    <span className="text-[10px] text-gray-400">{locale === 'ar' ? 'من المعرض أو ملف PDF' : 'From gallery or PDF file'}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="fixed bottom-0 inset-x-0 md:static bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-0 md:border-0 md:bg-transparent md:flex md:justify-end md:gap-3 md:pt-6 md:mt-6 md:border-t md:border-gray-100 space-y-2 md:space-y-0">
                                <Button type="submit" disabled={isPending} isLoading={isPending} variant="primary" className="w-full md:w-auto px-8 py-4 rounded-2xl font-bold shadow-sm text-sm active:scale-[0.98] transition-transform">
                                    {locale === 'ar' ? 'حفظ الطلب ✓' : 'Save Request ✓'}
                                </Button>
                                <button type="button" onClick={() => router.push('/purchases')} className="w-full md:w-auto py-3 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors text-center">
                                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </form>
                    </Card>
                ) : (
                    /* ─── BULK PROCHASE FORM ─── */
                    <div className="space-y-6">
                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {[
                                { key: 'upload' as Step, label: locale === 'ar' ? 'رفع الملف' : 'Upload File', num: 1 },
                                { key: 'review' as Step, label: locale === 'ar' ? 'مراجعة' : 'Review', num: 2 },
                                { key: 'confirm' as Step, label: locale === 'ar' ? 'تأكيد' : 'Confirm', num: 3 },
                            ].map(({ key, label, num }) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${step === key ? 'bg-[#102550] text-white shadow-md' : (step === 'review' && key === 'upload') || (step === 'confirm') ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {((step === 'review' && key === 'upload') || (step === 'confirm' && key !== 'confirm')) ? <Check className="w-4 h-4" /> : num}
                                    </div>
                                    <span className={`text-xs font-bold hidden sm:block ${step === key ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                                    {key !== 'confirm' && <div className="w-8 h-0.5 bg-gray-200 rounded-full" />}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Upload */}
                        {step === 'upload' && (
                            <Card className="p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 mx-auto bg-[#102550]/10 rounded-2xl flex items-center justify-center mb-4">
                                        <FileSpreadsheet className="w-8 h-8 text-[#102550]" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">{locale === 'ar' ? 'إضافة مشتريات عبر Excel الذكي' : 'Import Purchases via Smart Excel'}</h2>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                                        {locale === 'ar' ? 'ارفع ملف Excel يحتوي على قائمة مشتريات. الذكاء الاصطناعي سيحلل المحتوى تلقائياً بغض النظر عن شكل أو لغة الملف.' : 'Upload an Excel file with a list of purchases. AI will automatically analyze the content regardless of file format or language.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'المشروع *' : 'Project *'}</label>
                                        <select value={bulkProjectId} onChange={(e) => setBulkProjectId(e.target.value)} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium min-h-[52px]">
                                            <option value="">{locale === 'ar' ? 'اختر المشروع' : 'Select Project'}</option>
                                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs md:text-sm font-bold text-gray-700">{locale === 'ar' ? 'تسمية الدفعة (اختياري)' : 'Batch Name (Optional)'}</label>
                                        <input type="text" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} placeholder={locale === 'ar' ? "مثال: مستلزمات مكتبية - مارس 2026" : "e.g. Office supplies - March 2026"} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium min-h-[52px]" />
                                    </div>
                                </div>

                                {/* File Upload Area */}
                                <div onClick={() => fileRef.current?.click()} className="relative border-2 border-dashed border-gray-200 hover:border-[#102550]/50 rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 hover:bg-[#102550]/5 group">
                                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={() => {
                                        const file = fileRef.current?.files?.[0];
                                        if (file) toast.success(`تم اختيار: ${file.name}`);
                                    }} />
                                    <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4 group-hover:text-[#102550] transition-colors" />
                                    <p className="text-sm font-bold text-gray-600 group-hover:text-[#102550]">{locale === 'ar' ? 'اضغط لاختيار ملف Excel' : 'Click to select Excel file'}</p>
                                    <p className="text-xs text-gray-400 mt-2">{locale === 'ar' ? 'يدعم: .xlsx, .xls, .csv — حتى 10 ميجابايت' : 'Supports: .xlsx, .xls, .csv — up to 10MB'}</p>
                                </div>

                                <Button onClick={handleFileUpload} disabled={isUploading || !bulkProjectId} isLoading={isUploading} variant="primary" className="w-full py-4 rounded-2xl font-bold text-sm">
                                    {isUploading ? (
                                        <span className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 animate-pulse" />
                                            {locale === 'ar' ? 'جاري تحليل الملف بالذكاء الاصطناعي...' : 'Analyzing file with AI...'}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            {locale === 'ar' ? 'تحليل الملف' : 'Analyze File'}
                                        </span>
                                    )}
                                </Button>
                            </Card>
                        )}

                        {/* Step 2: Review */}
                        {step === 'review' && (
                            <Card className="p-5 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-amber-500" />
                                            {locale === 'ar' ? `نتائج التحليل (${items.length} عنصر)` : `Analysis Results (${items.length} items)`}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">{locale === 'ar' ? 'راجع البيانات المستخرجة وعدّل ما يلزم' : 'Review extracted data and edit as needed'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => { setStep('upload'); setItems([]); }} className="text-xs font-bold">{locale === 'ar' ? 'إعادة الرفع' : 'Re-upload'}</Button>
                                        <Button variant="outline" onClick={addManualItem} className="text-xs font-bold gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                                            <Plus className="w-3.5 h-3.5" />
                                            {locale === 'ar' ? 'إضافة يدوي' : 'Add Manually'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <div key={index} className={`rounded-xl border p-4 transition-all ${item.selected ? 'border-[#102550]/20 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                                            <div className="flex items-start gap-3">
                                                <button onClick={() => toggleItem(index)} className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${item.selected ? 'bg-[#102550] border-[#102550] text-white' : 'border-gray-300 hover:border-[#102550]'}`}>
                                                    {item.selected && <Check className="w-3 h-3" />}
                                                </button>
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                                                    <div className="sm:col-span-5 space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">{locale === 'ar' ? 'الوصف' : 'Description'}</label>
                                                        <input type="text" value={item.description} onChange={(e) => editItem(index, 'description', e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#102550]/30" placeholder={locale === 'ar' ? "وصف المنتج" : "Product description"} />
                                                    </div>
                                                    <div className="sm:col-span-2 space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">{locale === 'ar' ? 'الكمية' : 'Qty'}</label>
                                                        <input type="text" value={item.quantity} onChange={(e) => editItem(index, 'quantity', e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#102550]/30" placeholder="1" />
                                                    </div>
                                                    <div className="sm:col-span-4 space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                                                        <input type="text" value={item.notes} onChange={(e) => editItem(index, 'notes', e.target.value)} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#102550]/30" placeholder={locale === 'ar' ? "ملاحظات اختيارية" : "Optional notes"} />
                                                    </div>
                                                    <div className="sm:col-span-1 flex items-end justify-center">
                                                        <button onClick={() => removeItem(index)} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-600 font-bold">
                                        {locale === 'ar' ? `${selectedCount} عنصر مختار من أصل ${items.length}` : `${selectedCount} selected out of ${items.length}`}
                                    </p>
                                    <Button onClick={() => setStep('confirm')} disabled={selectedCount === 0} variant="primary" className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm">
                                        {locale === 'ar' ? `متابعة للتأكيد (${selectedCount} عنصر) ←` : `Proceed to Confirm (${selectedCount} items) →`}
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Step 3: Confirm */}
                        {step === 'confirm' && (
                            <Card className="p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                                        <Check className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900">{locale === 'ar' ? 'تأكيد الإنشاء' : 'Confirm Creation'}</h2>
                                    <p className="text-sm text-gray-500">
                                        {locale === 'ar'
                                            ? <>سيتم إنشاء <strong className="text-[#102550]">{selectedCount} طلب شراء</strong> في مشروع{' '}<strong className="text-[#102550]">{projects.find(p => p.id === bulkProjectId)?.name}</strong></>
                                            : <>Will create <strong className="text-[#102550]">{selectedCount} purchase requests</strong> in project{' '}<strong className="text-[#102550]">{projects.find(p => p.id === bulkProjectId)?.name}</strong></>}
                                    </p>
                                    {batchLabel && (
                                        <p className="text-xs text-gray-400 bg-gray-50 inline-block px-3 py-1 rounded-lg mt-2">
                                            {locale === 'ar' ? 'تسمية الدفعة:' : 'Batch Name:'} {batchLabel}
                                        </p>
                                    )}
                                </div>

                                <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-100">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-gray-50 text-xs text-gray-500 font-bold">
                                            <tr>
                                                <th className="px-4 py-3">#</th>
                                                <th className="px-4 py-3">{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                                                <th className="px-4 py-3">{locale === 'ar' ? 'الكمية' : 'Qty'}</th>
                                                <th className="px-4 py-3">{locale === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {items.filter(i => i.selected && i.description.trim()).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-bold text-gray-900">{item.description}</td>
                                                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs">{item.notes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button variant="outline" onClick={() => setStep('review')} className="flex-1 py-4 rounded-2xl font-bold text-sm">
                                        <Edit3 className="w-4 h-4 ml-2" />
                                        {locale === 'ar' ? 'العودة للتعديل' : 'Back to Edit'}
                                    </Button>
                                    <Button onClick={handleSubmitBulk} disabled={isSubmittingBulk} isLoading={isSubmittingBulk} variant="primary" className="flex-1 py-4 rounded-2xl font-bold text-sm">
                                        {isSubmittingBulk ? (locale === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (locale === 'ar' ? `إنشاء ${selectedCount} طلب شراء ✓` : `Create ${selectedCount} Purchase Requests ✓`)}
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function NewPurchasePage() {
    const { locale } = useLanguage();
    return (
        <Suspense fallback={<FormPageSkeleton title={locale === 'ar' ? "اضافة طلب شراء جديد" : "New Purchase Request"} />}>
            <NewPurchaseForm />
        </Suspense>
    );
}
