import type React from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "danger" | "info" | "outline" | "orange";

const variantClasses: Record<BadgeVariant, string> = {
  default: "badge-gray",
  brand:   "badge-purple",
  success: "badge-green",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger:  "bg-red-50 text-red-600 border border-red-200",
  info:    "badge-blue",
  outline: "bg-transparent border border-slate-300 text-slate-600",
  orange:  "badge-orange",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
