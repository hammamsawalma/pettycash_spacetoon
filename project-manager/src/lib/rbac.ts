export const GLOBAL_ROLES = {
    ADMIN: "ADMIN",
    GENERAL_MANAGER: "GENERAL_MANAGER",
    GLOBAL_ACCOUNTANT: "GLOBAL_ACCOUNTANT",
    USER: "USER", // Regular employees without global admin/finance rights
} as const;

export type GlobalRole = keyof typeof GLOBAL_ROLES;

export const PROJECT_ROLES = {
    PROJECT_MANAGER: "PROJECT_MANAGER",     // المنسق
    PROJECT_ACCOUNTANT: "PROJECT_ACCOUNTANT",// محاسب المشروع
    PROJECT_EMPLOYEE: "PROJECT_EMPLOYEE",    // الموظف العادي في المشروع
} as const;

export type ProjectRole = keyof typeof PROJECT_ROLES;

export function hasGlobalPermission(userRole: string, allowedRoles: GlobalRole[]): boolean {
    return allowedRoles.includes(userRole as GlobalRole);
}

export function hasProjectPermission(userProjectRoles: string | ProjectRole[], allowedRoles: ProjectRole[]): boolean {
    const roles = Array.isArray(userProjectRoles) ? userProjectRoles : userProjectRoles.split(",").map(r => r.trim());
    return allowedRoles.some(role => (roles as string[]).includes(role));
}

export function isGlobalAdminOrManager(userRole: string): boolean {
    return hasGlobalPermission(userRole, ["ADMIN", "GENERAL_MANAGER"]);
}

export function isGlobalFinance(userRole: string): boolean {
    return hasGlobalPermission(userRole, ["ADMIN", "GLOBAL_ACCOUNTANT"]);
}
