import { motion } from "framer-motion";
import type React from "react";

// From uploaded code: scale 0.98 + y:50 enter, scale 0.95 + y:-50 exit
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -50 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
