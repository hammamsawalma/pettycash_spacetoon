"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SessionData } from "@/lib/auth";

export type UserRole = "ADMIN" | "GENERAL_MANAGER" | "GLOBAL_ACCOUNTANT" | "USER";

interface AuthContextType {
    user: SessionData | null;
    setUser: (user: SessionData | null) => void;
    roleNameAr: string;
    role?: UserRole;
    setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser = null }: { children: ReactNode, initialUser?: SessionData | null }) {
    const [user, setUser] = useState<SessionData | null>(initialUser);

    const roleNameMap: Record<UserRole, string> = {
        ADMIN: "الادمن",
        GENERAL_MANAGER: "المدير العام",
        GLOBAL_ACCOUNTANT: "المحاسب العام",
        USER: "مستخدم",
    };

    const handleSetRole = (role: UserRole) => {
        if (user) {
            setUser({ ...user, role });
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            roleNameAr: user ? roleNameMap[user.role] : "",
            role: user?.role,
            setRole: handleSetRole
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
