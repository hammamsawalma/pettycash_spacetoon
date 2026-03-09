import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { UserRole } from "@/context/AuthContext";
import { PERMISSIONS, canDo } from "@/lib/permissions";

export type SessionData = {
    id: string;
    name: string;
    email?: string | null;
    image?: string | null;
    phone?: string | null;
    role: UserRole;
};

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not defined");
    }
    return secret;
};

export async function signToken(payload: SessionData): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            getJwtSecret(),
            { expiresIn: "7d" },
            (err, token) => {
                if (err || !token) {
                    return reject(err || new Error("Token generation failed"));
                }
                resolve(token);
            }
        );
    });
}

export async function verifyToken(token: string): Promise<SessionData | null> {
    return new Promise((resolve) => {
        jwt.verify(token, getJwtSecret(), (err, decoded) => {
            if (err || !decoded) {
                return resolve(null);
            }
            resolve(decoded as SessionData);
        });
    });
}

export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
        return null;
    }

    try {
        const decoded = await verifyToken(token);
        return decoded;
    } catch {
        return null;
    }
}

// ─── Server-side Permission Guard ────────────────────────────────────────────

type Resource = keyof typeof PERMISSIONS;
type Action<R extends Resource> = keyof typeof PERMISSIONS[R];

/**
 * Use at the top of any Server Action to enforce a permission.
 * Returns { error: string } if unauthorized, or null if access is granted.
 *
 * @example
 *   const denied = await requirePermission("trash", "manage");
 *   if (denied) return denied;
 */
export async function requirePermission<R extends Resource>(
    resource: R,
    action: Action<R>
): Promise<{ error: string } | null> {
    const session = await getSession();
    if (!session) return { error: "يجب تسجيل الدخول أولاً" };
    if (!canDo(session.role, resource, action)) {
        return { error: "غير مصرح لك بتنفيذ هذه العملية" };
    }
    return null;
}
