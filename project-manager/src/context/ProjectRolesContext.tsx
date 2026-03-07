"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProjectRoleFlags {
    /** Has PROJECT_MANAGER role in at least one active project (or is project managerId) */
    isProjectManager: boolean;
    /** Has PROJECT_ACCOUNTANT role in at least one active project */
    isProjectAccountant: boolean;
    /** Has PROJECT_EMPLOYEE role in at least one active project */
    isProjectEmployee: boolean;
    /** Can add an invoice (PROJECT_EMPLOYEE || PROJECT_ACCOUNTANT || direct managerId) */
    canAddInvoice: boolean;
    /** Is a member/manager of at least one non-deleted project */
    hasAnyProject: boolean;
    /** True once the server response has been received */
    loaded: boolean;
}

interface ProjectRolesContextType {
    flags: ProjectRoleFlags;
    setFlags: (f: Partial<ProjectRoleFlags>) => void;
}

const defaultFlags: ProjectRoleFlags = {
    isProjectManager: false,
    isProjectAccountant: false,
    isProjectEmployee: false,
    canAddInvoice: false,
    hasAnyProject: false,
    loaded: false,
};

const ProjectRolesContext = createContext<ProjectRolesContextType | undefined>(undefined);

export function ProjectRolesProvider({ children }: { children: ReactNode }) {
    const [flags, setFlagsState] = useState<ProjectRoleFlags>(defaultFlags);

    const setFlags = useCallback((partial: Partial<ProjectRoleFlags>) => {
        setFlagsState(prev => ({ ...prev, ...partial }));
    }, []);

    return (
        <ProjectRolesContext.Provider value={{ flags, setFlags }}>
            {children}
        </ProjectRolesContext.Provider>
    );
}

export function useProjectRoles() {
    const ctx = useContext(ProjectRolesContext);
    if (!ctx) throw new Error("useProjectRoles must be used within ProjectRolesProvider");
    return ctx;
}
