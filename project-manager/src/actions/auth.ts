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

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
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
        };

        const cookieStore = await cookies();
        const token = await signToken(sessionData);

        cookieStore.set("session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax", // A1: Prevents CSRF — cookie not sent on cross-site POST
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

    } catch (e) {
        console.error(e);
        return { error: "حدث خطأ أثناء تسجيل الدخول" };
    }

    redirect("/");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/login");
}
