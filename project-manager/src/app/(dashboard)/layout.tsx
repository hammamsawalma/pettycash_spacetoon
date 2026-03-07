import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthProvider } from "@/context/AuthContext";
import { getGlobalCurrency } from "@/actions/settings";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ProjectRolesProvider } from "@/context/ProjectRolesContext";

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

    return (
        <AuthProvider initialUser={user}>
            <CurrencyProvider initialCurrency={currency}>
                <ProjectRolesProvider>
                    {children}
                </ProjectRolesProvider>
            </CurrencyProvider>
        </AuthProvider>
    );
}

