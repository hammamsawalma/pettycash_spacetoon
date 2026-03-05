import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * هذه الصفحة القديمة كانت تُصرف عهدة مباشرة بدون مشروع.
 * المنطق الجديد: العهدة تُصرف فقط من داخل صفحة المشروع (تبويب "فريق المشروع والعُهد").
 * نعيد التوجيه للمشاريع حتى يختار المدير المشروع المناسب.
 */
export default async function CustodyNewPage() {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
        redirect("/");
    }
    // توجيه مباشر لصفحة المشاريع — العهدة تُصرف من داخل المشروع
    redirect("/projects");
}
