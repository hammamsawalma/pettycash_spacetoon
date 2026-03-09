/**
 * ════════════════════════════════════════════════════════════════════════
 *  CENTRALIZED ROLE-BASED ACCESS CONTROL (RBAC)
 *  Single Source of Truth — v4 (2026-03-09)
 *
 *  System Roles  (session.role / User.role in DB):
 *    ADMIN             – Superuser: create projects/employees, manage trash
 *    GENERAL_MANAGER   – Executive: view everything + create purchase orders
 *    GLOBAL_ACCOUNTANT – Financial: approve invoices, issue custody, settle debts, manage all projects financially
 *    USER              – Project-scoped; further differentiated by projectRoles
 *
 *  Project-level Roles (ProjectMember.projectRoles — comma-separated CSV):
 *    PROJECT_MANAGER   – Coordinator: creates purchase orders, can cancel purchases
 *    PROJECT_EMPLOYEE  – Base role: submits invoices, receives custody
 *
 *  Key design decisions (v4):
 *  - PROJECT_ACCOUNTANT removed — GLOBAL_ACCOUNTANT handles all projects
 *  - Salary feature removed from UI
 *  - custodies.issue: ADMIN + GLOBAL_ACCOUNTANT (all projects)
 *  - custodies.recordReturn: GLOBAL_ACCOUNTANT only
 *  - invoices.approve: GLOBAL_ACCOUNTANT only (system-level)
 *  - invoices.delete: ADMIN + GLOBAL_ACCOUNTANT
 *  - purchases.cancel: ADMIN + USER (PROJECT_MANAGER — gated via context)
 *  - debts.view: all roles (USER sees own debts only)
 * ════════════════════════════════════════════════════════════════════════
 */

import { UserRole } from "@/context/AuthContext";

// ─── System-Level Permissions ─────────────────────────────────────────────────

export const PERMISSIONS = {

    // ── Employees ──────────────────────────────────────────────────────────────
    employees: {
        /** Can create a new employee account */
        create: ["ADMIN"] as UserRole[],
        /** Can edit employee details (name, role, password, image) */
        edit: ["ADMIN"] as UserRole[],
        /** Can soft-delete an employee (move to trash) */
        delete: ["ADMIN"] as UserRole[],
        /** Can view the employees LIST page (management only) */
        viewAll: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can view a single employee profile (all authenticated roles) */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
    },

    // ── Projects ────────────────────────────────────────────────────────────────
    projects: {
        /** Can create a new project — ADMIN only */
        create: ["ADMIN"] as UserRole[],
        /** Can edit ANY project — ADMIN only */
        edit: ["ADMIN"] as UserRole[],
        /** Can permanently close (complete) a project */
        close: ["ADMIN"] as UserRole[],
        /** Can reopen an archived/completed project */
        reopen: ["ADMIN"] as UserRole[],
        /** Can view all projects (ADMIN, GENERAL_MANAGER, GLOBAL_ACCOUNTANT) or only their own */
        viewAll: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Custodies (العهدات) ──────────────────────────────────────────────────────
    custodies: {
        /**
         * Can issue (صرف) a new custody to an employee.
         * ADMIN: any project.
         * GLOBAL_ACCOUNTANT: all projects (v4: handles all projects financially).
         */
        issue: ["ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can confirm receipt of a custody — only the receiving employee (or GLOBAL_ACCOUNTANT for company custody) */
        confirmReceipt: ["USER", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /**
         * Can record a custody return (إرجاع).
         * v4: GLOBAL_ACCOUNTANT only — ADMIN no longer records returns.
         */
        recordReturn: ["GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can view custody records */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
    },

    // ── Invoices (الفواتير) ──────────────────────────────────────────────────────
    invoices: {
        /**
         * Can create/upload a new invoice.
         * GENERAL_MANAGER is explicitly excluded — view-only role.
         */
        create: ["ADMIN", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        /**
         * Approve/reject invoices.
         * v4: GLOBAL_ACCOUNTANT only — handles all projects.
         */
        approve: ["GLOBAL_ACCOUNTANT"] as UserRole[],
        /**
         * Can delete an invoice.
         * v4: GLOBAL_ACCOUNTANT added.
         */
        delete: ["ADMIN", "GLOBAL_ACCOUNTANT"] as UserRole[],
        /** Can view all invoices regardless of project */
        viewAll: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT"] as UserRole[],
    },

    // ── Purchases (المشتريات) ────────────────────────────────────────────────────
    purchases: {
        /** Can view the purchases list */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        /**
         * Can navigate to /purchases/new from global navigation.
         * ADMIN + GENERAL_MANAGER see this nav link globally.
         * USER/Coordinator access is added via AuthContext.isCoordinatorInAny check in UI.
         */
        createGlobal: ["ADMIN", "GENERAL_MANAGER"] as UserRole[],
        /**
         * Can create a new purchase order.
         * ADMIN + GENERAL_MANAGER at system level.
         * USER + PROJECT_MANAGER validated server-side via prisma.projectMember check.
         */
        create: ["ADMIN", "GENERAL_MANAGER"] as UserRole[],
        /** Can update purchase status (IN_PROGRESS / PURCHASED) */
        updateStatus: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
        /**
         * Can cancel a purchase order.
         * v4: USER added — PROJECT_MANAGER can cancel (gated via context).
         */
        cancel: ["ADMIN", "USER"] as UserRole[],
    },

    // ── Debts (الديون الشخصية) ───────────────────────────────────────────────────
    debts: {
        /**
         * Can settle employee personal debts.
         * GLOBAL_ACCOUNTANT + ADMIN.
         */
        settle: ["GLOBAL_ACCOUNTANT", "ADMIN"] as UserRole[],
        /**
         * Can view debts.
         * v4: USER added — can see own personal debts only.
         */
        view: ["ADMIN", "GENERAL_MANAGER", "GLOBAL_ACCOUNTANT", "USER"] as UserRole[],
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
