import { getPurchases } from "@/actions/purchases";
import PurchasesClient from "./PurchasesClient";

export default async function PurchasesPage() {
    const purchases = await getPurchases();
    return <PurchasesClient initialPurchases={purchases} />;
}
