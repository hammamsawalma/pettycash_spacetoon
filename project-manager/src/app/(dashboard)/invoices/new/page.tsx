"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect, useRef } from "react";
import { getCategories } from "@/actions/categories";
import { getMyCustodies } from "@/actions/custody";
import { createInvoice } from "@/actions/invoices";
import { Project } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileUpload } from "@/components/ui/FileUpload";
import toast from "react-hot-toast";
import { Suspense } from "react";
import { Camera, FileText, CheckCircle, Trash2, Plus, ImageIcon, FolderOpen } from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { getProjectsForInvoice, getManagerAvailableCustody } from "@/actions/projects";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import { FormPageSkeleton } from "@/components/ui/FormPageSkeleton";

type InvoiceItemInput = {
    id: string; // temp id for UI
    name: string;
    itemNumber: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
};

// ─── Employee Simplified View — 4 خطوات ─────────────────────────────────────
function EmployeeInvoiceFlow({ projects, categories, defaultProjectId, defaultAmount, defaultDescription, purchaseId }: {
    projects: Project[];
    categories: Array<{ id: string; name: string; icon: string | null }>;
    defaultProjectId: string;
    defaultAmount: string;
    defaultDescription: string;
    purchaseId: string;
}) {
    const router = useRouter();
    const { locale } = useLanguage();
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId);
    const [amount, setAmount] = useState(defaultAmount);
    const [notes, setNotes] = useState(defaultDescription);
    const [categoryId, setCategoryId] = useState("");

    const handleFileSelect = (f: File) => {
        setFile(f);
        if (f.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(f);
        } else {
            setPreview(null);
        }
    };

    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { handleFileSelect(f); setCurrentStep(2); }
    };

    const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { handleFileSelect(f); setCurrentStep(2); }
    };

    const handleSubmit = async () => {
        if (!selectedProjectId) { toast.error(locale === 'ar' ? "يرجى اختيار المشروع" : "Please select a project"); return; }
        if (!amount || parseFloat(amount) <= 0) { toast.error(locale === 'ar' ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount"); return; }
        if (!file) { toast.error(locale === 'ar' ? "صورة الفاتورة إلزامية" : "Invoice image is required"); return; }

        setIsSubmitting(true);
        const fd = new FormData();
        fd.append("projectId", selectedProjectId);
        fd.append("amount", amount);
        fd.append("type", "SALES");
        fd.append("date", new Date().toISOString().split("T")[0]);
        if (notes) fd.append("notes", notes);
        if (categoryId) fd.append("categoryId", categoryId);
        fd.append("file", file);
        if (purchaseId) fd.append("purchaseId", purchaseId);
        // No paymentSource → auto-detect in backend

        const res = await createInvoice(null, fd);
        setIsSubmitting(false);

        if (res?.error) {
            toast.error(res.error);
        } else if (res?.success) {
            toast.success(res.autoApproved ? (locale === 'ar' ? "تم إنشاء الفاتورة واعتمادها تلقائياً ✅" : "Invoice created and auto-approved ✅") : (locale === 'ar' ? "تم تقديم الفاتورة للمراجعة ⏳" : "Invoice submitted for review ⏳"));
            sessionStorage.removeItem("invoices_cache");
            router.push("/invoices");
        }
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "رفع فاتورة" : "Upload Invoice"}>
            <div className={`pb-40 px-4 max-w-lg mx-auto ${locale === 'ar' ? '' : 'text-left'}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 pt-4 pb-6">
                    {([1, 2, 3, 4] as const).map(s => (
                        <div key={s} className={`transition-all rounded-full ${s === currentStep ? "w-6 h-2.5 bg-blue-600" :
                            s < currentStep ? "w-2.5 h-2.5 bg-blue-300" :
                                "w-2.5 h-2.5 bg-gray-200"
                            }`} />
                    ))}
                </div>

                {/* Hidden file inputs */}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraCapture} />
                <input ref={fileInputRef} type="file" accept="image/*, application/pdf" className="hidden" onChange={handleGallerySelect} />

                {/* ── Step 1: صورة الفاتورة (إجباري) ─────────────── */}
                {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center pb-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Camera className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900">{locale === 'ar' ? 'صوّر الفاتورة' : 'Capture Invoice'}</h1>
                            <p className="text-gray-500 text-sm mt-1">{locale === 'ar' ? 'الخطوة 1 من 4 — صورة واضحة للإيصال أو الفاتورة' : 'Step 1 of 4 — Clear photo of receipt or invoice'}</p>
                        </div>

                        <button onClick={() => cameraInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white py-8 rounded-3xl shadow-lg shadow-blue-200 active:scale-95 transition-transform">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Camera className="w-9 h-9" />
                            </div>
                            <div>
                                <p className="text-lg font-black">{locale === 'ar' ? 'صوّر الفاتورة' : 'Capture Invoice'}</p>
                                <p className="text-blue-200 text-sm">{locale === 'ar' ? 'افتح الكاميرا مباشرة' : 'Open camera directly'}</p>
                            </div>
                        </button>

                        <button onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-4 bg-white border border-gray-200 text-gray-700 py-5 px-6 rounded-2xl shadow-sm active:scale-95 transition-transform">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                <ImageIcon className="w-6 h-6 text-gray-500" />
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{locale === 'ar' ? 'اختر من المعرض' : 'Choose from gallery'}</p>
                                <p className="text-gray-400 text-xs">{locale === 'ar' ? 'صورة أو ملف PDF' : 'Image or PDF file'}</p>
                            </div>
                        </button>

                        <p className="text-center text-xs text-gray-400">{locale === 'ar' ? '⚠️ صورة الفاتورة إلزامية للمتابعة' : '⚠️ Invoice image is required to proceed'}</p>
                    </div>
                )}

                {/* ── Step 2: المبلغ ─────────────────────────────── */}
                {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* thumbnail */}
                        {preview ? (
                            <div className="relative w-full aspect-[4/3] max-h-44 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <Image src={preview} alt={locale === 'ar' ? 'فاتورة' : 'Invoice'} fill className="object-cover" />
                                <button onClick={() => { setFile(null); setPreview(null); setCurrentStep(1); }}
                                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1.5 shadow-md">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                                    <p className="text-white text-xs font-bold">{locale === 'ar' ? '✓ تم رفع الفاتورة' : '✓ Invoice uploaded'}</p>
                                </div>
                            </div>
                        ) : file ? (
                            <div className="flex items-center gap-3 px-4 py-4 bg-green-50 border border-green-200 rounded-2xl">
                                <FileText className="w-5 h-5 text-green-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-green-800 truncate">{file.name}</p>
                                    <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB ✓</p>
                                </div>
                                <button onClick={() => { setFile(null); setCurrentStep(1); }} className="text-red-500 shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : null}

                        <div className="text-center pb-2">
                            <h1 className="text-2xl font-black text-gray-900">{locale === 'ar' ? 'كم المبلغ؟' : 'What is the amount?'}</h1>
                            <p className="text-gray-500 text-sm mt-1">{locale === 'ar' ? 'الخطوة 2 من 4' : 'Step 2 of 4'}</p>
                        </div>

                        <Card className="p-5 border-gray-100 shadow-sm rounded-2xl">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-3">{locale === 'ar' ? 'المبلغ الإجمالي *' : 'Total Amount *'}</label>
                            <div className="flex items-baseline gap-2 overflow-hidden">
                                <input
                                    autoFocus
                                    type="number" inputMode="decimal" required step="0.01" min="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="flex-1 min-w-0 text-3xl md:text-5xl font-black text-blue-700 bg-transparent outline-none border-b-2 border-blue-200 focus:border-blue-500 pb-1 transition-colors placeholder-gray-200"
                                />
                                <span className="text-base md:text-xl font-bold text-gray-400 shrink-0 whitespace-nowrap"><CurrencyDisplay /></span>
                            </div>
                        </Card>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl flex gap-3">
                        <Button type="button" onClick={() => setCurrentStep(1)} variant="secondary" className="flex-none px-5 py-4 rounded-2xl font-bold">←</Button>
                        <Button type="button" onClick={() => {
                            if (!amount || parseFloat(amount) <= 0) { toast.error(locale === 'ar' ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount"); return; }
                            setCurrentStep(3);
                        }} variant="primary" className="flex-1 py-4 text-base font-black rounded-2xl shadow-lg shadow-blue-200">
                            {locale === 'ar' ? 'التالي ←' : 'Next →'}
                        </Button>
                    </div>
                )}

                {/* ── Step 3: اختيار المشروع ─────────────────────── */}
                {currentStep === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center pb-2">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FolderOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900">{locale === 'ar' ? 'اختر المشروع' : 'Select Project'}</h1>
                            <p className="text-gray-500 text-sm mt-1">{locale === 'ar' ? 'الخطوة 3 من 4' : 'Step 3 of 4'}</p>
                        </div>

                        {projects.length === 0 ? (
                            <div className="bg-gray-50 rounded-2xl p-6 text-center">
                                <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">{locale === 'ar' ? 'لا توجد مشاريع مسندة إليك' : 'No projects assigned to you'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 pb-4">
                                {projects.map((p) => (
                                    <button key={p.id} type="button"
                                        onClick={() => { setSelectedProjectId(p.id); setCurrentStep(4); }}
                                        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${selectedProjectId === p.id
                                            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                                            : "border-gray-100 bg-white shadow-sm"
                                            }`}>
                                        {selectedProjectId === p.id && (
                                            <div className="absolute top-2 left-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                        {p.image ? (
                                            <div className="w-14 h-14 rounded-xl overflow-hidden">
                                                <Image src={p.image} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
                                            </div>
                                        ) : (
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black ${selectedProjectId === p.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                                                }`}>{p.name.charAt(0)}</div>
                                        )}
                                        <p className={`text-xs font-bold text-center leading-tight line-clamp-2 ${selectedProjectId === p.id ? "text-blue-800" : "text-gray-700"
                                            }`}>{p.name}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
                        <Button type="button" onClick={() => setCurrentStep(2)} variant="secondary" className="w-full py-4 rounded-2xl font-bold">{locale === 'ar' ? '← رجوع' : '← Back'}</Button>
                    </div>
                )}

                {/* ── Step 4: ملاحظات + تقديم ────────────────────── */}
                {currentStep === 4 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center pb-2">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900">{locale === 'ar' ? 'تفاصيل إضافية' : 'Additional Details'}</h1>
                            <p className="text-gray-500 text-sm mt-1">{locale === 'ar' ? 'الخطوة 4 من 4 — يمكن تخطي كل الحقول' : 'Step 4 of 4 — All fields are optional'}</p>
                        </div>

                        {/* Summary chip */}
                        {selectedProjectId && (() => {
                            const proj = projects.find((p) => p.id === selectedProjectId);
                            return proj ? (
                                <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-3 border border-blue-100">
                                    {proj.image
                                        ? <Image src={proj.image} alt={proj.name} width={36} height={36} className="w-9 h-9 rounded-lg object-cover" />
                                        : <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-base font-black text-blue-700">{proj.name.charAt(0)}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-blue-400 font-bold">{locale === 'ar' ? 'المشروع' : 'Project'}</p>
                                        <p className="text-sm font-black text-blue-900 truncate">{proj.name}</p>
                                    </div>
                                    <button onClick={() => setCurrentStep(3)} className="text-xs text-blue-400 underline shrink-0">{locale === 'ar' ? 'تغيير' : 'Change'}</button>
                                </div>
                            ) : null;
                        })()}

                        {/* Category chips */}
                        {categories.length > 0 && (
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">{locale === 'ar' ? 'التصنيف (اختياري)' : 'Category (Optional)'}</label>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setCategoryId("")}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${categoryId === "" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"
                                            }`}>{locale === 'ar' ? 'غير مصنف' : 'Uncategorized'}</button>
                                    {categories.map((c) => (
                                        <button key={c.id} type="button" onClick={() => setCategoryId(c.id)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${categoryId === c.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
                                                }`}>{c.icon} {c.name}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-2">{locale === 'ar' ? 'ملاحظة (اختياري)' : 'Notes (Optional)'}</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                placeholder={locale === 'ar' ? "أي تفاصيل إضافية عن الفاتورة..." : "Any additional details about the invoice..."}
                                className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm shadow-sm bg-white" />
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl flex gap-3">
                        <Button type="button" onClick={() => setCurrentStep(3)} variant="secondary" className="flex-none px-5 py-4 rounded-2xl font-bold">←</Button>
                        <Button type="button" onClick={handleSubmit} disabled={isSubmitting} isLoading={isSubmitting}
                            variant="primary" className="flex-1 py-4 text-base font-black rounded-2xl shadow-lg shadow-blue-200">
                            {isSubmitting ? (locale === 'ar' ? "جاري الرفع..." : "Uploading...") : (locale === 'ar' ? "تقديم الفاتورة ✓" : "Submit Invoice ✓")}
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}



// ─── Full Invoice Form (Admin / Accountant / Coordinator) ────────────────────────
function FullInvoiceForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { locale } = useLanguage();
    const defaultProjectId = searchParams.get('projectId') || "";
    const purchaseId = searchParams.get('purchaseId') || "";
    const defaultAmount = searchParams.get('amount') || "";
    const defaultDescription = searchParams.get('description') || "";

    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { role } = useAuth();
    const canToggleCompanyExpense = role === 'ADMIN' || role === 'GLOBAL_ACCOUNTANT';

    // v5: Company expense toggle
    const [isCompanyExpense, setIsCompanyExpense] = useState(false);

    const [projects, setProjects] = useState<Project[]>([]);
    const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string | null }>>([]);

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        projectId: defaultProjectId,
        categoryId: "",
        reference: "",
        date: new Date().toISOString().split('T')[0],
        type: "SALES",
        amount: defaultAmount,
        notes: defaultDescription,
    });

    const [items, setItems] = useState<InvoiceItemInput[]>([]);

    useEffect(() => {
        getProjectsForInvoice().then(data => setProjects(data as unknown as Project[]));
    }, []);

    // v5: Reload categories when expense scope changes
    useEffect(() => {
        getCategories(isCompanyExpense ? "COMPANY" : "PROJECT").then(setCategories);
    }, [isCompanyExpense]);

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!file) {
                toast.error(locale === 'ar' ? "صورة الفاتورة إلزامية — لا يمكن المتابعة بدون إرفاق صورة أو ملف" : "Invoice image is required — cannot proceed without attachment");
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!isCompanyExpense && (!formData.projectId || !formData.amount)) {
                toast.error(locale === 'ar' ? "يرجى تعبئة جميع الحقول الإلزامية (المشروع، المبلغ)" : "Please fill all required fields (project, amount)");
                return;
            }
            if (isCompanyExpense && (!formData.amount || !formData.categoryId)) {
                toast.error(locale === 'ar' ? "المبلغ والتصنيف إلزامي لمصاريف الشركة" : "Amount and category are required for company expenses");
                return;
            }
            if (!formData.reference.trim()) {
                setFormData(prev => ({ ...prev, reference: `INV-${Date.now()}` }));
            }
            setCurrentStep(3);
        }
    };


    const addItem = () => {
        setItems([...items, {
            id: Date.now().toString(),
            name: "", itemNumber: "", description: "", quantity: 1, unitPrice: 0, totalPrice: 0
        }]);
    };

    const updateItem = (id: string, field: keyof InvoiceItemInput, value: string | number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const newItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice') {
                    newItem.totalPrice = Number(newItem.quantity) * Number(newItem.unitPrice);
                }
                return newItem;
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error(locale === 'ar' ? "صورة الفاتورة إلزامية" : "Invoice image is required");
            setCurrentStep(1);
            return;
        }

        const totalItemsPrice = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
        const invoiceAmount = Number(formData.amount);

        if (items.length > 0 && Math.abs(totalItemsPrice - invoiceAmount) > 0.1) {
            toast.error(locale === 'ar' ? `إجمالي التنسيقات (${totalItemsPrice}) لا يطابق مبلغ الفاتورة (${invoiceAmount})` : `Items total (${totalItemsPrice}) does not match invoice amount (${invoiceAmount})`);
            return;
        }

        setIsSubmitting(true);
        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => submitData.append(key, value));
        if (!formData.reference.trim()) submitData.set("reference", `INV-${Date.now()}`);
        if (file) submitData.append("file", file);
        if (items.length > 0) submitData.append("items", JSON.stringify(items));
        if (purchaseId) submitData.append("purchaseId", purchaseId);
        // v5: Company expense scope
        if (isCompanyExpense) submitData.set("expenseScope", "COMPANY");
        // No paymentSource → backend auto-detects

        const res = await createInvoice(null, submitData);
        setIsSubmitting(false);

        if (res?.error) {
            toast.error(res.error);
        } else if (res?.success) {
            toast.success(res.autoApproved ? (locale === 'ar' ? "تم إنشاء الفاتورة واعتمادها تلقائياً ✅" : "Invoice created and auto-approved ✅") : (locale === 'ar' ? "تم حفظ الفاتورة بنجاح وتحويلها للمراجعة ⏳" : "Invoice saved and sent for review ⏳"));
            sessionStorage.removeItem("invoices_cache");
            router.push("/invoices");
        }
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "إضافة فاتورة جديدة" : "Add New Invoice"}>
            <div className="pb-10 px-4 md:px-0" dir={locale === 'ar' ? 'rtl' : 'ltr'}>

                {/* Stepper Progress */}
                <div className="max-w-4xl mx-auto mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                        />
                    </div>

                    <div className="relative z-10 flex justify-between">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                <Camera className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-bold ${currentStep >= 1 ? 'text-blue-700' : 'text-gray-400'}`}>{locale === 'ar' ? 'المرفق' : 'Attachment'}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-bold ${currentStep >= 2 ? 'text-blue-700' : 'text-gray-400'}`}>{locale === 'ar' ? 'البيانات' : 'Details'}</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-bold ${currentStep >= 3 ? 'text-blue-700' : 'text-gray-400'}`}>{locale === 'ar' ? 'التنسيق (اختياري)' : 'Items (Optional)'}</span>
                        </div>
                    </div>
                </div>

                <Card className="max-w-4xl mx-auto p-5 md:p-8 border-gray-100 shadow-sm rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* STEP 1: UPLOAD FILE */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">{locale === 'ar' ? 'صوّر الفاتورة' : 'Upload Invoice'}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{locale === 'ar' ? 'التقط صورة واضحة للفاتورة أو ارفع ملف PDF' : 'Take a clear photo or upload a PDF file'}</p>
                                </div>
                                <FileUpload
                                    name="file"
                                    accept="application/pdf, image/png, image/jpeg"
                                    maxSizeMB={10}
                                    placeholder={locale === 'ar' ? "اضغط لرفع الفاتورة" : "Click to upload invoice"}
                                    description={locale === 'ar' ? "أو اسحب واسقط الصورة هنا" : "Or drag and drop the file here"}
                                    onChange={(uploadedFile) => setFile(uploadedFile)}
                                />
                                <div className="flex justify-end pt-4">
                                    <Button type="button" onClick={handleNextStep} variant="primary" disabled={!file} className="px-8 py-3 rounded-xl font-bold">
                                        {locale === 'ar' ? 'التالي ←' : 'Next →'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: INVOICE DATA */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 md:pb-0">
                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{locale === 'ar' ? 'تفاصيل الفاتورة الأساسية' : 'Basic Invoice Details'}</h3>

                                {/* v5: Company Expense Toggle — only for ADMIN + GLOBAL_ACCOUNTANT */}
                                {canToggleCompanyExpense && (
                                    <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-3 border border-purple-100">
                                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                                            <input
                                                type="checkbox"
                                                checked={isCompanyExpense}
                                                onChange={e => { setIsCompanyExpense(e.target.checked); if (e.target.checked) setFormData(prev => ({ ...prev, projectId: "" })); }}
                                                className="w-4 h-4 rounded accent-purple-600"
                                            />
                                            <span className="text-sm font-bold text-purple-900">{locale === 'ar' ? 'مصاريف شركة' : 'Company Expense'}</span>
                                        </label>
                                        <span className="text-xs text-purple-600">{isCompanyExpense ? (locale === 'ar' ? 'بلا مشروع — تصنيف إلزامي' : 'No project — category required') : (locale === 'ar' ? 'فاتورة مشروع عادية' : 'Regular project invoice')}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Project selection — hidden for company expenses */}
                                    {!isCompanyExpense && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'المشروع *' : 'Project *'}</label>
                                            {projects.length === 0 ? (
                                                <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm">{locale === 'ar' ? 'لا توجد مشاريع' : 'No projects available'}</div>
                                            ) : projects.length <= 6 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {projects.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, projectId: p.id })}
                                                            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 text-center ${formData.projectId === p.id
                                                                ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                                                : 'border-gray-100 bg-white shadow-sm hover:border-gray-200'
                                                                }`}
                                                        >
                                                            {formData.projectId === p.id && (
                                                                <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                                                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                                </div>
                                                            )}
                                                            {p.image ? (
                                                                <Image src={p.image} alt={p.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                                                            ) : (
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black ${formData.projectId === p.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                                    }`}>{p.name.charAt(0)}</div>
                                                            )}
                                                            <p className={`text-xs font-bold leading-tight line-clamp-2 ${formData.projectId === p.id ? 'text-blue-800' : 'text-gray-700'
                                                                }`}>{p.name}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                // Fallback to select for large project lists
                                                <select
                                                    value={formData.projectId}
                                                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                                    required
                                                    className="w-full rounded-xl border border-gray-200 p-3.5 min-h-[52px] outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm font-medium"
                                                >
                                                    <option value="">{locale === 'ar' ? 'اختر المشروع' : 'Select Project'}</option>
                                                    {projects.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? `تصنيف المصروف ${isCompanyExpense ? '*' : ''}` : `Expense Category ${isCompanyExpense ? '*' : ''}`}</label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                            required={isCompanyExpense}
                                            className="w-full rounded-xl border border-gray-200 p-3.5 outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm font-medium"
                                        >
                                            <option value="">{isCompanyExpense ? (locale === 'ar' ? 'اختر التصنيف (إلزامي)' : 'Select Category (Required)') : (locale === 'ar' ? 'غير مصنف...' : 'Uncategorized...')}</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'المبلغ الإجمالي *' : 'Total Amount *'}</label>
                                        <div className="flex items-baseline gap-2 border-b-2 border-blue-200 focus-within:border-blue-500 transition-colors pb-1 overflow-hidden">
                                            <input
                                                type="number"
                                                required step="0.01" min="0.1"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                inputMode="decimal"
                                                className="flex-1 min-w-0 text-xl md:text-3xl font-black text-blue-700 bg-transparent outline-none placeholder-gray-200"
                                            />
                                            <span className="text-sm md:text-lg font-bold text-gray-400 shrink-0 whitespace-nowrap"><CurrencyDisplay /></span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'الرقم المرجعي (اختياري)' : 'Reference Number (Optional)'}</label>
                                        <input
                                            type="text"
                                            value={formData.reference}
                                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                            placeholder={locale === 'ar' ? "يتولد تلقائياً إذا تُرك فارغاً" : "Auto-generated if left empty"}
                                            className="w-full rounded-xl border border-gray-200 p-3.5 min-h-[52px] outline-none focus:ring-2 focus:ring-blue-400 shadow-sm font-medium"
                                        />
                                    </div>


                                </div>

                                {/* Fixed bottom nav bar for mobile step navigation */}
                                <div className="fixed bottom-0 inset-x-0 z-50 md:static bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-0 md:border-0 md:bg-transparent md:flex md:justify-between md:pt-4 flex gap-3">
                                    <Button type="button" onClick={() => setCurrentStep(1)} variant="secondary" className="flex-1 md:flex-none md:px-6 py-3 rounded-xl font-bold">
                                        {locale === 'ar' ? '← رجوع' : '← Back'}
                                    </Button>
                                    <Button type="button" onClick={handleNextStep} variant="primary" className="flex-1 md:flex-none md:px-8 py-3 rounded-xl font-bold">
                                        {locale === 'ar' ? 'التالي (التنسيق) ←' : 'Next (Items) →'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: ITEMS (TANSIQ) */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{locale === 'ar' ? 'تنسيق الفاتورة (البنود)' : 'Invoice Items'}</h3>
                                    <Button type="button" onClick={addItem} variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 flex items-center gap-1 px-3 py-1.5 rounded-lg">
                                        <Plus className="w-4 h-4" /> {locale === 'ar' ? 'إضافة مشتريات' : 'Add Item'}
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">{locale === 'ar' ? 'اختياري - يمكنك تفريغ محتوى الفاتورة هنا ليسهل مراجعتها.' : 'Optional - You can itemize the invoice contents for easier review.'}</p>

                                {items.length === 0 ? (
                                    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center text-gray-400">
                                        {locale === 'ar' ? 'لم تقم بإضافة بنود. الفاتورة ستُسجل كمبلغ إجمالي فقط.' : 'No items added. The invoice will be recorded as a lump sum only.'}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col md:flex-row gap-3 relative group">
                                                <button type="button" onClick={() => removeItem(item.id)} className="absolute -left-2 -top-2 bg-red-100 text-red-600 rounded-full p-1 border border-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="flex-1 space-y-3">
                                                    <div className="flex gap-2">
                                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">{index + 1}</span>
                                                        <input type="text" placeholder={locale === 'ar' ? 'اسم المشتريات / السلعة' : 'Item Name'} value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="flex-1 bg-transparent border-b border-gray-200 focus:border-blue-400 outline-none text-sm font-semibold pb-1" required />
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 block mb-1">{locale === 'ar' ? 'الرقم/الكود' : 'Code/SKU'}</label>
                                                            <input type="text" value={item.itemNumber} onChange={e => updateItem(item.id, 'itemNumber', e.target.value)} className="w-full bg-gray-50 rounded p-1.5 focus:bg-white border focus:border-blue-300 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 block mb-1">{locale === 'ar' ? 'الكمية' : 'Qty'}</label>
                                                            <input type="number" min="1" step="any" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="w-full bg-gray-50 rounded p-1.5 focus:bg-white border focus:border-blue-300 outline-none" required />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 block mb-1">{locale === 'ar' ? 'سعر الإفرادي' : 'Unit Price'}</label>
                                                            <input type="number" min="0" step="any" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} className="w-full bg-gray-50 rounded p-1.5 focus:bg-white border focus:border-blue-300 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-blue-600 font-bold block mb-1">{locale === 'ar' ? 'الإجمالي' : 'Total'}</label>
                                                            <input type="number" min="0" step="any" value={item.totalPrice} onChange={e => updateItem(item.id, 'totalPrice', e.target.value)} className="w-full bg-blue-50 text-blue-800 rounded p-1.5 font-bold border-none outline-none" required />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                                            <span className="text-sm font-bold text-gray-600">{locale === 'ar' ? 'مجموع التنسيقات:' : 'Items Total:'}</span>
                                            <span className="font-bold text-lg text-gray-900">{items.reduce((s, i) => s + Number(i.totalPrice), 0).toLocaleString("en-GB")} <CurrencyDisplay /></span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 mt-4">
                                    <label className="text-sm font-bold text-gray-700">{locale === 'ar' ? 'ملاحظة عامة للإدارة (اختياري)' : 'General Notes for Management (Optional)'}</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                        placeholder={locale === 'ar' ? "أي ملاحظات إضافية بخصوص الفاتورة..." : "Any additional notes about the invoice..."}
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm shadow-sm"
                                    />
                                </div>

                                <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
                                    <Button type="button" onClick={() => setCurrentStep(2)} variant="outline" className="px-6 py-3 rounded-xl font-bold bg-gray-50 text-gray-700">
                                        {locale === 'ar' ? '← رجوع للمعلومات' : '← Back to Details'}
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} variant="primary" className="px-10 py-3 text-lg rounded-xl font-bold shadow-sm animate-pulse-once">
                                        {isSubmitting ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'تقديم الفاتورة للتدقيق ✓' : 'Submit Invoice for Review ✓')}
                                    </Button>
                                </div>
                            </div>
                        )}

                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}

