"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache";
import { SessionData, getSession } from "@/lib/auth";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

export async function updateProfile(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const imageFile = formData.get("image") as File | null;

        if (!name) return { error: "الاسم مطلوب" };

        let imagePath = undefined;
        if (imageFile && imageFile.size > 0) {
            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Import path and fs specifically where we need them to avoid top-level issues

            const fileName = `${Date.now()}-${imageFile.name}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);
            imagePath = `/uploads/${fileName}`;
        }

        await prisma.user.update({
            where: { id: session.id },
            data: {
                name,
                email,
                ...(imagePath && { image: imagePath })
            },
        });

        revalidatePath("/settings");
        return { success: true, message: "تم تحديث الملف الشخصي بنجاح" };
    } catch (e) {
        console.error("Profile update error:", e);
        return { error: "حدث خطأ أثناء حفظ الملف الشخصي" };
    }
}

export async function updatePhone(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        let phone = formData.get("phone") as string;
        if (!phone) return { error: "رقم الجوال مطلوب" };

        if (!phone.startsWith("+966")) {
            phone = "+966" + phone.replace(/^0+/, '');
        }

        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser && existingUser.id !== session.id) {
            return { error: "رقم الجوال مستخدم مسبقاً" };
        }

        await prisma.user.update({
            where: { id: session.id },
            data: { phone },
        });

        revalidatePath("/settings");
        return { success: true, message: "تم تحديث رقم الجوال بنجاح" };
    } catch (e) {
        return { error: "حدث خطأ أثناء تحديث رقم الجوال" };
    }
}

export async function updatePassword(prevState: unknown, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) return { error: "غير مصرح لك" };

        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return { error: "جميع الحقول مطلوبة" };
        }

        if (newPassword !== confirmPassword) {
            return { error: "كلمات المرور الجديدة غير متطابقة" };
        }

        if (newPassword.length < 6) {
            return { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
        }

        const user = await prisma.user.findUnique({ where: { id: session.id } });
        if (!user) return { error: "المستخدم غير موجود" };

        // Support both hashed (bcrypt) and legacy plaintext passwords
        const isCurrentPasswordValid = user.password.startsWith('$2')
            ? await bcrypt.compare(currentPassword, user.password)
            : user.password === currentPassword;

        if (!isCurrentPasswordValid) {
            return { error: "كلمة المرور الحالية غير صحيحة" };
        }

        // Always store the new password as bcrypt hash
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: session.id },
            data: { password: hashedNewPassword },
        });

        return { success: true, message: "تم تحديث كلمة المرور بنجاح" };
    } catch (e) {
        return { error: "حدث خطأ أثناء تحديث كلمة المرور" };
    }
}
