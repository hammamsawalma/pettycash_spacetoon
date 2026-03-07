"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

/**
 * FormPageSkeleton — Suspense fallback for /invoices/new, /purchases/new, etc.
 * Shows a shimmer skeleton that mimics a form layout.
 */
export function FormPageSkeleton({ title }: { title: string }) {
    return (
        <DashboardLayout title={title}>
            <div className="pb-6 px-4 max-w-4xl mx-auto animate-pulse">
                {/* Card container */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-8 space-y-6">
                    {/* Heading */}
                    <div className="h-5 bg-gray-200 rounded-lg w-40" />
                    <div className="h-px bg-gray-100" />

                    {/* Field rows */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Field 1 */}
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-20" />
                            <div className="h-12 bg-gray-100 rounded-xl" />
                        </div>
                        {/* Field 2 */}
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-28" />
                            <div className="h-12 bg-gray-100 rounded-xl" />
                        </div>
                        {/* Field 3 — full width */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <div className="h-3 bg-gray-200 rounded w-24" />
                            <div className="h-24 bg-gray-100 rounded-xl" />
                        </div>
                        {/* Field 4 */}
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-16" />
                            <div className="h-12 bg-gray-100 rounded-xl" />
                        </div>
                    </div>

                    {/* Bottom button area */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <div className="h-12 bg-gray-200 rounded-2xl w-40" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
