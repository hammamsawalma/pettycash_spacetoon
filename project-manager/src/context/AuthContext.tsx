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
    /** True if the user is a PROJECT_ACCOUNTANT in at least one project */
    isAccountantInAny: boolean;
    /** True if the user is a PROJECT_MANAGER in the given project */
    isCoordinatorIn: (projectId: string) => boolean;
    /** True if the user is a PROJECT_ACCOUNTANT in the given project */
    isAccountantIn: (projectId: string) => boolean;
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
        USER: "مستخدم",
    };

    const handleSetRole = (role: UserRole) => {
        if (user) {
            setUser({ ...user, role });
        }
    };

    // Derive coordinator/accountant flags from memberships — memoized for performance
    const { isCoordinatorInAny, isAccountantInAny, isCoordinatorIn, isAccountantIn } = useMemo(() => {
        // For non-USER roles that always have access, GLOBAL_ACCOUNTANT is accountant in all
        const role = user?.role as UserRole | undefined;

        // GLOBAL_ACCOUNTANT: accountant in all projects (tracked via initialMemberships OR role)
        const effectiveMemberships = initialMemberships;

        const coordinatorProjects = new Set(
            effectiveMemberships
                .filter(m => m.projectRoles.split(",").map(r => r.trim()).includes("PROJECT_MANAGER"))
                .map(m => m.projectId)
        );

        const accountantProjects = new Set(
            effectiveMemberships
                .filter(m => m.projectRoles.split(",").map(r => r.trim()).includes("PROJECT_ACCOUNTANT"))
                .map(m => m.projectId)
        );

        // GLOBAL_ACCOUNTANT is always considered an accountant (for any project)
        const isGlobalAccountant = role === "GLOBAL_ACCOUNTANT";
        const isAdminRole = role === "ADMIN";

        return {
            isCoordinatorInAny: coordinatorProjects.size > 0,
            isAccountantInAny: isGlobalAccountant || isAdminRole || accountantProjects.size > 0,
            isCoordinatorIn: (projectId: string) => coordinatorProjects.has(projectId),
            isAccountantIn: (projectId: string) => isGlobalAccountant || isAdminRole || accountantProjects.has(projectId),
        };
    }, [initialMemberships, user?.role]);

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            roleNameAr: user ? roleNameMap[user.role as UserRole] ?? "مستخدم" : "",
            role: user?.role as UserRole | undefined,
            setRole: handleSetRole,
            projectMemberships: initialMemberships,
            isCoordinatorInAny,
            isAccountantInAny,
            isCoordinatorIn,
            isAccountantIn,
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