// ─── Root — choose flow by role ─────────────────────────────────────────────────
function NewInvoicePageInner() {
    const { role } = useAuth();
    const { locale } = useLanguage();
    const searchParams = useSearchParams();
    const defaultProjectId = searchParams.get('projectId') || "";
    const purchaseId = searchParams.get('purchaseId') || "";
    const defaultAmount = searchParams.get('amount') || "";
    const defaultDescription = searchParams.get('description') || "";

    const [projects, setProjects] = useState<Project[]>([]);
    const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string | null }>>([]);

    useEffect(() => {
        getProjectsForInvoice().then(data => setProjects(data as unknown as Project[]));
        getCategories("PROJECT").then(setCategories);
    }, []);

    // USER gets the simplified mobile-first flow
    if (role === "USER") {
        return (
            <EmployeeInvoiceFlow
                projects={projects}
                categories={categories}
                defaultProjectId={defaultProjectId}
                defaultAmount={defaultAmount}
                defaultDescription={defaultDescription}
                purchaseId={purchaseId}
            />
        );
    }

    // GENERAL_MANAGER is view-only — redirect to invoice list
    if (role === "GENERAL_MANAGER") {
        return (
            <DashboardLayout title={locale === 'ar' ? "غير مصرح" : "Not Authorized"}>
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{locale === 'ar' ? 'غير مصرح لك بإضافة فاتورة' : 'You are not authorized to add an invoice'}</h2>
                    <p className="text-gray-500 text-sm max-w-xs">{locale === 'ar' ? 'المدير العام لديه صلاحية العرض فقط. إضافة الفواتير متاحة للموظفين والمحاسبين ومدراء المشاريع.' : 'General Manager has view-only access. Adding invoices is available for employees, accountants, and project managers.'}</p>
                    <Link href="/invoices" className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700 transition-all">
                        {locale === 'ar' ? 'العودة لقائمة الفواتير' : 'Back to Invoices'}
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    // All other authorized roles get the full form
    return <FullInvoiceForm />;
}

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<FormPageSkeleton title="Add New Invoice" />}>
            <NewInvoicePageInner />
        </Suspense>
    );
}
