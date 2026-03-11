"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { UserRole } from "@/context/AuthContext";
import { signToken } from "@/lib/auth";
import type { SessionData } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

export async function login(prevState: unknown, formData: FormData) {
    // 1. Validate with Zod
    const validatedFields = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    const { email, password } = validatedFields.data;

    // Flag to track if login succeeded (redirect must be OUTSIDE try-catch)
    let shouldRedirect = false;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { branch: true },
        });

        if (!user) {
            return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
        }

        // C1 FIX: Block deleted users from logging in
        if (user.isDeleted) {
            return { error: "هذا الحساب معطّل. تواصل مع مدير النظام." };
        }

        // Support both bcrypt-hashed passwords (new seed) and plain text (legacy)
        const isValidPassword = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        if (!isValidPassword) {
            return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
        }

        const sessionData: SessionData = {
            id: user.id,
            name: user.name,
            role: user.role as UserRole,
            email: user.email,
            phone: user.phone,
            branchId: user.branchId,
            branchCode: user.branch?.code || null,
            branchName: user.branch?.name || null,
            branchFlag: user.branch?.flag || null,
        };

        const cookieStore = await cookies();
        const token = await signToken(sessionData);

        cookieStore.set("session", token, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: "lax", // A1: Prevents CSRF — cookie not sent on cross-site POST
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        shouldRedirect = true;

    } catch (e) {
        console.error("[login] Error:", e);
        return { error: "حدث خطأ أثناء تسجيل الدخول" };
    }

    // IMPORTANT: redirect() throws NEXT_REDIRECT internally.
    // It MUST be outside of try-catch, otherwise catch swallows the redirect.
    if (shouldRedirect) {
        redirect("/");
    }
}

export async function logout() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("session");
    } catch (err) {
        console.error("[logout] Error:", err);
    }
    redirect("/login");
}
