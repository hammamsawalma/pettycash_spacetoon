"use client";

/**
 * ════════════════════════════════════════════════════════════════════════
 *  <Protect> — Conditional UI rendering based on RBAC permissions
 *
 *  Reads the current user from AuthContext and hides children if the
 *  user does not have the required system-level permission.
 *
 *  Usage:
 *    <Protect resource="projects" action="create">
 *      <button>إنشاء مشروع</button>
 *    </Protect>
 *
 *  For project-level role checks (coordinator / employee), use the
 *  `projectRoles` prop to pass the current member's projectRoles string:
 *    <Protect resource="custodies" action="issue" projectRoles={member.projectRoles}>
 *      <button>صرف عهدة</button>
 *    </Protect>
 * ════════════════════════════════════════════════════════════════════════
 */

import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS, canDo, hasProjectRole } from "@/lib/permissions";
import { UserRole } from "@/context/AuthContext";

type Resource = keyof typeof PERMISSIONS;
type Action<R extends Resource> = keyof typeof PERMISSIONS[R];

interface ProtectProps<R extends Resource> {
    resource: R;
    action: Action<R>;
    /**
     * Optional: comma-separated projectRoles from ProjectMember.projectRoles.
     * When provided, a USER role user with COORDINATOR in projectRoles will be
     * granted access to coordinator-level actions (issue custody, create purchase, etc.)
     */
    projectRoles?: string | null;
    /** Fallback to render when access is denied (defaults to null) */
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function Protect<R extends Resource>({
    resource,
    action,
    projectRoles,
    fallback = null,
    children,
}: ProtectProps<R>) {
    const { user } = useAuth();

    if (!user) return <>{fallback}</>;

    // 1. Check system-level role
    const hasSystemPermission = canDo(user.role as UserRole, resource, action);

    if (hasSystemPermission) {
        // For USER role, certain actions also require a coordinator project role
        if (user.role === "USER") {
            const coordinatorActions: Partial<Record<Resource, string[]>> = {
                projects: ["create", "edit"],
                custodies: ["issue", "transfer"],
                purchases: ["create", "cancel"],
            };
            const requiresCoordinator = coordinatorActions[resource]?.includes(action as string);
            if (requiresCoordinator) {
                if (!projectRoles || !hasProjectRole(projectRoles, ["COORDINATOR"])) {
                    return <>{fallback}</>;
                }
            }
        }
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

/**
 * Hook version — returns a boolean so you can use it in conditions.
 *
 * @example
 *   const canClose = useCanDo("projects", "close");
 *   if (canClose) { ... }
 */
export function useCanDo<R extends Resource>(
    resource: R,
    action: Action<R>,
    projectRoles?: string | null
): boolean {
    const { user } = useAuth();
    if (!user) return false;

    const hasSystem = canDo(user.role as UserRole, resource, action);
    if (!hasSystem) return false;

    if (user.role === "USER") {
        const coordinatorActions: Partial<Record<Resource, string[]>> = {
            projects: ["create", "edit"],
            custodies: ["issue", "transfer"],
            purchases: ["create", "cancel"],
        };
        const requiresCoordinator = coordinatorActions[resource]?.includes(action as string);
        if (requiresCoordinator) {
            return !!projectRoles && hasProjectRole(projectRoles, ["COORDINATOR"]);
        }
    }

    return true;
}
