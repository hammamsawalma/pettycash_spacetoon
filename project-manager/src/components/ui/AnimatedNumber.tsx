"use client";
import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    delay?: number;
    formatter?: (value: number) => string;
}

export function AnimatedNumber({ value, duration = 1.5, delay = 0, formatter = (v) => v.toLocaleString('en-US') }: AnimatedNumberProps) {
    const count = useMotionValue(0);
    const displayed = useTransform(count, (latest) => formatter(Math.round(latest)));

    useEffect(() => {
        const controls = animate(count, value, {
            duration: duration,
            delay: delay,
            ease: "easeOut",
        });

        return controls.stop;
    }, [count, value, duration, delay]);

    return <motion.span>{displayed}</motion.span>;
}
