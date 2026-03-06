/**
 * ════════════════════════════════════════════════════════════════════════
 *  CENTRALIZED ROLE-BASED ACCESS CONTROL (RBAC)
 *  Single Source of Truth — derived strictly from user_manual.html v3.0
 *
 *  System Roles  (session.role):
 *    ADMIN             – Full system access
 *    GENERAL_MANAGER   – Global view, same as ADMIN for read-only
 *    GLOBAL_ACCOUNTANT – Financial oversight, invoices & wallet
 *    USER              – Project-scoped; further differentiated by projectRoles
 *
 *  Project-level Roles (projectRoles field on ProjectMember):
 *    COORDINATOR  – Manages projects they own/coordinate
 *    ACCOUNTANT   – Project-level accountant (can approve invoices in that project)
 *    EMPLOYEE     – Regular project member
 * ════════════════════════════════════════════════════════════════════════
 */

import { UserRole } from "@/context/AuthContext";

// ─── System-Level Permissions ─────────────────────────────────────────────────

export const PERMISSIONS = {

    // ── Employees ──────────────────────────────────────────────────────────────
    employees: {
        /** Can create a new employee account */
        create: ["ADMIN"] as UserRole[],
        /** Can edit employee details (name, role, salary, password, image) */
        edit: ["ADMIN"] as UserRole[],
        /** Can soft-delete an employee (move to trash) */
        delete: ["ADMIN"] as UserRole[],
        /** Can view the list of employees */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        /** Can see salary figures for all employees */
        viewSalaries: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Projects ────────────────────────────────────────────────────────────────
    projects: {
        /**
         * Can create a new project.
         * NOTE: USER who is COORDINATOR in a project can also create — handled in action
         * by checking projectRoles; here we expose the minimum system-level roles.
         */
        create: ["ADMIN", "USER"] as UserRole[],   // USER + coordinator role validated server-side
        /** Can edit ANY project (ADMIN) or only their own managed projects (USER/COORDINATOR) */
        edit: ["ADMIN", "USER"] as UserRole[],
        /** Can permanently close (complete) a project */
        close: ["ADMIN"] as UserRole[],
        /** Can reopen an archived/completed project */
        reopen: ["ADMIN"] as UserRole[],
        /** Can view all projects (ADMIN, GENERAL_MANAGER, GLOBAL_ACCOUNTANT) or only their own */
        viewAll: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Custodies (العهدات) ──────────────────────────────────────────────────────
    custodies: {
        /** Can issue (صرف) a new custody to an employee */
        issue: ["ADMIN", "USER"] as UserRole[],  // USER + COORDINATOR role
        /** Can confirm receipt of a custody — only the receiving employee */
        confirmReceipt: ["USER"] as UserRole[],
        /** Can do emergency transfer of custody between employees */
        transfer: ["ADMIN", "USER"] as UserRole[],  // USER + COORDINATOR role
        /** Can record a custody return (إرجاع) */
        recordReturn: ["ADMIN"] as UserRole[],
        /** Can view custody records */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
    },

    // ── Invoices (الفواتير) ──────────────────────────────────────────────────────
    invoices: {
        /** Can create/upload a new invoice */
        create: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        /** Can approve or reject a pending invoice */
        approve: ["ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can hard-delete an invoice */
        delete: ["ADMIN"] as UserRole[],
        /** Can view all invoices regardless of project */
        viewAll: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Purchases (المشتريات) ────────────────────────────────────────────────────
    purchases: {
        /** Can create a new purchase order */
        create: ["ADMIN", "USER"] as UserRole[],  // USER + COORDINATOR role
        /** Can update purchase status (IN_PROGRESS / PURCHASED) — any member */
        updateStatus: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        /** Can cancel a purchase order */
        cancel: ["ADMIN", "USER"] as UserRole[],  // USER + COORDINATOR role
    },

    // ── Debts (الديون الشخصية) ───────────────────────────────────────────────────
    debts: {
        /** Can settle employee personal debts */
        settle: ["ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can view the debts list */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Company Wallet / Safe (خزنة الشركة) ──────────────────────────────────────
    wallet: {
        /** Can deposit money into the company wallet */
        deposit: ["ADMIN"] as UserRole[],
        /** Can allocate budget from wallet to a project */
        allocate: ["ADMIN"] as UserRole[],
        /** Can view wallet balance and transactions */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Financial Requests (الطلبات المالية) ─────────────────────────────────────
    financialRequests: {
        /** Can create a financial request */
        create: ["ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can approve or reject a financial request */
        approve: ["ADMIN"] as UserRole[],
        /** Can view financial requests */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Reports (التقارير) ────────────────────────────────────────────────────────
    reports: {
        /** Can view system-wide analytics and reports */
        viewAll: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** USER can view reports scoped to their own projects only */
        viewOwn: ["USER"] as UserRole[],
    },

    // ── Trash (سلة المهملات) ──────────────────────────────────────────────────────
    trash: {
        /** Can view, restore, or permanently delete items from trash */
        manage: ["ADMIN"] as UserRole[],
    },

    // ── Archive (الأرشيف) ─────────────────────────────────────────────────────────
    archive: {
        /** Can view archived/completed projects */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can reopen archived projects */
        reopen: ["ADMIN"] as UserRole[],
    },

    // ── Notifications ────────────────────────────────────────────────────────────
    notifications: {
        /** Can broadcast a notification to all or specific users */
        send: ["ADMIN", "GENERAL_MANAGER"] as UserRole[],
    },

    // ── System Settings ──────────────────────────────────────────────────────────
    settings: {
        /** Can change system-level settings */
        manage: ["ADMIN"] as UserRole[],
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
    return ["ADMIN", "GLOBAL_ACCOUNTANT", "GENERAL_MANAGER"].includes(role);
}

/**
 * Check project-level role from the comma-separated `projectRoles` string on ProjectMember.
 *
 * @example
 *   hasProjectRole("COORDINATOR,EMPLOYEE", ["COORDINATOR"]) // => true
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
 * Determine if a USER-role user is a coordinator in a given project context.
 * Used in server actions that need project-level role validation.
 */
export function isProjectCoordinator(projectRoles: string | null | undefined): boolean {
    return hasProjectRole(projectRoles, ["COORDINATOR"]);
}
