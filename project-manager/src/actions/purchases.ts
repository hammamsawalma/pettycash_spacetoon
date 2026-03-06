"use server"
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isGlobalFinance } from "@/lib/rbac";
import fs from "fs";
import path from "path";

// ─── جلب قائمة المشتريات ─────────────────────────────────
export async function getPurchases(projectId?: string) {
    try {
        const session = await getSession();
        if (!session) return [];
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

    try {
        const session = await getSession();
        if (!session) return { error: "غير مسجل الدخول" };

        const order = await prisma.purchase.create({
            data: {
                orderNumber: `PO-${Date.now()}-0`,
                description,
                amount,
                notes: notes || null,
                imageUrl: imageUrlDb || null,
                status: "REQUESTED",
                priority: "NORMAL",
                projectId,
                creatorId: session.id
            }
        });

        revalidatePath(`/projects/${projectId}`);
        revalidatePath("/purchases");
        return { success: true, orders: [order] };
    } catch (error) {
        console.error("Create Purchase Error:", error);
        return { error: "حدث خطأ أثناء إنشاء طلب الشراء" };
    }
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
