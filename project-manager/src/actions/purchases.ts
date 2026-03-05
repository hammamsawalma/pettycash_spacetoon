"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getUserRolesInProject } from "@/lib/roles";
import { isGlobalFinance, hasProjectPermission } from "@/lib/rbac";
import fs from "fs";
import path from "path";

// ─── المنسق يُنشئ قائمة مشتريات مطلوبة ──────────────────
export async function createPurchaseOrder(
    projectId: string,
    items: Array<{ description: string; amount: number; notes?: string; imageUrl?: string }>
) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مسجل الدخول" };

        // التحقق من أن المستخدم مدير عام أو منسق في هذا المشروع (أو مدير النظام أو المحاسب العام)
        const isGlobalAdmin = isGlobalFinance(session.role);
        const isGM = session.role === "GENERAL_MANAGER";
        const userProjectRoles = await getUserRolesInProject(projectId, session.id);
        const isCoordinator = hasProjectPermission(userProjectRoles, ["PROJECT_MANAGER"]);

        if (!isGlobalAdmin && !isGM && !isCoordinator) {
            return { error: "غير مصرح لك بإضافة قوائم المشتريات" };
        }

        // مشتريات المدير العام تكون دائماً بأولوية عليا
        const purchasePriority = isGM ? "URGENT" : "NORMAL";

        // إنشاء طلبات الشراء دفعة واحدة
        const orders = await Promise.all(
            items.map((item, index) =>
                prisma.purchase.create({
                    data: {
                        orderNumber: `PO-${Date.now()}-${index}`,
                        description: item.description,
                        amount: item.amount || 0,
                        notes: item.notes || null,
                        imageUrl: item.imageUrl || null,
                        status: "REQUESTED",
                        priority: purchasePriority,
                        projectId,
                        creatorId: session.id
                    }
                })
            )
        );

        // إشعار لأعضاء المشروع (الموظفين) بوجود مشتريات مطلوبة
        await prisma.notification.create({
            data: {
                title: "قائمة مشتريات جديدة 🛒",
                content: `أضاف المنسق ${orders.length} مشتريات مطلوبة للمشروع`,
                targetProjectId: projectId
            }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/purchases");
        return { success: true, orders };
    } catch (error) {
        console.error("Create Purchase Error:", error);
        return { error: "حدث خطأ أثناء إنشاء قائمة المشتريات" };
    }
}

// ─── جلب قائمة المشتريات (اختياري لمشروع معين) ─────────────
export async function getPurchaseOrders(projectId?: string) {
    try {
        const session = await getSession();
        if (!session) return [];
        // المدير العام والمحاسب يريان كل المشتريات
        const isUnrestricted = isGlobalFinance(session.role);

        const purchases = await prisma.purchase.findMany({
            where: {
                isDeleted: false,
                ...(projectId ? { projectId } : {}),
                ...(!isUnrestricted
                    ? { project: { OR: [{ managerId: session.id }, { members: { some: { userId: session.id } } }] } }
                    : {})
            },
            include: {
                creator: { select: { id: true, name: true } },
                project: true
            },
            orderBy: [
                // ترتيب الأولوية: URGENT أولاً ثم HIGH ثم NORMAL
                { priority: "desc" },
                { createdAt: "desc" }
            ]
        });

        return purchases;
    } catch (error) {
        console.error("Get Purchases Error:", error);
        return [];
    }
}

// backward-compat aliases
export const getPurchases = getPurchaseOrders;

// FormData-compatible wrapper for useActionState usage in purchases/new/page.tsx
export async function createPurchase(prevState: unknown, formData: FormData) {
    const projectId = formData.get("projectId") as string;
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const notes = formData.get("notes") as string | null;
    const file = formData.get("image") as File | null;

    if (!projectId || !description) {
        return { error: "المشروع والوصف مطلوبان" };
    }

    let imageUrlDb: string | undefined = undefined;
    if (file && file.size > 0) {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { error: "نوع الملف غير مدعوم. يرجى رفع صورة (JPG/PNG/WEBP) أو ملف PDF" };
        }
        if (file.size > 5 * 1024 * 1024) {
            return { error: "حجم الملف يتجاوز الحد المسموح به (5 ميجابايت)" };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        imageUrlDb = `/uploads/${fileName}`;
    }

    return createPurchaseOrder(projectId, [
        { description, amount, notes: notes || undefined, imageUrl: imageUrlDb }
    ]);
}

