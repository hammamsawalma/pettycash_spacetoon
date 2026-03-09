"use client";
import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";
import type { SessionData } from "@/lib/auth";

export type UserRole = "ADMIN" | "GENERAL_MANAGER" | "GLOBAL_ACCOUNTANT" | "USER";

/** Minimal membership info loaded at layout time */
export type ProjectMembership = {
    projectId: string;
    projectRoles: string; // CSV e.g. "PROJECT_EMPLOYEE,PROJECT_MANAGER"
};

interface AuthContextType {
    user: SessionData | null;
    setUser: (user: SessionData | null) => void;
    roleNameAr: string;
    role?: UserRole;
    setRole: (role: UserRole) => void;
    /** All project memberships for the current user (empty for non-USER roles) */
    projectMemberships: ProjectMembership[];
    /** True if the user is a PROJECT_MANAGER in at least one project */
    isCoordinatorInAny: boolean;
    /** True if the user is a PROJECT_MANAGER in the given project */
    isCoordinatorIn: (projectId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
    children,
    initialUser = null,
    initialMemberships = [],
}: {
    children: ReactNode;
    initialUser?: SessionData | null;
    initialMemberships?: ProjectMembership[];
}) {
    const [user, setUser] = useState<SessionData | null>(initialUser);

    const roleNameMap: Record<UserRole, string> = {
        ADMIN: "الادمن",
        GENERAL_MANAGER: "المدير العام",
        GLOBAL_ACCOUNTANT: "المحاسب العام",
        USER: "موظف",
    };

    const handleSetRole = (role: UserRole) => {
        if (user) {
            setUser({ ...user, role });
        }
    };

    // Derive coordinator flags from memberships — memoized for performance
    const { isCoordinatorInAny, isCoordinatorIn } = useMemo(() => {
        const effectiveMemberships = initialMemberships;

        const coordinatorProjects = new Set(
            effectiveMemberships
                .filter(m => m.projectRoles.split(",").map(r => r.trim()).includes("PROJECT_MANAGER"))
                .map(m => m.projectId)
        );

        return {
            isCoordinatorInAny: coordinatorProjects.size > 0,
            isCoordinatorIn: (projectId: string) => coordinatorProjects.has(projectId),
        };
    }, [initialMemberships]);

    // Derive role name — purchase coordinators see 'منسق المشتريات' instead of 'موظف'
    const computedRoleNameAr = useMemo(() => {
        if (!user) return "";
        if (user.role === "USER" && isCoordinatorInAny) return "منسق المشتريات";
        return roleNameMap[user.role as UserRole] ?? "موظف";
    }, [user, isCoordinatorInAny]);

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            roleNameAr: computedRoleNameAr,
            role: user?.role as UserRole | undefined,
            setRole: handleSetRole,
            projectMemberships: initialMemberships,
            isCoordinatorInAny,
            isCoordinatorIn,
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
