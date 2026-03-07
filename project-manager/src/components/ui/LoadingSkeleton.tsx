import React from "react";
import { Card } from "./Card";

export function LoadingSkeleton({ count = 3, type = "card" }: { count?: number, type?: "card" | "list" | "stats" }) {
    if (type === "stats") {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="p-6 border-gray-100 flex items-center justify-between relative overflow-hidden bg-white">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
                        <div className="space-y-4 relative z-0 w-full animate-pulse">
                            <div className="h-4 w-24 bg-blue-50 rounded"></div>
                            <div className="h-8 w-16 bg-blue-50 rounded"></div>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl relative z-0 animate-pulse"></div>
                    </Card>
                ))}
            </div>
        )
    }

    if (type === "list") {
        return (
            <Card className="shadow-sm border-gray-100 divide-y divide-gray-50 bg-white relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10 pointer-events-none" />
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="p-4 sm:p-6 flex justify-between items-center w-full relative z-0 animate-pulse">
                        <div className="flex gap-4 items-center w-full">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl"></div>
                            <div className="space-y-3 flex-1">
                                <div className="h-4 bg-blue-50 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </Card>
        )
    }

    // Default Card Grid
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="p-6 border-gray-100 flex flex-col items-center relative overflow-hidden bg-white">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
                    <div className="relative z-0 flex flex-col items-center w-full animate-pulse">
                        <div className="w-24 h-24 bg-blue-50 rounded-full mb-5 shadow-inner"></div>
                        <div className="h-5 bg-blue-50 rounded w-3/4 mb-3"></div>
                        <div className="h-3 bg-gray-50 rounded w-1/2 mb-6"></div>
                        <div className="w-full h-16 bg-gray-50 py-2 rounded-xl flex gap-2 p-2">
                            <div className="flex-1 h-full bg-blue-50/50 rounded-lg"></div>
                            <div className="flex-1 h-full bg-blue-50/50 rounded-lg"></div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
