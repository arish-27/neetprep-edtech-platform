import type React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "fade";

const VARIANTS = {
  up:    { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -16 }, show: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } },
  fade:  { hidden: { opacity: 0 }, show: { opacity: 1 } },
} as const;

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.3,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  duration?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="show"
      variants={VARIANTS[direction]}
      transition={{ duration, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
