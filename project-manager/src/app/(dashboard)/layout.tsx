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
    // ── Session check ───────────────────────────────────────────────────────
    let user;
    try {
        user = await getSession();
    } catch (err) {
        console.error("[DashboardLayout] getSession() crashed:", err);
        redirect("/welcome");
    }

    if (!user) {
        redirect("/welcome");
    }

    // ── Currency (fallback on error) ────────────────────────────────────────
    let currency = "QAR";
    try {
        currency = await getGlobalCurrency();
    } catch (err) {
        console.error("[DashboardLayout] getGlobalCurrency() crashed:", err);
    }

    // ── Project memberships (fallback on error) ─────────────────────────────
    let memberships: ProjectMembership[] = [];
    if (user.role === "USER" || user.role === "GLOBAL_ACCOUNTANT") {
        try {
            const rawMemberships = await prisma.projectMember.findMany({
                where: { userId: user.id },
                select: { projectId: true, projectRoles: true },
            });
            memberships = rawMemberships;
        } catch (err) {
            console.error("[DashboardLayout] projectMember.findMany() crashed:", err);
        }
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
