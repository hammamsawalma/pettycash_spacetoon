"use client";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  <Protect> — Conditional UI rendering based on RBAC permissions v3
 *
 *  Automatically reads system role + project memberships from AuthContext.
 *  No need to manually pass projectRoles anywhere.
 *
 *  Usage (system-level):
 *    <Protect resource="projects" action="close">
 *      <button>إغلاق المشروع</button>
 *    </Protect>
 *
 *  Usage (project-scoped — coordinator / accountant):
 *    <Protect resource="purchases" action="create" projectId={projectId}>
 *      <button>إضافة شراء</button>
 *    </Protect>
 *
 *  Usage (any-project check — e.g. for global nav visibility):
 *    <Protect resource="purchases" action="createGlobal">
 *      <button>إضافة شراء</button>
 *    </Protect>
 * ════════════════════════════════════════════════════════════════════════
 */

import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, canDo } from "@/lib/permissions";
import { UserRole } from "@/context/AuthContext";

type Resource = keyof typeof PERMISSIONS;
type Action<R extends Resource> = keyof typeof PERMISSIONS[R];

// ─── Coordinator-gated actions (need PROJECT_MANAGER in specified/any project) ─
const COORDINATOR_GATED: Partial<Record<Resource, string[]>> = {
    purchases: ["create", "createGlobal", "cancel"],
    projects: ["create", "edit"],
    custodies: ["transfer"],
};

// ─── Accountant-gated actions (need PROJECT_ACCOUNTANT in specified/any project) ─
const ACCOUNTANT_GATED: Partial<Record<Resource, string[]>> = {
    invoices: ["approve"],
    custodies: ["issue"],
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProtectProps<R extends Resource> {
    resource: R;
    action: Action<R>;
    /**
     * Optional: check against a specific project.
     * If not provided, checks if the user has the role in ANY project.
     */
    projectId?: string | null;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function Protect<R extends Resource>({
    resource,
    action,
    projectId,
    fallback = null,
    children,
}: ProtectProps<R>) {
    const allowed = useCanDo(resource, action, projectId);
    return allowed ? <>{children}</> : <>{fallback}</>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Primary permission hook — checks both system-level and project-level access.
 *
 * @param resource - Permission resource (e.g. "purchases", "invoices")
 * @param action   - Permission action (e.g. "create", "approve")
 * @param projectId - (optional) restrict check to a specific project
 * @returns true if the user may perform the action
 */
export function useCanDo<R extends Resource>(
    resource: R,
    action: Action<R>,
    projectId?: string | null
): boolean {
    const {
        user,
        isCoordinatorInAny,
        isAccountantInAny,
        isCoordinatorIn,
        isAccountantIn,
    } = useAuth();

    if (!user) return false;
    const role = user.role as UserRole;

    // 1. System-level check (PERMISSIONS matrix)
    if (canDo(role, resource, action)) return true;

    // 2. Coordinator-gated: needs PROJECT_MANAGER in the given (or any) project
    if (COORDINATOR_GATED[resource]?.includes(action as string)) {
        return projectId ? isCoordinatorIn(projectId) : isCoordinatorInAny;
    }

    // 3. Accountant-gated: needs PROJECT_ACCOUNTANT in the given (or any) project
    //    Also granted to GLOBAL_ACCOUNTANT + ADMIN via AuthContext helpers
    if (ACCOUNTANT_GATED[resource]?.includes(action as string)) {
        return projectId ? isAccountantIn(projectId) : isAccountantInAny;
    }

    return false;
}
