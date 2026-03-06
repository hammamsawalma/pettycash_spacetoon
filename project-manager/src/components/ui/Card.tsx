"use client";
import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type CardProps = React.HTMLAttributes<HTMLDivElement> & HTMLMotionProps<"div">;

export function Card({ className = "", children, ...props }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`rounded-3xl border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_8px_40px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] hover:border-white/80 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
}

