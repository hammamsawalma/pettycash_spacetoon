import { getPurchaseById } from "@/actions/purchases";
import PurchaseDetailsClient from "./PurchaseDetailsClient";
import { redirect } from "next/navigation";

export default async function PurchaseDetailsPage({ params }: { params: { id: string } }) {
    const purchase = await getPurchaseById(params.id);

    if (!purchase) {
        redirect("/purchases");
    }

    return <PurchaseDetailsClient initialPurchase={purchase as any} />;
}
