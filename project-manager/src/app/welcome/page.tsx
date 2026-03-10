import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBranches } from "@/actions/branches";
import WelcomeClient from "./WelcomeClient";

export const metadata = {
    title: "Spacetoon Pocket | اختر الفرع",
    description: "مرحباً بك في نظام سبيستون بوكيت — اختر الفرع للمتابعة",
};

export default async function WelcomePage() {
    const session = await getSession();
    if (session) redirect("/");

    let branches: Awaited<ReturnType<typeof getBranches>> = [];
    try {
        branches = await getBranches();
    } catch (e) {
        console.error("[Welcome] Failed to fetch branches:", e);
        // Render with empty branches — WelcomeClient will show a fallback
    }

    return <WelcomeClient branches={branches} />;
}

