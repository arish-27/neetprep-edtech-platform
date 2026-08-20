import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
export function DonutChart({ value, label, className, size = 104, strokeWidth = 10, }) {
    const reducedMotion = useReducedMotion();
    const safe = Math.max(0, Math.min(100, value));
    const id = useId().replace(/:/g, "");
    const r = (size - strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - safe / 100);
    return (<div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          <defs>
            <linearGradient id={`g_${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed"/>
              <stop offset="50%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#ec4899"/>
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="rgba(255,255,255,0.10)" strokeWidth={strokeWidth}/>
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke={`url(#g_${id})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={c} initial={reducedMotion ? false : { strokeDashoffset: c }} animate={{ strokeDashoffset: offset }} transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}/>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-xl font-extrabold text-ink-50">{safe}%</div>
            <div className="text-[11px] font-semibold text-ink-300">Accuracy</div>
          </div>
        </div>
      </div>
      {label ? <div className="text-xs font-extrabold text-ink-200">{label}</div> : null}
    </div>);
}
