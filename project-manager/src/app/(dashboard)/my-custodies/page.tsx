import { getSession } from "@/lib/auth";
import { getMyCustodies, confirmCustodyReceipt, rejectCustody } from "@/actions/custody";
import { redirect } from "next/navigation";
import MyCustodiesClient from "./MyCustodiesClient";

export const metadata = {
    title: "إدارة عهدي | نظام إدارة المشاريع",
    description: "استعراض وإدارة العهد المسندة إليك",
};

export default async function MyCustodiesPage() {
    const session = await getSession();

    if (!session || session.role !== "USER") {
        redirect("/");
    }

    const custodies = await getMyCustodies();

    return <MyCustodiesClient custodies={custodies} />;
}
