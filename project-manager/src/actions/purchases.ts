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
                    ? {
                        OR: [
                            // Own purchases regardless of role
                            { creatorId: session.id },
                            // All purchases in projects where user is project manager (managerId)
                            { project: { managerId: session.id } },
                            // All purchases in projects where user holds PROJECT_MANAGER role
                            {
                                project: {
                                    members: {
                                        some: {
                                            userId: session.id,
                                            projectRoles: { contains: "PROJECT_MANAGER" }
                                        }
                                    }
                                }
                            },
                            // All purchases in projects where user holds PROJECT_ACCOUNTANT role
                            {
                                project: {
                                    members: {
                                        some: {
                                            userId: session.id,
                                            projectRoles: { contains: "PROJECT_ACCOUNTANT" }
                                        }
                                    }
                                }
                            }
                        ]
                    }
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
    const quantity = formData.get("quantity") as string || "1";
    const deadlineRaw = formData.get("deadline") as string;
    const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
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

        // v3: Only ADMIN + GENERAL_MANAGER can create purchases at system level
        // GLOBAL_ACCOUNTANT does NOT create purchases (financial role, not operational)
        // USER with PROJECT_MANAGER role can create for their assigned projects
        const isGlobalCreator = session.role === "ADMIN" || session.role === "GENERAL_MANAGER";
        if (!isGlobalCreator) {
            const membership = await prisma.projectMember.findFirst({
                where: {
                    projectId,
                    userId: session.id,
                    projectRoles: { contains: "PROJECT_MANAGER" } // STRICT COORDINATOR CHECK
                }
            });
            if (!membership) {
                return { error: "صلاحية مرفوضة: يجب أن تكون 'منسق' في هذا المشروع لإنشاء طلبات الشراء." };
            }
        }

        // Check project is still active (blocks both global creators and coordinators)
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { status: true }
        });
        if (!project) return { error: "المشروع غير موجود" };
        if (project.status !== "IN_PROGRESS") {
            return { error: "لا يمكن إنشاء طلب شراء لمشروع مكتمل أو متوقف" };
        }
        // ------------------------------

        const order = await prisma.purchase.create({
            data: {
                orderNumber: `PO-${Date.now()}-0`,
                description,
                amount: 0,
                quantity,
                deadline,
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

// ─── جلب تفاصيل طلب شراء بواسطة ID ─────────────────────────
export async function getPurchaseById(id: string) {
    try {
        const session = await getSession();
        if (!session) return null;

        const purchase = await prisma.purchase.findUnique({
            where: { id, isDeleted: false },
            include: {
                creator: { select: { id: true, name: true, image: true, role: true } },
                project: { select: { id: true, name: true, managerId: true } }
            }
        });

        if (!purchase) return null;

        const isUnrestricted = isGlobalFinance(session.role) || session.role === "GENERAL_MANAGER";
        if (isUnrestricted || purchase.creatorId === session.id || purchase.project?.managerId === session.id) {
            return purchase;
        }

        // Check project membership roles
        if (purchase.projectId) {
            const member = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId: purchase.projectId, userId: session.id } }
            });
            if (member && (member.projectRoles.includes("PROJECT_MANAGER") || member.projectRoles.includes("PROJECT_ACCOUNTANT") || member.projectRoles.includes("PROJECT_EMPLOYEE"))) {
                return purchase;
            }
        }

        return null;
    } catch (error) {
        console.error("Get Purchase By Id Error:", error);
        return null;
    }
}

// ─── وضع / إزالة راية حمراء ────────────────────────────────
export async function togglePurchaseRedFlag(purchaseId: string, reason: string | null, isRemoving: boolean) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مسجل الدخول" };

        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: { project: true }
        });

        if (!purchase) return { error: "طلب الشراء غير موجود" };

        // Authorization: Project Employee/Manager/Accountant or Global Finance
        let authorized = false;
        if (isGlobalFinance(session.role) || purchase.creatorId === session.id || purchase.project?.managerId === session.id) {
            authorized = true;
        } else if (purchase.projectId) {
            const member = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId: purchase.projectId, userId: session.id } }
            });
            if (member && (member.projectRoles.includes("PROJECT_MANAGER") || member.projectRoles.includes("PROJECT_EMPLOYEE"))) {
                authorized = true;
            }
        }

        if (!authorized) return { error: "لا تملك صلاحية لتحديث حالة هذا الطلب" };

        // Update the purchase
        await prisma.purchase.update({
            where: { id: purchaseId },
            data: {
                isRedFlagged: !isRemoving,
                redFlagReason: isRemoving ? null : reason,
            }
        });

        // EC1: Notify the creator if a red flag is added
        if (!isRemoving && purchase.creatorId !== session.id) {
            await prisma.notification.create({
                data: {
                    title: "تنبيه: عنصر غير متوفر 🚩",
                    content: `تم وضع راية حمراء على طلب الشراء المرجعي ${purchase.orderNumber}. السبب: ${reason}`,
                    targetUserId: purchase.creatorId,
                    targetProjectId: purchase.projectId,
                }
            });
        }

        revalidatePath(`/purchases/${purchaseId}`);
        revalidatePath("/purchases");
        return { success: true };
    } catch (error) {
        console.error("Toggle Red Flag Error:", error);
        return { error: "حدث خطأ أثناء تحديث حالة الراية الحمراء" };
    }
}
