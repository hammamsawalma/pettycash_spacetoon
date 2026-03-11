"use client";
import { use, useEffect, useState } from "react";
import { getPurchaseById } from "@/actions/purchases";
import PurchaseDetailsClient from "./PurchaseDetailsClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

export default function PurchaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { locale } = useLanguage();
    const [purchase, setPurchase] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getPurchaseById(id).then(data => {
            if (!data) {
                router.replace("/purchases");
                return;
            }
            setPurchase(data);
            setIsLoading(false);
        });
    }, [id, router]);

    if (isLoading) return (
        <DashboardLayout title={locale === 'ar' ? "تفاصيل طلب الشراء" : "Purchase Request Details"}>
            <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
                <div className="h-6 w-40 bg-gray-200 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-5">
                        <div className="aspect-[4/5] bg-gray-100 rounded-2xl" />
                    </div>
                    <div className="md:col-span-7 space-y-4">
                        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                        <div className="h-4 w-full bg-gray-100 rounded" />
                        <div className="h-4 w-3/4 bg-gray-100 rounded" />
                        <div className="h-20 bg-gray-50 rounded-xl" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );

    return <PurchaseDetailsClient initialPurchase={purchase} />;
}
