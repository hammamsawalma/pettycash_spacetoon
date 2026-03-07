import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthProvider, ProjectMembership } from "@/context/AuthContext";
import { getGlobalCurrency } from "@/actions/settings";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ProjectRolesProvider } from "@/context/ProjectRolesContext";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getSession();
    const currency = await getGlobalCurrency();

    if (!user) {
        redirect("/login");
    }

    // ── Fetch project memberships for the current user ──────────────────────
    // We fetch for USER and GLOBAL_ACCOUNTANT roles.
    // ADMIN and GENERAL_MANAGER don't need project-level roles — they have system-level access.
    let memberships: ProjectMembership[] = [];
    if (user.role === "USER" || user.role === "GLOBAL_ACCOUNTANT") {
        const rawMemberships = await prisma.projectMember.findMany({
            where: { userId: user.id },
            select: { projectId: true, projectRoles: true },
        });
        memberships = rawMemberships;
    }

    return (
        <AuthProvider initialUser={user} initialMemberships={memberships}>
            <CurrencyProvider initialCurrency={currency}>
                <ProjectRolesProvider>
                    {children}
                </ProjectRolesProvider>
            </CurrencyProvider>
        </AuthProvider>
    );
}
