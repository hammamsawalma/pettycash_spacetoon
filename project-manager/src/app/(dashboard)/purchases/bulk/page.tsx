"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect, useRef } from "react";
import { getProjectsForPurchase } from "@/actions/projects";
import { createBatchPurchases } from "@/actions/purchases";
import { Project } from "@prisma/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCanDo } from "@/components/auth/Protect";
import { useAuth } from "@/context/AuthContext";
import { FileSpreadsheet, Upload, Loader2, Trash2, Plus, Check, ArrowLeft, Sparkles, Edit3 } from "lucide-react";

interface ParsedItem {
    description: string;
    quantity: string;
    notes: string;
    selected: boolean;
}

type Step = 'upload' | 'review' | 'confirm';

export default function BulkPurchasePage() {
    const router = useRouter();
    const { isCoordinatorInAny, role } = useAuth();
    const canCreate = useCanDo('purchases', 'createGlobal') || (role === 'USER' && isCoordinatorInAny);

    const [step, setStep] = useState<Step>('upload');
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectId, setProjectId] = useState("");
    const [batchLabel, setBatchLabel] = useState("");
    const [items, setItems] = useState<ParsedItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!canCreate) {
            toast.error("ليس لديك صلاحية لإنشاء طلبات الشراء");
            router.replace("/purchases");
            return;
        }
        getProjectsForPurchase().then(data => setProjects(data as unknown as Project[]));
    }, [canCreate]);

    // Handle file upload → API → AI parsing
    const handleFileUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) {
            toast.error("يرجى اختيار ملف Excel أولاً");
            return;
        }
        if (!projectId) {
            toast.error("يرجى اختيار المشروع أولاً");
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
                toast.error(data.error || 'حدث خطأ في التحليل');
                setIsUploading(false);
                return;
            }

            const parsed: ParsedItem[] = data.items.map((item: any) => ({
                ...item,
                selected: true,
            }));

            setItems(parsed);
            setStep('review');
            toast.success(`تم تحليل ${parsed.length} عنصر بنجاح ✨`);
        } catch (err) {
            toast.error("حدث خطأ في الاتصال بالخادم");
        } finally {
            setIsUploading(false);
        }
    };

    // Toggle item selection
    const toggleItem = (index: number) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, selected: !item.selected } : item
        ));
    };

    // Edit item field
    const editItem = (index: number, field: keyof ParsedItem, value: string) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    // Remove item
    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Add manual item
    const addManualItem = () => {
        setItems(prev => [...prev, { description: '', quantity: '1', notes: '', selected: true }]);
    };

    // Submit batch
    const handleSubmit = async () => {
        const selectedItems = items.filter(i => i.selected && i.description.trim());
        if (selectedItems.length === 0) {
            toast.error("يرجى اختيار عنصر واحد على الأقل");
            return;
        }

        setIsSubmitting(true);

        const result = await createBatchPurchases({
            projectId,
            batchLabel: batchLabel || `دفعة مشتريات`,
            items: selectedItems.map(({ description, quantity, notes }) => ({
                description, quantity, notes
            })),
        });

        setIsSubmitting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`تم إنشاء ${result.count} طلب شراء بنجاح! 🎉`);
            router.push('/purchases');
        }
    };

    const selectedCount = items.filter(i => i.selected && i.description.trim()).length;

    return (
        <DashboardLayout title="إضافة مشتريات مجمعة">
            <div className="pb-6 max-w-5xl mx-auto">
                {/* Back */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-semibold mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> العودة
                </button>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {[
                        { key: 'upload' as Step, label: 'رفع الملف', num: 1 },
                        { key: 'review' as Step, label: 'مراجعة', num: 2 },
                        { key: 'confirm' as Step, label: 'تأكيد', num: 3 },
                    ].map(({ key, label, num }) => (
                        <div key={key} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                                step === key ? 'bg-[#102550] text-white shadow-md' :
                                (step === 'review' && key === 'upload') || (step === 'confirm') ? 'bg-emerald-500 text-white' :
                                'bg-gray-100 text-gray-400'
                            }`}>
                                {((step === 'review' && key === 'upload') || (step === 'confirm' && key !== 'confirm')) ? <Check className="w-4 h-4" /> : num}
                            </div>
                            <span className={`text-xs font-bold hidden sm:block ${step === key ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                            {key !== 'confirm' && <div className="w-8 h-0.5 bg-gray-200 rounded-full" />}
                        </div>
                    ))}
                </div>

                {/* ─── Step 1: Upload ─── */}
                {step === 'upload' && (
                    <Card className="p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 mx-auto bg-[#102550]/10 rounded-2xl flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-8 h-8 text-[#102550]" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">إضافة مشتريات من ملف Excel</h2>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                ارفع ملف Excel يحتوي على قائمة مشتريات. الذكاء الاصطناعي سيحلل المحتوى تلقائياً بغض النظر عن شكل الملف.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-gray-700">المشروع *</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium min-h-[52px]"
                                >
                                    <option value="">اختر المشروع</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-gray-700">تسمية الدفعة (اختياري)</label>
                                <input
                                    type="text"
                                    value={batchLabel}
                                    onChange={(e) => setBatchLabel(e.target.value)}
                                    placeholder="مثال: مستلزمات مكتبية - مارس 2026"
                                    className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium min-h-[52px]"
                                />
                            </div>
                        </div>

                        {/* File Upload Area */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="relative border-2 border-dashed border-gray-200 hover:border-[#102550]/50 rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 hover:bg-[#102550]/5 group"
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={() => {
                                    // Just show name, don't auto-upload
                                    const file = fileRef.current?.files?.[0];
                                    if (file) {
                                        toast.success(`تم اختيار: ${file.name}`);
                                    }
                                }}
                            />
                            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4 group-hover:text-[#102550] transition-colors" />
                            <p className="text-sm font-bold text-gray-600 group-hover:text-[#102550]">اضغط لاختيار ملف Excel</p>
                            <p className="text-xs text-gray-400 mt-2">يدعم: .xlsx, .xls, .csv — حتى 10 ميجابايت</p>
                        </div>

                        <Button
                            onClick={handleFileUpload}
                            disabled={isUploading || !projectId}
                            isLoading={isUploading}
                            variant="primary"
                            className="w-full py-4 rounded-2xl font-bold text-sm"
                        >
                            {isUploading ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-pulse" />
                                    جاري تحليل الملف بالذكاء الاصطناعي...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    تحليل الملف
                                </span>
                            )}
                        </Button>
                    </Card>
                )}

                {/* ─── Step 2: Review ─── */}
                {step === 'review' && (
                    <Card className="p-5 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    نتائج التحليل ({items.length} عنصر)
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">راجع البيانات المستخرجة وعدّل ما يلزم</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => { setStep('upload'); setItems([]); }}
                                    className="text-xs font-bold"
                                >
                                    إعادة الرفع
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={addManualItem}
                                    className="text-xs font-bold gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    إضافة يدوي
                                </Button>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className={`rounded-xl border p-4 transition-all ${
                                        item.selected
                                            ? 'border-[#102550]/20 bg-white shadow-sm'
                                            : 'border-gray-100 bg-gray-50 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => toggleItem(index)}
                                            className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                item.selected
                                                    ? 'bg-[#102550] border-[#102550] text-white'
                                                    : 'border-gray-300 hover:border-[#102550]'
                                            }`}
                                        >
                                            {item.selected && <Check className="w-3 h-3" />}
                                        </button>

                                        {/* Fields */}
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                                            <div className="sm:col-span-5 space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">الوصف</label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => editItem(index, 'description', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#102550]/30"
                                                    placeholder="وصف المنتج"
                                                />
                                            </div>
                                            <div className="sm:col-span-2 space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">الكمية</label>
                                                <input
                                                    type="text"
                                                    value={item.quantity}
                                                    onChange={(e) => editItem(index, 'quantity', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#102550]/30"
                                                    placeholder="1"
                                                />
                                            </div>
                                            <div className="sm:col-span-4 space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">ملاحظات</label>
                                                <input
                                                    type="text"
                                                    value={item.notes}
                                                    onChange={(e) => editItem(index, 'notes', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#102550]/30"
                                                    placeholder="ملاحظات اختيارية"
                                                />
                                            </div>
                                            <div className="sm:col-span-1 flex items-end justify-center">
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary + Submit */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600 font-bold">
                                {selectedCount} عنصر مختار من أصل {items.length}
                            </p>
                            <Button
                                onClick={() => setStep('confirm')}
                                disabled={selectedCount === 0}
                                variant="primary"
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm"
                            >
                                متابعة للتأكيد ({selectedCount} عنصر) ←
                            </Button>
                        </div>
                    </Card>
                )}

                {/* ─── Step 3: Confirm ─── */}
                {step === 'confirm' && (
                    <Card className="p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">تأكيد الإنشاء</h2>
                            <p className="text-sm text-gray-500">
                                سيتم إنشاء <strong className="text-[#102550]">{selectedCount} طلب شراء</strong> في مشروع{' '}
                                <strong className="text-[#102550]">{projects.find(p => p.id === projectId)?.name}</strong>
                            </p>
                            {batchLabel && (
                                <p className="text-xs text-gray-400 bg-gray-50 inline-block px-3 py-1 rounded-lg mt-2">
                                    تسمية الدفعة: {batchLabel}
                                </p>
                            )}
                        </div>

                        {/* Summary Table */}
                        <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-100">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 text-xs text-gray-500 font-bold">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">الوصف</th>
                                        <th className="px-4 py-3">الكمية</th>
                                        <th className="px-4 py-3">ملاحظات</th>
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
                            <Button
                                variant="outline"
                                onClick={() => setStep('review')}
                                className="flex-1 py-4 rounded-2xl font-bold text-sm"
                            >
                                <Edit3 className="w-4 h-4 ml-2" />
                                العودة للتعديل
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                                variant="primary"
                                className="flex-1 py-4 rounded-2xl font-bold text-sm"
                            >
                                {isSubmitting ? 'جاري الإنشاء...' : `إنشاء ${selectedCount} طلب شراء ✓`}
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
