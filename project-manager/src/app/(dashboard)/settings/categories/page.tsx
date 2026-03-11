"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllCategories, createCategory, updateCategory, deleteCategory, deactivateCategory } from "@/actions/categories";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

type CategoryWithCount = {
    id: string;
    name: string;
    icon: string | null;
    scope: string;
    isActive: boolean;
    createdAt: Date;
    _count: { invoices: number };
};

const SCOPE_LABELS: Record<string, { label: string; color: string }> = {
    PROJECT: { label: "مشاريع", color: "bg-blue-100 text-blue-700" },
    COMPANY: { label: "شركة", color: "bg-purple-100 text-purple-700" },
    BOTH: { label: "مشترك", color: "bg-green-100 text-green-700" },
};

export default function CategoriesPage() {
    const { locale } = useLanguage();
    const [categories, setCategories] = useState<CategoryWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formIcon, setFormIcon] = useState("");
    const [formScope, setFormScope] = useState("PROJECT");

    const loadCategories = async () => {
        const data = await getAllCategories();
        setCategories(data as unknown as CategoryWithCount[]);
        setIsLoading(false);
    };

    useEffect(() => { loadCategories(); }, []);

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormName("");
        setFormIcon("");
        setFormScope("PROJECT");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            const res = await updateCategory(editingId, formName, formIcon);
            if (res.error) toast.error(res.error);
            else { toast.success(locale === 'ar' ? "تم تحديث التصنيف" : "Category updated"); resetForm(); loadCategories(); }
        } else {
            const res = await createCategory(formName, formScope, formIcon);
            if (res.error) toast.error(res.error);
            else { toast.success(locale === 'ar' ? "تم إضافة التصنيف" : "Category added"); resetForm(); loadCategories(); }
        }
    };

    const handleDelete = async (cat: CategoryWithCount) => {
        if (cat._count.invoices > 0) {
            toast.error(locale === 'ar' ? `لا يمكن حذف "${cat.name}" — مرتبط بـ ${cat._count.invoices} فاتورة` : `Cannot delete "${cat.name}" — linked to ${cat._count.invoices} invoices`);
            return;
        }
        if (!confirm(locale === 'ar' ? `هل تريد حذف التصنيف "${cat.name}" نهائياً؟` : `Permanently delete category "${cat.name}"?`)) return;
        const res = await deleteCategory(cat.id);
        if (res.error) toast.error(res.error);
        else { toast.success(locale === 'ar' ? "تم حذف التصنيف" : "Category deleted"); loadCategories(); }
    };

    const handleToggle = async (id: string) => {
        const res = await deactivateCategory(id);
        if (res.error) toast.error(res.error);
        else { toast.success(res.isActive ? (locale === 'ar' ? "تم تفعيل التصنيف" : "Category enabled") : (locale === 'ar' ? "تم إلغاء تفعيل التصنيف" : "Category disabled")); loadCategories(); }
    };

    const startEdit = (cat: CategoryWithCount) => {
        setEditingId(cat.id);
        setFormName(cat.name);
        setFormIcon(cat.icon || "");
        setFormScope(cat.scope);
        setShowForm(true);
    };

    const grouped = {
        PROJECT: categories.filter(c => c.scope === "PROJECT"),
        COMPANY: categories.filter(c => c.scope === "COMPANY"),
        BOTH: categories.filter(c => c.scope === "BOTH"),
    };

    return (
        <DashboardLayout title={locale === 'ar' ? "إدارة التصنيفات" : "Manage Categories"}>
            <div className="space-y-6" dir="rtl">

                {/* Header + Add Button */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{locale === 'ar' ? 'تصنيفات المصاريف' : 'Expense Categories'}</h2>
                        <p className="text-sm text-gray-500 mt-1">{locale === 'ar' ? 'إضافة وتعديل وحذف تصنيفات الفواتير' : 'Add, edit, and delete invoice categories'}</p>
                    </div>
                    <Button onClick={() => { resetForm(); setShowForm(true); }} variant="primary" className="gap-2">
                        <Plus className="w-4 h-4" />
                        {locale === 'ar' ? 'إضافة تصنيف جديد' : 'Add Category'}
                    </Button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <Card className="p-5 bg-blue-50/50 border-blue-100">
                        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[180px]">
                                <label className="text-xs font-bold text-gray-700 mb-1 block">{locale === 'ar' ? 'اسم التصنيف *' : 'Category Name *'}</label>
                                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder={locale === 'ar' ? "مثال: طعام وضيافة" : "e.g. Food & Hospitality"} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none" required />
                            </div>
                            <div className="w-28">
                                <label className="text-xs font-bold text-gray-700 mb-1 block">{locale === 'ar' ? 'رمز' : 'Icon'}</label>
                                <input type="text" value={formIcon} onChange={e => setFormIcon(e.target.value)} placeholder="🍽️" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none text-center text-lg" maxLength={4} />
                            </div>
                            {!editingId && (
                                <div className="w-40">
                                    <label className="text-xs font-bold text-gray-700 mb-1 block">{locale === 'ar' ? 'النوع *' : 'Scope *'}</label>
                                    <select value={formScope} onChange={e => setFormScope(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none">
                                        <option value="PROJECT">{locale === 'ar' ? 'مشاريع' : 'Projects'}</option>
                                        <option value="COMPANY">{locale === 'ar' ? 'شركة' : 'Company'}</option>
                                        <option value="BOTH">{locale === 'ar' ? 'مشترك' : 'Both'}</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button type="submit" variant="primary" className="px-4">{editingId ? (locale === 'ar' ? 'حفظ التعديل' : 'Save') : (locale === 'ar' ? 'إضافة' : 'Add')}</Button>
                                <Button type="button" variant="outline" onClick={resetForm} className="px-4">{locale === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Categories grouped by scope */}
                {isLoading ? (
                    <div className="text-center text-gray-500 py-10">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : (
                    Object.entries(grouped).map(([scope, cats]) => (
                        <div key={scope} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${SCOPE_LABELS[scope]?.color}`}>
                                    {SCOPE_LABELS[scope]?.label}
                                </span>
                                <span className="text-xs text-gray-400">{cats.length} {locale === 'ar' ? 'تصنيف' : 'categories'}</span>
                            </div>

                            {cats.length === 0 ? (
                                <Card className="p-4 text-center text-gray-400 text-sm">{locale === 'ar' ? 'لا توجد تصنيفات في هذا القسم' : 'No categories in this section'}</Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {cats.map(cat => (
                                        <Card key={cat.id} className={`p-4 flex items-center justify-between ${!cat.isActive ? 'opacity-50 bg-gray-50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{cat.icon || "📁"}</span>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
                                                    <p className="text-xs text-gray-500">{cat._count.invoices} {locale === 'ar' ? 'فاتورة مرتبطة' : 'linked invoices'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleToggle(cat.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title={cat.isActive ? "إلغاء التفعيل" : "تفعيل"}>
                                                    {cat.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                                                </button>
                                                <button onClick={() => startEdit(cat)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="تعديل">
                                                    <Pencil className="w-4 h-4 text-blue-600" />
                                                </button>
                                                <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="حذف">
                                                    {cat._count.invoices > 0 ? <AlertTriangle className="w-4 h-4 text-gray-300" /> : <Trash2 className="w-4 h-4 text-red-500" />}
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}

            </div>
        </DashboardLayout>
    );
}
