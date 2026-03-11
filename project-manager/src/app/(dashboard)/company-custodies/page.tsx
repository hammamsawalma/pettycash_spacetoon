import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyCustodies } from "@/actions/custody";
import CompanyCustodiesClient from "./CompanyCustodiesClient";

export default async function CompanyCustodiesPage() {
    const session = await getSession();
    if (!session) redirect("/welcome");

    const canView = session.role === "ADMIN" || session.role === "GLOBAL_ACCOUNTANT" || session.role === "GENERAL_MANAGER";
    if (!canView) redirect("/");

    const custodies = await getCompanyCustodies();

    return <CompanyCustodiesClient custodies={custodies as any} role={session.role} />;
}
