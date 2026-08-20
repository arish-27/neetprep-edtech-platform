import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
const fillClasses = {
    brand: "bg-brand-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    cyan: "bg-cyan-500",
};
export function ProgressBar({ value, className, variant = "brand", showLabel = false, height = "sm", }) {
    const reducedMotion = useReducedMotion();
    const v = Math.max(0, Math.min(100, value));
    const heightClass = { xs: "h-1.5", sm: "h-2", md: "h-3" }[height];
    return (<div className={cn("space-y-1", className)}>
      {showLabel && (<div className="flex justify-between text-xs font-medium text-slate-500">
          <span>Progress</span>
          <span className="text-slate-700 font-semibold">{v}%</span>
        </div>)}
      <div className={cn("w-full rounded-full overflow-hidden bg-slate-100", heightClass)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className={cn("h-full rounded-full", fillClasses[variant])} initial={false} animate={{ width: `${v}%` }} transition={reducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}/>
      </div>
    </div>);
}
