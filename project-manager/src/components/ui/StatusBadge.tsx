import * as React from "react";

type StatusVariant = "COMPLETED" | "APPROVED" | "IN_PROGRESS" | "PENDING" | "REJECTED" | "CANCELLED";

interface StatusBadgeProps {
    status: StatusVariant | string;
    className?: string;
    variant?: "solid" | "soft" | "outline";
}

const statusMap: Record<string, { label: string; color: string }> = {
    // Green
    "COMPLETED": { label: "مكتمل", color: "emerald" },
    "APPROVED": { label: "معتمد", color: "emerald" },
    "PURCHASED": { label: "تم الشراء", color: "emerald" },

    // Blue / Purple
    "IN_PROGRESS": { label: "قيد التنفيذ", color: "purple" },
    "REQUESTED": { label: "مطلوب", color: "indigo" },

    // Orange / Amber
    "PENDING": { label: "معلق", color: "amber" },

    // Red
    "REJECTED": { label: "مرفوض", color: "red" },
    "CANCELLED": { label: "ملغي", color: "rose" },
};

export function StatusBadge({ status, className = "", variant = "soft" }: StatusBadgeProps) {
    const defaultMapping = { label: status || "غير محدد", color: "gray" };
    const mapped = statusMap[status] || defaultMapping;

    const baseStyles = "inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-lg text-[10px] md:text-xs shrink-0";

    const variantStyles = {
        soft: `bg-${mapped.color}-50 text-${mapped.color}-600`,
        solid: `bg-${mapped.color}-500 text-white`,
        outline: `bg-transparent border border-${mapped.color}-200 text-${mapped.color}-600`
    };

    return (
        <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
            {mapped.label}
        </span>
    );
}
