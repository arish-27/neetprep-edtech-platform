import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "white" | "kpi" | "flat" | "purple";

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "card-white",
  white:   "card-white",
  kpi:     "kpi-card",
  flat:    "rounded-2xl border border-slate-200 bg-white dark:bg-white/5 dark:border-white/10",
  purple:  "rounded-2xl bg-brand-500 text-white",
};

export function Card({
  className,
  interactive,
  variant = "default",
  whileHover,
  whileTap,
  transition,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div> & {
  interactive?: boolean;
  variant?: CardVariant;
}) {
  const reducedMotion = useReducedMotion();

  // Dark mode: glass glow hover; Light mode: lift shadow
  const hoverAnim = reducedMotion
    ? { y: -2 }
    : {
        y: -5,
        scale: 1.02,
        boxShadow: "0 12px 40px rgba(139,92,246,0.25), 0 0 60px rgba(139,92,246,0.1), 0 4px 12px rgba(0,0,0,0.2)",
      };

  const tapAnim = reducedMotion ? { scale: 0.99 } : { scale: 0.97, y: 0 };

  return (
    <motion.div
      whileHover={interactive ? (whileHover ?? hoverAnim) : whileHover}
      whileTap={interactive ? (whileTap ?? tapAnim) : whileTap}
      transition={transition ?? { type: "spring", stiffness: 420, damping: 26 }}
      className={cn("will-change-transform", VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}
