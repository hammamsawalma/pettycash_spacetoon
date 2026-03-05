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
import { FileUpload } from "@/components/ui/FileUpload";
import toast from "react-hot-toast";
import { Suspense } from "react";
import { Camera, FileText, CheckCircle, Trash2, Plus, ImageIcon, FolderOpen } from "lucide-react";
import { getProjects, getManagerAvailableCustody } from "@/actions/projects";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

type InvoiceItemInput = {
    id: string; // temp id for UI
    name: string;
    itemNumber: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
};

// ─── Employee Simplified View ──────────────────────────────────────────────────
function EmployeeInvoiceFlow({ projects, categories, defaultProjectId, defaultAmount, defaultDescription, purchaseId }: {
    projects: any[];
    categories: any[];
    defaultProjectId: string;
    defaultAmount: string;
    defaultDescription: string;
    purchaseId: string;
}) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
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
        if (f) handleFileSelect(f);
        setCurrentStep(2);
    };

    const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFileSelect(f);
        setCurrentStep(2);
    };

    const handleSubmit = async () => {
        if (!selectedProjectId) {
            toast.error("يرجى اختيار المشروع");
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("يرجى إدخال مبلغ صحيح");
            return;
        }

        setIsSubmitting(true);
        const fd = new FormData();
        fd.append("projectId", selectedProjectId);
        fd.append("amount", amount);
        fd.append("type", "SALES");
        fd.append("date", new Date().toISOString().split("T")[0]);
        if (notes) fd.append("notes", notes);
        if (categoryId) fd.append("categoryId", categoryId);
        if (file) fd.append("file", file);
        if (purchaseId) fd.append("purchaseId", purchaseId);
        // NOTE: No paymentSource → triggers auto-detect in backend

        const res = await createInvoice(null, fd);
        setIsSubmitting(false);

        if (res?.error) {
            toast.error(res.error);
        } else if (res?.success) {
            toast.success(res.autoApproved ? "تم إنشاء الفاتورة واعتمادها تلقائياً ✅" : "تم تقديم الفاتورة للمراجعة ⏳");
            sessionStorage.removeItem("invoices_cache");
            router.push("/invoices");
        }
    };

    return (
        <DashboardLayout title="رفع فاتورة">
            <div className="pb-24 px-4 max-w-lg mx-auto" dir="rtl">

                {/* Hidden file inputs */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*, application/pdf"
                    className="hidden"
                    onChange={handleGallerySelect}
                />

                {/* Step 1: Capture */}
                {currentStep === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center pt-4 pb-2">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Camera className="w-8 h-8 text-purple-600" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900">رفع فاتورة</h1>
                            <p className="text-gray-500 text-sm mt-2">ابدأ بتصوير الفاتورة أو اختيارها من معرض صورك</p>
                        </div>

                        {/* Camera CTA */}
                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-3 bg-gradient-to-br from-purple-600 to-purple-700 text-white py-8 rounded-3xl shadow-lg shadow-purple-200 active:scale-95 transition-transform"
                        >
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Camera className="w-9 h-9" />
                            </div>
                            <div>
                                <p className="text-lg font-black">صوّر الفاتورة</p>
                                <p className="text-purple-200 text-sm">افتح الكاميرا مباشرة</p>
                            </div>
                        </button>

                        {/* Gallery CTA */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-4 bg-white border border-gray-200 text-gray-700 py-5 px-6 rounded-2xl shadow-sm active:scale-95 transition-transform"
                        >
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                <ImageIcon className="w-6 h-6 text-gray-500" />
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">اختر من المعرض</p>
                                <p className="text-gray-400 text-xs">صورة أو ملف PDF</p>
                            </div>
                        </button>

                        {/* Skip option */}
                        <button
                            onClick={() => setCurrentStep(2)}
                            className="w-full text-center text-gray-400 font-medium py-3 text-sm"
                        >
                            تخطي — إضافة بياناٍت فقط ←
                        </button>
                    </div>
                )}

                {/* Step 2: Details */}
                {currentStep === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* File preview thumbnail */}
                        {preview ? (
                            <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <Image src={preview} alt="فاتورة" fill className="object-cover" />
                                <button
                                    onClick={() => { setFile(null); setPreview(null); setCurrentStep(1); }}
                                    className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1.5 shadow-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                                    <p className="text-white text-xs font-bold">✓ تم رفع الفاتورة</p>
                                </div>
                            </div>
                        ) : !file ? (
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="w-full flex items-center gap-3 px-4 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700"
                            >
                                <Camera className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-semibold">⚠️ لم تُرفق صورة — اضغط لإضافة صورة</span>
                            </button>
                        ) : (
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
                        )}

                        {/* Amount Field - Big and prominent */}
                        <Card className="p-5 border-gray-100 shadow-sm rounded-2xl">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-3">المبلغ الإجمالي *</label>
                            <div className="flex items-baseline gap-2">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    required
                                    step="0.01"
                                    min="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="flex-1 text-4xl font-black text-purple-700 bg-transparent outline-none border-b-2 border-purple-200 focus:border-purple-500 pb-1 transition-colors placeholder-gray-200"
                                />
                                <span className="text-xl font-bold text-gray-400">ريال</span>
                            </div>
                        </Card>

                        {/* Project Selection — visual cards */}
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-3">اختر المشروع *</label>
                            {projects.length === 0 ? (
                                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                                    <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">لا توجد مشاريع مسندة إليك</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {projects.map((p: any) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedProjectId(p.id)}
                                            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${selectedProjectId === p.id
                                                ? "border-purple-500 bg-purple-50 shadow-md shadow-purple-100"
                                                : "border-gray-100 bg-white shadow-sm"
                                                }`}
                                        >
                                            {selectedProjectId === p.id && (
                                                <div className="absolute top-2 left-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            {/* Project image or letter avatar */}
                                            {p.image ? (
                                                <div className="w-14 h-14 rounded-xl overflow-hidden">
                                                    <Image src={p.image} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
                                                </div>
                                            ) : (
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black ${selectedProjectId === p.id ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <p className={`text-xs font-bold text-center leading-tight line-clamp-2 ${selectedProjectId === p.id ? "text-purple-800" : "text-gray-700"
                                                }`}>
                                                {p.name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category (optional) */}
                        {categories.length > 0 && (
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-3">التصنيف (اختياري)</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCategoryId("")}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${categoryId === "" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"
                                            }`}
                                    >
                                        غير مصنف
                                    </button>
                                    {categories.map((c: any) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setCategoryId(c.id)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${categoryId === c.id ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200"
                                                }`}
                                        >
                                            {c.icon} {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-3">ملاحظة (اختياري)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                placeholder="أي تفاصيل إضافية عن الفاتورة..."
                                className="w-full rounded-2xl border border-gray-200 p-4 outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm shadow-sm bg-white"
                            />
                        </div>
                    </div>
                )}

                {/* Fixed bottom submit bar */}
                {currentStep === 2 && (
                    <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedProjectId || !amount}
                            isLoading={isSubmitting}
                            variant="primary"
                            className="w-full py-4 text-base font-black rounded-2xl shadow-lg shadow-purple-200"
                        >
                            {isSubmitting ? "جاري الرفع..." : "تقديم الفاتورة ✓"}
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
    const defaultProjectId = searchParams.get('projectId') || "";
    const purchaseId = searchParams.get('purchaseId') || "";
    const defaultAmount = searchParams.get('amount') || "";
    const defaultDescription = searchParams.get('description') || "";

    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [projects, setProjects] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [custodies, setCustodies] = useState<any[]>([]);
    const [managerAvailable, setManagerAvailable] = useState<number | null>(null);

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
        paymentSource: "CUSTODY" as "CUSTODY" | "PERSONAL" | "SPLIT",
        custodyId: ""
    });
    // V3 SPLIT payment fields
    const [custodyAmount, setCustodyAmount] = useState("");
    const [pocketAmount, setPocketAmount] = useState("");

    const [items, setItems] = useState<InvoiceItemInput[]>([]);

    useEffect(() => {
        getProjects().then(data => setProjects(data as unknown as Project[]));
        getCategories().then(setCategories);
        getMyCustodies().then(data => setCustodies(data as unknown as any[]));
    }, []);

    // Fetch manager implicit custody balance whenever project changes
    useEffect(() => {
        if (!formData.projectId) { setManagerAvailable(null); return; }
        getManagerAvailableCustody(formData.projectId).then(res => {
            setManagerAvailable(res ? res.available : null);
        });
    }, [formData.projectId]);

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (!file) toast("لم يتم إرفاق صورة للفاتورة", { icon: "⚠️" });
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!formData.projectId || !formData.amount) {
                toast.error("يرجى تعبئة جميع الحقول الإلزامية (المشروع، المبلغ)");
                return;
            }
            // Generate reference automatically if empty
            if (!formData.reference.trim()) {
                setFormData(prev => ({ ...prev, reference: `INV-${Date.now()}` }));
            }
            if (formData.paymentSource === "CUSTODY" && !formData.custodyId) {
                toast.error("يرجى اختيار العهدة أو الدفع من الجيب (شخصي)");
                return;
            }
            // V3: validate SPLIT amounts
            if (formData.paymentSource === "SPLIT") {
                if (!formData.custodyId) {
                    toast.error("يرجى اختيار العهدة");
                    return;
                }
                const ca = parseFloat(custodyAmount) || 0;
                const pa = parseFloat(pocketAmount) || 0;
                const total = parseFloat(formData.amount) || 0;
                if (ca <= 0 || pa <= 0) {
                    toast.error("يجب أن يكون كلا الجزءين أكبر من صفر");
                    return;
                }
                if (Math.abs(ca + pa - total) > 0.01) {
                    toast.error(`مجموع الجزءين (${(ca + pa).toFixed(2)}) لا يساوي إجمالي الفاتورة (${total})`);
                    return;
                }
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

        const totalItemsPrice = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
        const invoiceAmount = Number(formData.amount);

        if (items.length > 0 && Math.abs(totalItemsPrice - invoiceAmount) > 0.1) {
            toast.error(`إجمالي التنسيقات (${totalItemsPrice}) لا يطابق مبلغ الفاتورة (${invoiceAmount})`);
            return;
        }

        setIsSubmitting(true);
        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => submitData.append(key, value));
        // If using manager's implicit custody, tell backend via sentinel custodyId
        if (formData.custodyId === "MANAGER_IMPLICIT") {
            submitData.set("custodyId", "MANAGER_IMPLICIT");
        }
        if (!formData.reference.trim()) submitData.set("reference", `INV-${Date.now()}`);
        if (file) submitData.append("file", file);
        if (items.length > 0) submitData.append("items", JSON.stringify(items));
        if (formData.paymentSource === "SPLIT") {
            submitData.append("custodyAmount", custodyAmount);
            submitData.append("pocketAmount", pocketAmount);
        }
        if (purchaseId) submitData.append("purchaseId", purchaseId);

        const res = await createInvoice(null, submitData);
        setIsSubmitting(false);

        if (res?.error) {
            toast.error(res.error);
        } else if (res?.success) {
            toast.success(res.autoApproved ? "تم إنشاء الفاتورة واعتمادها تلقائياً ✅" : "تم حفظ الفاتورة بنجاح وتحويلها للمراجعة ⏳");
            sessionStorage.removeItem("invoices_cache");
            router.push("/invoices");
        }
    };

    const availableCustodies = custodies.filter(c =>
        c.projectId === formData.projectId && c.isConfirmed && !c.isClosed && c.balance > 0
    );

    return (
        <DashboardLayout title="إضافة فاتورة جديدة">
            <div className="pb-10 px-4 md:px-0" dir="rtl">

                {/* Stepper Progress */}
                <div className="max-w-4xl mx-auto mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full">
                        <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-300"
                            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
                        />
                    </div>

                    <div className="relative z-10 flex justify-between">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= 1 ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                <Camera className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-bold ${currentStep >= 1 ? 'text-purple-700' : 'text-gray-400'}`}>المرفق</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= 2 ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-bold ${currentStep >= 2 ? 'text-purple-700' : 'text-gray-400'}`}>البيانات</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= 3 ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-bold ${currentStep >= 3 ? 'text-purple-700' : 'text-gray-400'}`}>التنسيق (اختياري)</span>
                        </div>
                    </div>
                </div>

                <Card className="max-w-4xl mx-auto p-5 md:p-8 border-gray-100 shadow-sm rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* STEP 1: UPLOAD FILE */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">صوّر الفاتورة</h2>
                                    <p className="text-gray-500 text-sm mt-1">التقط صورة واضحة للفاتورة أو ارفع ملف PDF</p>
                                </div>
                                <FileUpload
                                    name="file"
                                    accept="application/pdf, image/png, image/jpeg"
                                    maxSizeMB={10}
                                    placeholder="اضغط لرفع الفاتورة"
                                    description="أو اسحب واسقط الصورة هنا"
                                    onChange={(uploadedFile) => setFile(uploadedFile)}
                                />
                                <div className="flex justify-end pt-4">
                                    <Button type="button" onClick={handleNextStep} variant="primary" className="px-8 py-3 rounded-xl font-bold">
                                        التالي ←
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: INVOICE DATA */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">تفاصيل الفاتورة الأساسية</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Project selection — visual cards (mobile-friendly) */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-gray-700">المشروع *</label>
                                        {projects.length === 0 ? (
                                            <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm">لا توجد مشاريع</div>
                                        ) : projects.length <= 6 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {projects.map((p: any) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, projectId: p.id, custodyId: '' })}
                                                        className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 text-center ${formData.projectId === p.id
                                                            ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                                                            : 'border-gray-100 bg-white shadow-sm hover:border-gray-200'
                                                            }`}
                                                    >
                                                        {formData.projectId === p.id && (
                                                            <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                                                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                                                            </div>
                                                        )}
                                                        {p.image ? (
                                                            <Image src={p.image} alt={p.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black ${formData.projectId === p.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                                                }`}>{p.name.charAt(0)}</div>
                                                        )}
                                                        <p className={`text-xs font-bold leading-tight line-clamp-2 ${formData.projectId === p.id ? 'text-purple-800' : 'text-gray-700'
                                                            }`}>{p.name}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            // Fallback to select for large project lists
                                            <select
                                                value={formData.projectId}
                                                onChange={e => setFormData({ ...formData, projectId: e.target.value, custodyId: '' })}
                                                required
                                                className="w-full rounded-xl border border-gray-200 p-3.5 min-h-[52px] outline-none focus:ring-2 focus:ring-purple-400 bg-white shadow-sm font-medium"
                                            >
                                                <option value="">اختر المشروع</option>
                                                {projects.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">تصنيف المصروف</label>
                                        <select
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                            className="w-full rounded-xl border border-gray-200 p-3.5 outline-none focus:ring-2 focus:ring-purple-400 bg-white shadow-sm font-medium"
                                        >
                                            <option value="">غير مصنف...</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">المبلغ الإجمالي *</label>
                                        <div className="flex items-baseline gap-2 border-b-2 border-purple-200 focus-within:border-purple-500 transition-colors pb-1">
                                            <input
                                                type="number"
                                                required step="0.01" min="0.1"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                inputMode="decimal"
                                                className="flex-1 text-3xl font-black text-purple-700 bg-transparent outline-none placeholder-gray-200"
                                            />
                                            <span className="text-lg font-bold text-gray-400">ريال</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">الرقم المرجعي (اختياري)</label>
                                        <input
                                            type="text"
                                            value={formData.reference}
                                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                                            placeholder="يتولد تلقائياً إذا تُرك فارغاً"
                                            className="w-full rounded-xl border border-gray-200 p-3.5 min-h-[52px] outline-none focus:ring-2 focus:ring-purple-400 shadow-sm font-medium"
                                        />
                                    </div>

                                    {/* Payment Source Area — V3: CUSTODY | PERSONAL | SPLIT */}
                                    <div className="space-y-3 col-span-1 md:col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                        <label className="text-sm font-bold text-purple-900 block border-b border-purple-200 pb-2">
                                            طريقة الدفع للمصروف
                                        </label>

                                        <div className="flex flex-wrap gap-4 mt-2">
                                            {/* Manager Implicit Custody option — only visible when user is project manager */}
                                            {managerAvailable !== null && (
                                                <label className="flex items-center gap-2 cursor-pointer w-full">
                                                    <input
                                                        type="radio" name="paymentSource" value="CUSTODY"
                                                        checked={formData.paymentSource === "CUSTODY" && formData.custodyId === "MANAGER_IMPLICIT"}
                                                        onChange={() => setFormData({ ...formData, paymentSource: "CUSTODY", custodyId: "MANAGER_IMPLICIT" })}
                                                        className="accent-purple-600 w-4 h-4"
                                                    />
                                                    <span className="font-semibold text-purple-800">
                                                        🏛️ عهدة المدير — المتاح:{" "}
                                                        <span className={`font-black ${managerAvailable <= 0 ? "text-red-600" : "text-green-700"}`}>
                                                            {managerAvailable.toLocaleString("en-GB")} ريال
                                                        </span>
                                                    </span>
                                                </label>
                                            )}
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio" name="paymentSource" value="CUSTODY"
                                                    checked={formData.paymentSource === "CUSTODY" && formData.custodyId !== "MANAGER_IMPLICIT"}
                                                    onChange={() => setFormData({ ...formData, paymentSource: "CUSTODY", custodyId: "" })}
                                                    className="accent-purple-600 w-4 h-4"
                                                />
                                                <span className="font-semibold text-purple-800">💼 كل المبلغ من العهدة</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio" name="paymentSource" value="PERSONAL"
                                                    checked={formData.paymentSource === "PERSONAL"}
                                                    onChange={() => setFormData({ ...formData, paymentSource: "PERSONAL", custodyId: "" })}
                                                    className="accent-purple-600 w-4 h-4"
                                                />
                                                <span className="font-semibold text-purple-800">👜 كل المبلغ من جيبي (دين للشركة)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio" name="paymentSource" value="SPLIT"
                                                    checked={formData.paymentSource === "SPLIT"}
                                                    onChange={() => setFormData({ ...formData, paymentSource: "SPLIT" })}
                                                    className="accent-purple-600 w-4 h-4"
                                                />
                                                <span className="font-semibold text-amber-700">⚡ مختلط — جزء من العهدة وجزء من جيبي</span>
                                            </label>
                                        </div>

                                        {/* SPLIT amount fields */}
                                        {formData.paymentSource === "SPLIT" && formData.amount && (
                                            <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-amber-800">💼 الجزء من العهدة (ريال)</label>
                                                    <input
                                                        type="number" step="0.01" min="0"
                                                        value={custodyAmount}
                                                        onChange={e => {
                                                            setCustodyAmount(e.target.value);
                                                            const ca = parseFloat(e.target.value) || 0;
                                                            const total = parseFloat(formData.amount) || 0;
                                                            const pa = Math.max(0, total - ca);
                                                            setPocketAmount(pa.toFixed(2));
                                                        }}
                                                        placeholder="0.00"
                                                        className="w-full rounded-lg border border-amber-300 p-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400 font-bold text-amber-800"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-red-700">👜 الجزء من جيبي (دَيْن) (ريال)</label>
                                                    <input
                                                        type="number" step="0.01" min="0"
                                                        value={pocketAmount}
                                                        onChange={e => {
                                                            setPocketAmount(e.target.value);
                                                            const pa = parseFloat(e.target.value) || 0;
                                                            const total = parseFloat(formData.amount) || 0;
                                                            const ca = Math.max(0, total - pa);
                                                            setCustodyAmount(ca.toFixed(2));
                                                        }}
                                                        placeholder="0.00"
                                                        className="w-full rounded-lg border border-red-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400 font-bold text-red-700"
                                                    />
                                                </div>
                                                <div className="col-span-2 text-xs text-amber-700 flex items-center justify-between">
                                                    <span>الإجمالي: <strong>{formData.amount} ريال</strong></span>
                                                    <span className={`font-bold ${Math.abs((parseFloat(custodyAmount) || 0) + (parseFloat(pocketAmount) || 0) - parseFloat(formData.amount)) < 0.01
                                                        ? "text-green-600" : "text-red-600"
                                                        }`}>
                                                        {Math.abs((parseFloat(custodyAmount) || 0) + (parseFloat(pocketAmount) || 0) - parseFloat(formData.amount)) < 0.01
                                                            ? "✓ مجموع صحيح" : "⚠ مجموع خاطئ"}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {formData.paymentSource === "CUSTODY" && formData.projectId && (
                                            <div className="mt-3 animate-in fade-in duration-300">
                                                {availableCustodies.length === 0 ? (
                                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded block">لا تملك عهدة تم تأكيد استلامها في هذا المشروع!</p>
                                                ) : (
                                                    <select
                                                        value={formData.custodyId}
                                                        onChange={e => setFormData({ ...formData, custodyId: e.target.value })}
                                                        className="w-full rounded-lg border border-purple-200 p-3 bg-white text-sm"
                                                    >
                                                        <option value="">اختر العهدة للخصم منها...</option>
                                                        {availableCustodies.map(c => (
                                                            <option key={c.id} value={c.id}>
                                                                عهدة بقيمة {c.amount} ﷼ ({new Date(c.createdAt).toLocaleDateString("en-GB")})
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        {formData.paymentSource === "SPLIT" && formData.projectId && (
                                            <div className="mt-3 animate-in fade-in duration-300">
                                                {availableCustodies.length === 0 ? (
                                                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded block">لا تملك عهدة تم تأكيد استلامها في هذا المشروع!</p>
                                                ) : (
                                                    <select
                                                        value={formData.custodyId}
                                                        onChange={e => setFormData({ ...formData, custodyId: e.target.value })}
                                                        className="w-full rounded-lg border border-amber-200 p-3 bg-white text-sm"
                                                    >
                                                        <option value="">اختر العهدة...</option>
                                                        {availableCustodies.map(c => (
                                                            <option key={c.id} value={c.id}>
                                                                عهدة — متبقي {c.balance} ﷼
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Fixed bottom nav bar for mobile step navigation */}
                                <div className="fixed bottom-0 inset-x-0 md:static bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-0 md:border-0 md:bg-transparent md:flex md:justify-between md:pt-4 flex gap-3">
                                    <Button type="button" onClick={() => setCurrentStep(1)} variant="secondary" className="flex-1 md:flex-none md:px-6 py-3 rounded-xl font-bold">
                                        ← رجوع
                                    </Button>
                                    <Button type="button" onClick={handleNextStep} variant="primary" className="flex-1 md:flex-none md:px-8 py-3 rounded-xl font-bold">
                                        التالي (التنسيق) ←
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: ITEMS (TANSIQ) */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h3 className="text-lg font-bold text-gray-900">تنسيق الفاتورة (البنود)</h3>
                                    <Button type="button" onClick={addItem} variant="outline" className="text-sm bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 flex items-center gap-1 px-3 py-1.5 rounded-lg">
                                        <Plus className="w-4 h-4" /> إضافة مشتريات
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">اختياري - يمكنك تفريغ محتوى الفاتورة هنا ليسهل مراجعتها.</p>

                                {items.length === 0 ? (
                                    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center text-gray-400">
                                        لم تقم بإضافة بنود. الفاتورة ستُسجل كمبلغ إجمالي فقط.
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
                                                        <input type="text" placeholder="اسم المشتريات / السلعة" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="flex-1 bg-transparent border-b border-gray-200 focus:border-purple-400 outline-none text-sm font-semibold pb-1" required />
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 block mb-1">الرقم/الكود</label>
                                                            <input type="text" value={item.itemNumber} onChange={e => updateItem(item.id, 'itemNumber', e.target.value)} className="w-full bg-gray-50 rounded p-1.5 focus:bg-white border focus:border-purple-300 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 block mb-1">الكمية</label>
                                                            <input type="number" min="1" step="any" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="w-full bg-gray-50 rounded p-1.5 focus:bg-white border focus:border-purple-300 outline-none" required />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-gray-400 block mb-1">سعر الإفرادي</label>
                                                            <input type="number" min="0" step="any" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', e.target.value)} className="w-full bg-gray-50 rounded p-1.5 focus:bg-white border focus:border-purple-300 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-purple-600 font-bold block mb-1">الإجمالي</label>
                                                            <input type="number" min="0" step="any" value={item.totalPrice} onChange={e => updateItem(item.id, 'totalPrice', e.target.value)} className="w-full bg-purple-50 text-purple-800 rounded p-1.5 font-bold border-none outline-none" required />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                                            <span className="text-sm font-bold text-gray-600">مجموع التنسيقات:</span>
                                            <span className="font-bold text-lg text-gray-900">{items.reduce((s, i) => s + Number(i.totalPrice), 0).toLocaleString("en-GB")} ﷼</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 mt-4">
                                    <label className="text-sm font-bold text-gray-700">ملاحظة عامة للإدارة (اختياري)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                        placeholder="أي ملاحظات إضافية بخصوص الفاتورة..."
                                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm shadow-sm"
                                    />
                                </div>

                                <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
                                    <Button type="button" onClick={() => setCurrentStep(2)} variant="outline" className="px-6 py-3 rounded-xl font-bold bg-gray-50 text-gray-700">
                                        ← رجوع للمعلومات
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting} variant="primary" className="px-10 py-3 text-lg rounded-xl font-bold shadow-sm animate-pulse-once">
                                        {isSubmitting ? "جاري الحفظ..." : "تقديم الفاتورة للتدقيق ✓"}
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
    const searchParams = useSearchParams();
    const defaultProjectId = searchParams.get('projectId') || "";
    const purchaseId = searchParams.get('purchaseId') || "";
    const defaultAmount = searchParams.get('amount') || "";
    const defaultDescription = searchParams.get('description') || "";

    const [projects, setProjects] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        getProjects().then(data => setProjects(data as any[]));
        getCategories().then(setCategories);
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

    // All other roles get the full form
    return <FullInvoiceForm />;
}

export default function NewInvoicePage() {
    return (
        <Suspense fallback={
            <DashboardLayout title="إضافة فاتورة جديدة">
                <div className="py-20 text-center text-gray-500">جاري تحميل النموذج...</div>
            </DashboardLayout>
        }>
            <NewInvoicePageInner />
        </Suspense>
    );
}
