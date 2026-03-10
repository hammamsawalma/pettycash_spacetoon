"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect, useActionState, useRef } from "react";
import { getProjectsForPurchase } from "@/actions/projects";
import { createPurchase } from "@/actions/purchases";
import { Project } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Suspense } from "react";
import { useCanDo } from "@/components/auth/Protect";
import { useAuth } from "@/context/AuthContext";
import { FormPageSkeleton } from "@/components/ui/FormPageSkeleton";
import { Camera, ImagePlus, X } from "lucide-react";
import Image from "next/image";

function NewPurchaseForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultProjectId = searchParams.get('projectId') || "";
    const { isCoordinatorInAny, role } = useAuth();
    const canCreate = useCanDo('purchases', 'createGlobal') || (role === 'USER' && isCoordinatorInAny);

    const [projects, setProjects] = useState<Project[]>([]);
    const [state, formAction, isPending] = useActionState(createPurchase, null);

    // Image state — single image, two input sources
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!canCreate) {
            toast.error("ليس لديك صلاحية لإنشاء طلبات الشراء");
            router.replace("/purchases");
            return;
        }
        getProjectsForPurchase().then(data => setProjects(data as unknown as Project[]));
    }, [canCreate]);

    useEffect(() => {
        if (state?.success) {
            sessionStorage.removeItem("purchases_cache");
            router.push("/purchases");
        }
    }, [state, router]);

    const handleImageSelect = (file: File | null) => {
        if (!file) {
            setImageFile(null);
            setImagePreview(null);
            return;
        }

        // Validate type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error("نوع الملف غير مدعوم. يرجى رفع صورة (JPG/PNG/WEBP) أو PDF");
            return;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("حجم الملف يتجاوز الحد المسموح (5 ميجابايت)");
            return;
        }

        setImageFile(file);

        // Preview for images
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

    return (
        <DashboardLayout title="اضافة طلب شراء جديد">
            <div className="pb-6">
                <Card className="max-w-4xl mx-auto p-5 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
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
                            toast.error("يرجى اختيار المشروع");
                            return;
                        }
                        if (!description) {
                            toast.error("يرجى كتابة وصف تفصيلي للطلب");
                            return;
                        }
                        if (!quantity) {
                            toast.error("الكمية مطلوبة للمتابعة");
                            return;
                        }

                        // Inject the selected image file into FormData
                        if (imageFile) {
                            formData.set("image", imageFile);
                        }

                        formAction(formData);
                    }}>

                        <div className="space-y-4">
                            <h3 className="text-base md:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">تفاصيل الطلب</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">المشروع</label>
                                    <select name="projectId" required defaultValue={defaultProjectId} className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] bg-white text-gray-700 text-xs md:text-sm shadow-sm font-medium min-h-[52px]">
                                        <option value="">اختر المشروع</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">الموعد النهائي لموافقة الطلب (اختياري)</label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium min-h-[52px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">الكمية</label>
                                    <input
                                        type="text"
                                        name="quantity"
                                        required
                                        inputMode="numeric"
                                        placeholder="مثال: 3 حبات، 2 كرتون..."
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] text-xs md:text-sm shadow-sm font-medium min-h-[52px]"
                                    />
                                </div>

                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">وصف الطلب</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={4}
                                        placeholder="اكتب وصف تفصيلي للمشتريات..."
                                        className="w-full rounded-xl border border-gray-200 p-3.5 md:p-4 outline-none focus:ring-2 focus:ring-[#102550] resize-none text-xs md:text-sm shadow-sm font-medium"
                                    />
                                </div>

                                {/* ── Image Upload Section: Dual Buttons ── */}
                                <div className="space-y-3 col-span-1 md:col-span-2">
                                    <label className="text-xs md:text-sm font-bold text-gray-700">مرفق الشراء (اختياري)</label>

                                    {/* Hidden inputs for camera and gallery */}
                                    <input
                                        ref={cameraRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
                                        }}
                                    />
                                    <input
                                        ref={galleryRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
                                        }}
                                    />

                                    {/* Show preview if image selected */}
                                    {imageFile ? (
                                        <div className="relative group">
                                            {imagePreview ? (
                                                <div className="relative w-full aspect-[16/9] max-h-56 rounded-2xl overflow-hidden border-2 border-dashed border-[#102550]/30 bg-gray-50">
                                                    <Image
                                                        src={imagePreview}
                                                        alt="معاينة الصورة"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-full rounded-2xl border-2 border-dashed border-[#102550]/30 bg-gray-50 p-6 text-center">
                                                    <p className="text-sm font-bold text-gray-600">{imageFile.name}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute -top-2 -left-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full p-1.5 shadow-md transition-all z-10"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Camera Button */}
                                            <button
                                                type="button"
                                                onClick={() => cameraRef.current?.click()}
                                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#102550]/50 hover:bg-[#102550]/5 transition-all duration-200 active:scale-[0.98] group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-[#102550]/10 transition-colors">
                                                    <Camera className="w-6 h-6 text-blue-500 group-hover:text-[#102550]" />
                                                </div>
                                                <span className="text-xs md:text-sm font-bold text-gray-600 group-hover:text-[#102550]">📷 التقاط صورة</span>
                                                <span className="text-[10px] text-gray-400">فتح الكاميرا مباشرة</span>
                                            </button>

                                            {/* Gallery/File Button */}
                                            <button
                                                type="button"
                                                onClick={() => galleryRef.current?.click()}
                                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-[#102550]/50 hover:bg-[#102550]/5 transition-all duration-200 active:scale-[0.98] group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-[#102550]/10 transition-colors">
                                                    <ImagePlus className="w-6 h-6 text-emerald-500 group-hover:text-[#102550]" />
                                                </div>
                                                <span className="text-xs md:text-sm font-bold text-gray-600 group-hover:text-[#102550]">🖼️ اختيار صورة</span>
                                                <span className="text-[10px] text-gray-400">من المعرض أو ملف PDF</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Fixed mobile CTA — Submit primary, Cancel secondary ── */}
                        <div className="fixed bottom-0 inset-x-0 md:static bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-0 md:border-0 md:bg-transparent md:flex md:justify-end md:gap-3 md:pt-6 md:mt-6 md:border-t md:border-gray-100 space-y-2 md:space-y-0">
                            <Button
                                type="submit"
                                disabled={isPending}
                                isLoading={isPending}
                                variant="primary"
                                className="w-full md:w-auto px-8 py-4 rounded-2xl font-bold shadow-sm text-sm active:scale-[0.98] transition-transform"
                            >
                                حفظ الطلب ✓
                            </Button>
                            <button
                                type="button"
                                onClick={() => router.push('/purchases')}
                                className="w-full md:w-auto py-3 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors text-center"
                            >
                                إلغاء
                            </button>
                        </div>


                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default function NewPurchasePage() {
    return (
        <Suspense fallback={<FormPageSkeleton title="اضافة طلب شراء جديد" />}>
            <NewPurchaseForm />
        </Suspense>
    );
}
