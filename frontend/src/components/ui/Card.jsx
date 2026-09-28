import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
const VARIANT_CLASSES = {
    default: "card-white",
    white: "card-white",
    kpi: "kpi-card",
    flat: "rounded-2xl border border-slate-200 bg-white dark:bg-white/5 dark:border-white/10",
    purple: "rounded-2xl bg-[#4A2E20] text-white",
};
export function Card({ className, interactive, variant = "default", whileHover, whileTap, transition, ...props }) {
    const reducedMotion = useReducedMotion();
    // Warm coffee card lift shadow
    const hoverAnim = reducedMotion
        ? { y: -2 }
        : {
            y: -4,
            scale: 1.015,
            boxShadow: "0 12px 32px rgba(59,35,24,0.10), 0 4px 12px rgba(59,35,24,0.05)",
        };
    const tapAnim = reducedMotion ? { scale: 0.99 } : { scale: 0.97, y: 0 };
    return (<motion.div whileHover={interactive ? (whileHover ?? hoverAnim) : whileHover} whileTap={interactive ? (whileTap ?? tapAnim) : whileTap} transition={transition ?? { type: "spring", stiffness: 420, damping: 26 }} className={cn("will-change-transform", VARIANT_CLASSES[variant], className)} {...props}/>);
}
