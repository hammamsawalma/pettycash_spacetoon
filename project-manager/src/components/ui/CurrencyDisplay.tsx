"use client";

import { useCurrency } from "@/context/CurrencyContext";

export function CurrencyDisplay() {
    const { currency } = useCurrency();
    return <>{currency}</>;
}
