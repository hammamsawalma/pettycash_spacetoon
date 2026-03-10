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

    const branches = await getBranches();

    return <WelcomeClient branches={branches} />;
}
