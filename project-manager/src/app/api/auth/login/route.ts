import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, SessionData } from "@/lib/auth";
import { UserRole } from "@/context/AuthContext";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { branch: true },
        });

        if (!user) {
            return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
        }

        if (user.isDeleted) {
            return NextResponse.json({ error: "هذا الحساب معطّل. تواصل مع مدير النظام." }, { status: 403 });
        }

        const isValidPassword = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        if (!isValidPassword) {
            return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
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

        const token = await signToken(sessionData);

        // Create the response object
        const response = NextResponse.json({ success: true, user: sessionData });

        // Force explicit cookie setting on the response itself (bulletproof)
        response.cookies.set("session", token, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("[POST /api/auth/login] Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء الاتصال بالخادم" }, { status: 500 });
    }
}
