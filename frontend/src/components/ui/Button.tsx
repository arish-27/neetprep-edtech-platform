import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "orange" | "outline" | "neon";
type Size = "sm" | "md" | "lg" | "xl";

const variantClasses: Record<Variant, string> = {
  primary:   "btn-purple text-white",
  secondary: "btn-secondary",
  ghost:     "btn-ghost",
  danger:    "bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 shadow-sm transition",
  orange:    "btn-orange text-white",
  outline:   "border-2 border-brand-500 text-brand-500 bg-transparent font-semibold rounded-xl hover:bg-brand-50 transition",
  // kept for backward compat
  neon:      "btn-purple text-white",
};

const sizeClasses: Record<Size, string> = {
  sm:  "h-8  px-3   text-xs  rounded-lg  gap-1.5",
  md:  "h-10 px-4   text-sm  rounded-xl  gap-2",
  lg:  "h-11 px-5   text-sm  rounded-xl  gap-2",
  xl:  "h-12 px-6   text-base rounded-xl gap-2.5",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  whileHover,
  whileTap,
  transition,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.button> & {
  variant?: Variant;
  size?: Size;
}) {
  const reducedMotion = useReducedMotion();
  const disabled = Boolean(props.disabled);

  const hoverAnim = reducedMotion ? undefined : { scale: 1.04, y: -2 };
  const tapAnim   = reducedMotion ? undefined : { scale: 0.96, y: 0 };

  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : (whileHover ?? hoverAnim)}
      whileTap={disabled ? undefined : (whileTap ?? tapAnim)}
      transition={transition ?? { type: "spring", stiffness: 500, damping: 22 }}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200",
        "focus-ring disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
