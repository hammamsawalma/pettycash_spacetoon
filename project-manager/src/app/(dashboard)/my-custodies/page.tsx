import { getSession } from "@/lib/auth";
import { getMyCustodies } from "@/actions/custody";
import { redirect } from "next/navigation";
import MyCustodiesClient from "./MyCustodiesClient";

export const metadata = {
    title: "My Custodies | Project Manager",
    description: "View and manage custodies assigned to you",
};

export default async function MyCustodiesPage() {
    const session = await getSession();

    if (!session || session.role !== "USER") {
        redirect("/");
    }

    const custodies = await getMyCustodies();

    return <MyCustodiesClient custodies={custodies} />;
}
