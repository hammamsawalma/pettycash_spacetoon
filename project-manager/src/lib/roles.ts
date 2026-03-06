/**
 * src/lib/roles.ts
 * 
 * Helper utilities for multi-role per-project system (V3)
 * Roles are stored as CSV strings in ProjectMember.projectRoles
 * e.g. "EMPLOYEE,ACCOUNTANT" or "EMPLOYEE,COORDINATOR"
 */
import prisma from "@/lib/prisma";

export type ProjectRole = "PROJECT_EMPLOYEE" | "PROJECT_ACCOUNTANT" | "PROJECT_MANAGER";

/**
 * Parse the CSV roles string into an array
 */
export function parseRoles(rolesStr: string): ProjectRole[] {
    return rolesStr.split(",").map(r => r.trim()).filter(Boolean) as ProjectRole[];
}

/**
 * Serialize an array of roles into a CSV string
 */
export function serializeRoles(roles: ProjectRole[]): string {
    // Deduplicate to ensure uniqueness
    const unique = Array.from(new Set(roles));
    return unique.join(",");
}

/**
 * Get all roles a user has in a specific project
 */
export async function getUserRolesInProject(projectId: string, userId: string): Promise<ProjectRole[]> {
    const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } }
    });
    if (!member) return [];
    return parseRoles(member.projectRoles);
}