// ─── الموظف يُعلم أنه اشترى هذا العنصر ──────────────────
export async function markPurchaseAsBought(purchaseId: string, invoiceId?: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مسجل الدخول" };

        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { project: { select: { managerId: true } } }
        });
        if (!purchase) return { error: "طلب الشراء غير موجود" };
        if (purchase.status === "PURCHASED") return { error: "تم شراء هذا العنصر مسبقاً" };
        if (purchase.status === "CANCELLED") return { error: "هذا الطلب ملغى" };

        // C5: Authorization — global finance, GM, project manager, or project member
        const isGlobalAuth = isGlobalFinance(session.role) || session.role === "GENERAL_MANAGER";
        if (!isGlobalAuth && purchase.projectId) {
            const isProjectManager = purchase.project?.managerId === session.id;
            const membership = !isProjectManager
                ? await prisma.projectMember.findUnique({
                    where: { projectId_userId: { projectId: purchase.projectId, userId: session.id } }
                })
                : null;
            if (!isProjectManager && !membership) {
                return { error: "يجب أن تكون عضواً في مشروع هذا الطلب لتغيير حالته" };
            }
        }

        await prisma.purchase.update({
            where: { id: purchaseId },
            data: {
                status: "PURCHASED",
                purchasedBy: session.id,
                invoiceId: invoiceId || null
            }
        });

        revalidatePath("/purchases");
        if (purchase.projectId) revalidatePath(`/projects/${purchase.projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Mark Bought Error:", error);
        return { error: "حدث خطأ أثناء تحديث حالة الشراء" };
    }
}

// ─── المنسق يلغي طلب شراء ────────────────────────────────
export async function cancelPurchaseOrder(purchaseId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مسجل الدخول" };

        const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId }, include: { project: true } });
        if (!purchase) return { error: "طلب الشراء غير موجود" };

        const isAdminManager = isGlobalFinance(session.role) && (!purchase.projectId || purchase.project?.managerId === session.id);
        const isCreator = purchase.creatorId === session.id;

        if (!isAdminManager && !isCreator) {
            return { error: "فقط المنسق الذي أنشأ الطلب أو مدير المشروع يمكنه إلغاؤه" };
        }

        if (purchase.status === "PURCHASED") {
            return { error: "لا يمكن إلغاء طلب تم شراؤه بالفعل" };
        }

        await prisma.purchase.update({
            where: { id: purchaseId },
            data: { status: "CANCELLED" }
        });

        revalidatePath("/purchases");
        return { success: true };
    } catch (error) {
        console.error("Cancel Purchase Error:", error);
        return { error: "حدث خطأ أثناء إلغاء طلب الشراء" };
    }
}

// ─── تحديث حالة الشراء إلى "قيد التنفيذ" ────────────────
export async function markPurchaseInProgress(purchaseId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مسجل الدخول" };

        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { project: { select: { managerId: true } } }
        });
        if (!purchase) return { error: "طلب الشراء غير موجود" };

        // Authorization: global finance, GM, or a member of the purchase's project
        const isGlobalAuth = isGlobalFinance(session.role) || session.role === "GENERAL_MANAGER";
        let isMember = false;
        if (!isGlobalAuth && purchase.projectId) {
            const membership = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId: purchase.projectId, userId: session.id } }
            });
            isMember = !!membership;
            // Also allow the project manager (stored on Project.managerId)
            if (!isMember && purchase.project?.managerId === session.id) isMember = true;
        }

        if (!isGlobalAuth && !isMember) {
            return { error: "يجب أن تكون عضواً في مشروع هذا الطلب لتغيير حالته" };
        }

        await prisma.purchase.update({
            where: { id: purchaseId },
            data: { status: "IN_PROGRESS", purchasedBy: session.id }
        });

        revalidatePath("/purchases");
        return { success: true };
    } catch (error) {
        console.error("Mark In Progress Error:", error);
        return { error: "حدث خطأ" };
    }
}
