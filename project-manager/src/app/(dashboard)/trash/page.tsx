"use client"
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trash2, RefreshCw, FolderKanban, FileText, Wallet, User as UserIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getTrashItems, restoreItem, permanentlyDelete, purgeOldTrash } from "@/actions/trash";
import toast from "react-hot-toast";
import type { Project, Invoice, Purchase, User as PrismaUser } from "@prisma/client";

export default function TrashPage() {
    type TrashItem = { id: string, title: string, type: string, typeLabel: string, deletedAt: string, icon: React.ElementType };
    const [items, setItems] = useState<TrashItem[]>([]);
    const [isClearing, setIsClearing] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const fetchTrash = useCallback(async () => {
        const data = await getTrashItems();

        const formatItems = [
            ...data.projects.map((p: Project) => ({ id: p.id, title: p.name, type: "PROJECT", typeLabel: "مشروع", deletedAt: p.deletedAt ? new Date(p.deletedAt).toLocaleDateString("en-GB") : "", icon: FolderKanban })),
            ...data.invoices.map((i: Invoice) => ({ id: i.id, title: i.reference, type: "INVOICE", typeLabel: "فاتورة", deletedAt: i.deletedAt ? new Date(i.deletedAt).toLocaleDateString("en-GB") : "", icon: FileText })),
            ...data.purchases.map((p: Purchase) => ({ id: p.id, title: p.description, type: "PURCHASE", typeLabel: "مشتريات", deletedAt: p.deletedAt ? new Date(p.deletedAt).toLocaleDateString("en-GB") : "", icon: Wallet })),
            ...data.users.map((u: PrismaUser) => ({ id: u.id, title: u.name, type: "USER", typeLabel: "مستخدم", deletedAt: u.deletedAt ? new Date(u.deletedAt).toLocaleDateString("en-GB") : "", icon: UserIcon })),
        ];

        setItems(formatItems);
    }, []);

    useEffect(() => {
        if (user && user.role !== "ADMIN") {
            router.push("/");
        } else if (user) {
            fetchTrash();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, router]);

    if (!user || user.role !== "ADMIN") return null;

    const handleRestore = async (id: string, type: "PROJECT" | "INVOICE" | "PURCHASE" | "USER") => {
        const res = await restoreItem(type, id);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success("تمت استعادة العنصر بنجاح");
            fetchTrash();
        }
    };

    const handleDelete = async (id: string, type: "PROJECT" | "INVOICE" | "PURCHASE" | "USER") => {
        if (!confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.")) return;

        const res = await permanentlyDelete(type, id);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success("تم حذف العنصر نهائياً");
            fetchTrash();
        }
    };

    const handleClearAll = async () => {
        if (!confirm("هل أنت متأكد من إفراغ سلة المهملات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.")) return;
        setIsClearing(true);
        const results = await Promise.all(
            items.map(item => permanentlyDelete(item.type as "PROJECT" | "INVOICE" | "PURCHASE" | "USER", item.id))
        );
        const failures = results.filter(r => 'error' in r);
        setIsClearing(false);
        if (failures.length > 0) {
            toast.error(`فشل حذف ${failures.length} عنصر من أصل ${items.length}`);
        } else {
            toast.success("تم إفراغ سلة المهملات بنجاح");
        }
        fetchTrash();
    };

    const handlePurgeOld = async () => {
        setIsPurging(true);
        const res = await purgeOldTrash();
        setIsPurging(false);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('message' in res ? res.message : "تم تنظيف المهملات القديمة بنجاح");
            fetchTrash();
        }
    };

    return (
        <DashboardLayout title="سلة المهملات">
            <div className="space-y-6 md:space-y-8 pb-6">

                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-red-50 p-4 md:p-5 rounded-xl border border-red-100 gap-4">
                    <p className="text-xs md:text-sm text-red-600 font-bold leading-relaxed">سيتم مسح العناصر الموجودة في سلة المهملات نهائياً بعد مرور 30 يوماً.</p>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-100/50 hover:border-red-300 text-[11px] md:text-xs py-2 md:py-2.5 h-9 md:h-10 font-bold bg-white/50"
                            onClick={handlePurgeOld}
                            disabled={isPurging || isClearing}
                        >
                            {isPurging ? "جاري التنظيف..." : "تنظيف الملفات القديمة"}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-100/50 hover:border-red-300 text-[11px] md:text-xs py-2 md:py-2.5 h-9 md:h-10 font-bold bg-white/50"
                            onClick={handleClearAll}
                            disabled={items.length === 0 || isClearing || isPurging}
                        >
                            {isClearing ? "جاري الإفراغ..." : "إفراغ السلة بالكامل"}
                        </Button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-sm font-medium text-gray-500">سلة المهملات فارغة.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {items.map((item) => (
                            <Card key={item.id} className="p-4 md:p-5 flex flex-col border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all shadow-sm rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 border border-gray-100">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] md:text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg font-bold border border-gray-100">{item.typeLabel}</span>
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1.5 line-through decoration-red-300 decoration-2 text-sm md:text-base">{item.title}</h4>
                                <p className="text-[10px] md:text-xs text-gray-400 mb-6 font-medium">تم الحذف في: {item.deletedAt}</p>

                                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2 text-emerald-600 border-emerald-100 hover:bg-emerald-50 text-[11px] md:text-xs h-9 md:h-10 font-bold bg-emerald-50/30"
                                        onClick={() => handleRestore(item.id, item.type as "PROJECT" | "INVOICE" | "PURCHASE" | "USER")}
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        استعادة
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-9 h-9 md:w-10 md:h-10 p-0 text-red-600 border-red-100 hover:bg-red-50 flex items-center justify-center bg-red-50/30"
                                        onClick={() => handleDelete(item.id, item.type as "PROJECT" | "INVOICE" | "PURCHASE" | "USER")}
                                    >
                                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
