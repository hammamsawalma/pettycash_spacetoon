"use client";
import * as React from "react";
import { useLanguage } from "@/context/LanguageContext";

type StatusVariant = "COMPLETED" | "APPROVED" | "IN_PROGRESS" | "PENDING" | "REJECTED" | "CANCELLED";

interface StatusBadgeProps {
    status: StatusVariant | string;
    className?: string;
    variant?: "solid" | "soft" | "outline";
}

const statusColorMap: Record<string, string> = {
    "COMPLETED": "emerald",
    "APPROVED": "emerald",
    "PURCHASED": "emerald",
    "CONFIRMED": "emerald",
    "IN_PROGRESS": "blue",
    "REQUESTED": "blue",
    "PENDING": "amber",
    "REJECTED": "red",
    "CANCELLED": "rose",
    "CLOSED": "gray",
};

export function StatusBadge({ status, className = "", variant = "soft" }: StatusBadgeProps) {
    const { t } = useLanguage();
    const color = statusColorMap[status] || "gray";
    const label = t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status;
    const mapped = { label, color };

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
