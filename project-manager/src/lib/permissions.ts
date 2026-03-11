/**
 * ════════════════════════════════════════════════════════════════════════
 *  CENTRALIZED ROLE-BASED ACCESS CONTROL (RBAC)
 *  Single Source of Truth — v8 (2026-03-10)
 *
 *  System Roles  (session.role / User.role in DB):
 *    ROOT              – Super admin: manage branches and all admins
 *    ADMIN             – Branch admin: create projects/employees, manage trash
 *    GENERAL_MANAGER   – Executive: view everything + create purchase orders
 *    GLOBAL_ACCOUNTANT – Financial: approve invoices, issue custody, settle debts
 *    USER              – Project-scoped; further differentiated by projectRoles
 *
 *  Project-level Roles (ProjectMember.projectRoles — comma-separated CSV):
 *    PROJECT_MANAGER   – Coordinator: creates purchase orders, can cancel purchases
 *    PROJECT_EMPLOYEE  – Base role: submits invoices, receives custody
 * ════════════════════════════════════════════════════════════════════════
 */

import { UserRole } from "@/context/AuthContext";

// ─── System-Level Permissions ─────────────────────────────────────────────────

export const PERMISSIONS = {

    // ── Employees ──────────────────────────────────────────────────────────────
    employees: {
        create: ["ROOT", "ADMIN"] as UserRole[],
        edit: ["ROOT", "ADMIN"] as UserRole[],
        delete: ["ROOT", "ADMIN"] as UserRole[],
        viewAll: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
    },

    // ── Projects ────────────────────────────────────────────────────────────────
    projects: {
        create: ["ROOT", "ADMIN"] as UserRole[],
        edit: ["ROOT", "ADMIN"] as UserRole[],
        close: ["ROOT", "ADMIN"] as UserRole[],
        reopen: ["ROOT", "ADMIN"] as UserRole[],
        viewAll: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Custodies (العهدات) ──────────────────────────────────────────────────────
    custodies: {
        issue: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        confirmReceipt: ["USER"] as UserRole[],
        sendReminder: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        recordReturn: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
    },

    // ── Invoices (الفواتير) ──────────────────────────────────────────────────────
    invoices: {
        create: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        approve: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        delete: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        viewAll: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Purchases (المشتريات) ────────────────────────────────────────────────────
    purchases: {
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        createGlobal: ["ROOT", "ADMIN", "GENERAL_MANAGER"] as UserRole[],
        create: ["ROOT", "ADMIN", "GENERAL_MANAGER"] as UserRole[],
        updateStatus: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        cancel: ["ROOT", "ADMIN", "USER"] as UserRole[],
    },

    // ── Debts (الديون الشخصية) ───────────────────────────────────────────────────
    debts: {
        settle: ["ROOT", "GLOBAL_ACCOUNTANT", "ADMIN"] as UserRole[],
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
    },

    wallet: {
        deposit: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT", "ACCOUNTANT" as any] as UserRole[],
        allocate: ["ROOT", "ADMIN"] as UserRole[],
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "ACCOUNTANT" as any] as UserRole[],
    },

    financialRequests: {
        create: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        approve: ["ROOT", "ADMIN"] as UserRole[],
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    reports: {
        viewAll: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    trash: {
        manage: ["ROOT", "ADMIN"] as UserRole[],
    },

    archive: {
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
        reopen: ["ROOT", "ADMIN"] as UserRole[],
    },

    notifications: {
        send: ["ROOT", "ADMIN", "GENERAL_MANAGER"] as UserRole[],
    },

    settings: {
        manage: ["ROOT", "ADMIN"] as UserRole[],
    },

    exports: {
        view: ["ROOT", "ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
        downloadAll: ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // v8: Branch management — ROOT only
    branches: {
        manage: ["ROOT"] as UserRole[],
        view: ["ROOT", "GENERAL_MANAGER"] as UserRole[],
    },
} as const;

// ─── Type Helpers ─────────────────────────────────────────────────────────────
type Resource = keyof typeof PERMISSIONS;
type Action<R extends Resource> = keyof typeof PERMISSIONS[R];

/**
 * Check if a system-level role has permission for a given resource + action.
 *
 * @example
 *   canDo("ADMIN", "projects", "close")        // => true
 *   canDo("GLOBAL_ACCOUNTANT", "trash", "manage") // => false
 */
export function canDo<R extends Resource>(
    role: UserRole | null | undefined,
    resource: R,
    action: Action<R>
): boolean {
    if (!role) return false;
    const allowed = PERMISSIONS[resource][action] as readonly UserRole[];
    return allowed.includes(role);
}

/**
 * Check if a user is a global "finance" role (ADMIN or GLOBAL_ACCOUNTANT).
 * These roles can see financial data across ALL projects.
 */
export function isGlobalFinance(role: UserRole | string): boolean {
    return ["ROOT", "ADMIN", "GLOBAL_ACCOUNTANT", "GENERAL_MANAGER"].includes(role);
}

/**
 * Check project-level role from the comma-separated `projectRoles` string on ProjectMember.
 *
 * @example
 *   hasProjectRole("PROJECT_MANAGER,PROJECT_EMPLOYEE", ["PROJECT_MANAGER"]) // => true
 */
export function hasProjectRole(
    projectRoles: string | string[] | null | undefined,
    allowedRoles: string[]
): boolean {
    if (!projectRoles) return false;
    const roles = Array.isArray(projectRoles)
        ? projectRoles
        : projectRoles.split(",").map((r) => r.trim());
    return allowedRoles.some((role) => roles.includes(role));
}

/**
 * Determine if a USER-role user is a coordinator (PROJECT_MANAGER) in a given project context.
 * Used in server actions that need project-level role validation.
 */
export function isProjectCoordinator(projectRoles: string | null | undefined): boolean {
    return hasProjectRole(projectRoles, ["PROJECT_MANAGER"]);
}
