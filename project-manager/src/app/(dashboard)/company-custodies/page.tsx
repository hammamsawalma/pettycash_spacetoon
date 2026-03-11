import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyCustodies } from "@/actions/custody";
import CompanyCustodiesClient from "./CompanyCustodiesClient";

import prisma from "@/lib/prisma";

export default async function CompanyCustodiesPage() {
    const session = await getSession();
    if (!session) redirect("/welcome");

    const roleStr = session.role as string;
    const canView = roleStr === "ADMIN" || roleStr === "GLOBAL_ACCOUNTANT" || roleStr === "ACCOUNTANT" || roleStr === "GENERAL_MANAGER";
    if (!canView) redirect("/");

    const custodies = await getCompanyCustodies();
    const accountants = await prisma.user.findMany({
        where: { role: "GLOBAL_ACCOUNTANT" },
        select: { id: true, name: true }
    });

    return <CompanyCustodiesClient custodies={custodies as any} role={session.role} accountants={accountants} />;
}
