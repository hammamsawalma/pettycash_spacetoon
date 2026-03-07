/**
 * SkeletonCard — Reusable shimmer loading skeletons
 *
 * Usage:
 *   <InvoiceCardSkeleton />
 *   <ProjectCardSkeleton />
 *   <StatCardSkeleton />
 *   <DashboardSkeleton role="USER" />
 */

// ─── Base building blocks ─────────────────────────────────────────────────────

function SkeletonLine({ className = "" }: { className?: string }) {
    return <div className={`skeleton h-4 rounded-md ${className}`} />;
}

function SkeletonCircle({ className = "" }: { className?: string }) {
    return <div className={`skeleton rounded-full ${className}`} />;
}

function SkeletonBox({ className = "" }: { className?: string }) {
    return <div className={`skeleton rounded-xl ${className}`} />;
}

// ─── Invoice Card Skeleton ─────────────────────────────────────────────────────

export function InvoiceCardSkeleton() {
    return (
        <div className="p-3 md:p-5 flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm gap-3">
            {/* Top row: avatar + title */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <SkeletonBox className="w-8 h-8 md:w-12 md:h-12" />
                    <div className="space-y-1.5">
                        <SkeletonLine className="w-24 md:w-32" />
                        <SkeletonLine className="w-14 md:w-20 h-3 opacity-60" />
                    </div>
                </div>
                <SkeletonBox className="w-6 h-6 md:w-12 md:h-12 opacity-30" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <SkeletonLine className="w-full opacity-50" />
                <SkeletonLine className="w-3/4 opacity-40" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                <SkeletonBox className="h-12 md:h-14" />
                <SkeletonBox className="h-12 md:h-14" />
                <SkeletonBox className="h-10 col-span-2" />
            </div>

            {/* Bottom row */}
            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <SkeletonLine className="w-16 h-5" />
                <SkeletonBox className="w-8 h-8" />
            </div>
        </div>
    );
}

// ─── Project Card Skeleton ─────────────────────────────────────────────────────

export function ProjectCardSkeleton() {
    return (
        <div className="p-4 md:p-5 flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm gap-3">
            <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                    <SkeletonLine className="w-28 md:w-36" />
                    <SkeletonLine className="w-16 h-3 opacity-60" />
                </div>
                <SkeletonLine className="w-14 h-5 opacity-60" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <SkeletonBox className="h-12" />
                <SkeletonBox className="h-12" />
            </div>
            <SkeletonBox className="h-10 mt-1" />
        </div>
    );
}

// ─── Stat / KPI Card Skeleton ──────────────────────────────────────────────────

export function StatCardSkeleton() {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <SkeletonBox className="w-10 h-10 md:w-12 md:h-12 shrink-0" />
            <div className="space-y-2 flex-1">
                <SkeletonLine className="w-24 h-3 opacity-60" />
                <SkeletonLine className="w-20 h-6" />
            </div>
        </div>
    );
}

// ─── List Row Skeleton (for notification / purchase rows) ─────────────────────

export function ListRowSkeleton() {
    return (
        <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 gap-3">
            <div className="space-y-1.5 flex-1">
                <SkeletonLine className="w-32" />
                <SkeletonLine className="w-20 h-3 opacity-60" />
            </div>
            <div className="space-y-1.5 items-end flex flex-col">
                <SkeletonLine className="w-16 h-4" />
                <SkeletonLine className="w-12 h-3 opacity-60" />
            </div>
        </div>
    );
}

// ─── Full Dashboard Skeletons by Role ──────────────────────────────────────────

export function EmployeeDashboardSkeleton() {
    return (
        <div className="space-y-6 pb-6 animate-in fade-in duration-200">
            {/* CTA button placeholder */}
            <SkeletonBox className="w-full h-20 md:h-24" />

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Projects grid */}
            <div className="space-y-3">
                <SkeletonLine className="w-28 h-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <ProjectCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function AdminDashboardSkeleton() {
    return (
        <div className="space-y-6 pb-6 animate-in fade-in duration-200">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Chart placeholder */}
            <SkeletonBox className="w-full h-48 md:h-64" />

            {/* Recent items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SkeletonBox className="h-48" />
                <SkeletonBox className="h-48" />
            </div>
        </div>
    );
}

export function GeneralManagerDashboardSkeleton() {
    return (
        <div className="space-y-6 pb-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
            <SkeletonBox className="w-full h-56" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SkeletonBox className="h-40 lg:col-span-2" />
                <SkeletonBox className="h-40" />
            </div>
        </div>
    );
}

export function AccountantDashboardSkeleton() {
    return (
        <div className="space-y-6 pb-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
            <div className="space-y-3">
                <SkeletonLine className="w-24 h-5" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <ListRowSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

// ─── Invoice List Skeleton ─────────────────────────────────────────────────────

export function InvoiceListSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <InvoiceCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ─── Purchase List Skeleton ────────────────────────────────────────────────────

export function PurchaseListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <ListRowSkeleton key={i} />
            ))}
        </div>
    );
}
