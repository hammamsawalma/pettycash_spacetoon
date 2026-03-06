"use client";
import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "danger";
    size?: "default" | "sm" | "lg";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "default", isLoading = false, disabled, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus:ring-2 focus:ring-[#7F56D9]/50 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

        let variantStyles = "";
        if (variant === "primary") variantStyles = "bg-gradient-to-r from-[#7F56D9] to-[#9E77ED] text-white hover:shadow-lg hover:shadow-[#7F56D9]/25 hover:from-[#6941C6] hover:to-[#7F56D9] border border-transparent";
        if (variant === "secondary") variantStyles = "bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200 hover:bg-gray-50 hover:shadow-md hover:border-gray-300";
        if (variant === "outline") variantStyles = "border-[1.5px] border-[#7F56D9]/50 text-[#7F56D9] hover:bg-[#7F56D9]/5 hover:border-[#7F56D9]";
        if (variant === "danger") variantStyles = "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25 border border-transparent";

        let sizeStyles = "";
        if (size === "default") sizeStyles = "min-h-[44px] h-11 px-5 py-2";
        if (size === "sm") sizeStyles = "min-h-[44px] h-9 rounded-lg px-4 text-xs";
        if (size === "lg") sizeStyles = "min-h-[52px] h-14 rounded-2xl px-8 text-base";

        return (
            <motion.button
                ref={ref}
                whileHover={{ y: disabled || isLoading ? 0 : -1, scale: disabled || isLoading ? 1 : 1.01 }}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
                className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                disabled={disabled || isLoading}
                {...(props as HTMLMotionProps<"button">)}
            >
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children}
            </motion.button>
        );
    }
);
Button.displayName = "Button";
