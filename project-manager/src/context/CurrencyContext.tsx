"use client"

import React, { createContext, useContext, useState, useEffect } from "react";
import { getGlobalCurrency } from "@/actions/settings";

interface CurrencyContextType {
    currency: string;
    setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children, initialCurrency }: { children: React.ReactNode, initialCurrency: string }) {
    const [currency, setCurrencyState] = useState(initialCurrency || "ر.ق");

    // In case 'initialCurrency' somehow didn't catch, we sync once on mount
    useEffect(() => {
        if (!initialCurrency) {
            getGlobalCurrency().then(c => setCurrencyState(c));
        }
    }, [initialCurrency]);

    const setCurrency = (newCurrency: string) => {
        setCurrencyState(newCurrency);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
