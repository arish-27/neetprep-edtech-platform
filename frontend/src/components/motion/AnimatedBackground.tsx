import { useEffect, useRef, memo } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useAppStore } from "@/state/useAppStore";

export type BgTheme = "default" | "biology" | "physics" | "chemistry";

// ── Single floating blob ──────────────────────────────────────────────────────
const Blob = memo(function Blob({
  x, y, size, color, delay, duration,
}: {
  x: string; y: string; size: number;
  color: string; delay: number; duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x, top: y,
        width: size, height: size,
        background: color,
        filter: `blur(${Math.round(size * 0.55)}px)`,
        willChange: "transform",
      }}
      animate={{
        x: [0, 40, -30, 20, 0],
        y: [0, -30, 25, -15, 0],
        scale: [1, 1.12, 0.92, 1.06, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
        repeatType: "loop",
      }}
    />
  );
});

// ── Rising particle ───────────────────────────────────────────────────────────
const Particle = memo(function Particle({
  x, delay, color, size,
}: {
  x: string; delay: number; color: string; size: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        bottom: "-10px",
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 3}px ${color}`,
        willChange: "transform, opacity",
      }}
      animate={{
        y: [0, -(300 + Math.random() * 200)],
        opacity: [0, 0.9, 0.9, 0],
        scale: [0.5, 1, 1, 0.3],
      }}
      transition={{
        duration: 5 + delay * 0.8,
        delay,
        repeat: Infinity,
        ease: "easeOut",
        repeatDelay: delay * 0.5,
      }}
    />
  );
});

// ── DNA node pair ─────────────────────────────────────────────────────────────
const DNAStrand = memo(function DNAStrand({ x, delay }: { x: string; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: "5%", width: 36 }}
      animate={{ y: [0, -15, 0] }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute flex items-center w-full"
          style={{ top: `${i * 11}%` }}
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: i * 0.18 }}
        >
          <div className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: "rgba(139,92,246,0.7)", boxShadow: "0 0 8px rgba(139,92,246,0.9)" }} />
          <div className="flex-1 h-px mx-1" style={{ background: "rgba(139,92,246,0.25)" }} />
          <div className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: "rgba(34,197,94,0.7)", boxShadow: "0 0 8px rgba(34,197,94,0.9)" }} />
        </motion.div>
      ))}
    </motion.div>
  );
});

// ── Wave line (physics) ───────────────────────────────────────────────────────
const WaveLine = memo(function WaveLine({ y, delay, color }: { y: string; delay: number; color: string }) {
  return (
    <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: y, height: 2 }}>
      <motion.div
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, width: "200%", height: "100%" }}
        animate={{ x: ["-50%", "0%"] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: "linear", delay }}
      />
    </div>
  );
});

// ── Bubble (chemistry) ────────────────────────────────────────────────────────
const Bubble = memo(function Bubble({ x, size, delay }: { x: string; size: number; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full"
      style={{
        left: x, bottom: "-5%",
        width: size, height: size,
        border: "1.5px solid rgba(139,92,246,0.5)",
        background: "rgba(139,92,246,0.04)",
      }}
      animate={{ y: [0, -700], opacity: [0, 0.8, 0.8, 0] }}
      transition={{ duration: 9 + delay, delay, repeat: Infinity, ease: "easeIn" }}
    />
  );
});

// ── Mouse parallax ────────────────────────────────────────────────────────────
function useMouseParallax() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 25, damping: 30 });
  const y = useSpring(my, { stiffness: 25, damping: 30 });

  useEffect(() => {
    const h = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth  - 0.5) * 30);
      my.set((e.clientY / window.innerHeight - 0.5) * 30);
    };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, [mx, my]);

  return { x, y };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export const AnimatedBackground = memo(function AnimatedBackground({
  theme = "default",
}: {
  theme?: BgTheme;
}) {
  const { x, y } = useMouseParallax();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>

      {/* Deep dark base */}
      <div className="absolute inset-0" style={{ background: "#0B0F1A" }} />

      {/* Mouse-reactive parallax layer */}
      <motion.div className="absolute inset-0" style={{ x, y }}>

        {/* ── Core blobs (always) ── */}
        <Blob x="-8%"  y="5%"   size={500} color="rgba(139,92,246,0.18)" delay={0}   duration={14} />
        <Blob x="65%"  y="0%"   size={420} color="rgba(59,130,246,0.14)"  delay={2}   duration={17} />
        <Blob x="35%"  y="55%"  size={600} color="rgba(139,92,246,0.10)"  delay={5}   duration={20} />
        <Blob x="75%"  y="65%"  size={350} color="rgba(34,197,94,0.10)"   delay={1}   duration={16} />
        <Blob x="15%"  y="75%"  size={300} color="rgba(236,72,153,0.10)"  delay={3}   duration={18} />

        {/* ── Biology ── */}
        {theme === "biology" && (
          <>
            <Blob x="5%"  y="15%" size={320} color="rgba(34,197,94,0.2)"   delay={0} duration={11} />
            <Blob x="70%" y="35%" size={280} color="rgba(139,92,246,0.16)" delay={2} duration={14} />
            <DNAStrand x="3%"  delay={0} />
            <DNAStrand x="90%" delay={1.5} />
            <DNAStrand x="48%" delay={3} />
          </>
        )}

        {/* ── Physics ── */}
        {theme === "physics" && (
          <>
            <Blob x="25%" y="25%" size={450} color="rgba(59,130,246,0.18)"  delay={0} duration={12} />
            <Blob x="55%" y="55%" size={350} color="rgba(139,92,246,0.14)"  delay={1} duration={15} />
            <WaveLine y="18%" delay={0}   color="rgba(59,130,246,0.5)" />
            <WaveLine y="38%" delay={1}   color="rgba(139,92,246,0.4)" />
            <WaveLine y="58%" delay={2}   color="rgba(59,130,246,0.3)" />
            <WaveLine y="78%" delay={0.5} color="rgba(139,92,246,0.25)" />
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div key={i}
                className="absolute w-px"
                style={{
                  left: `${12 + i * 16}%`,
                  top: `${15 + (i % 3) * 22}%`,
                  height: `${18 + i * 7}px`,
                  background: "linear-gradient(180deg, rgba(59,130,246,0.9), transparent)",
                  boxShadow: "0 0 6px rgba(59,130,246,0.7)",
                }}
                animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0] }}
                transition={{ duration: 0.25, delay: i * 0.45, repeat: Infinity, repeatDelay: 2.5 + i * 0.4 }}
              />
            ))}
          </>
        )}

        {/* ── Chemistry ── */}
        {theme === "chemistry" && (
          <>
            <Blob x="18%" y="28%" size={380} color="rgba(34,197,94,0.15)"  delay={0} duration={13} />
            <Blob x="60%" y="48%" size={300} color="rgba(59,130,246,0.14)" delay={2} duration={16} />
            {Array.from({ length: 9 }, (_, i) => (
              <Bubble key={i} x={`${8 + i * 10}%`} size={16 + i * 9} delay={i * 1.1} />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <motion.div key={i}
                className="absolute rounded-full"
                style={{
                  left: `${18 + i * 16}%`,
                  top: `${25 + (i % 2) * 32}%`,
                  width: 14, height: 14,
                  background: i % 2 === 0 ? "rgba(139,92,246,0.6)" : "rgba(34,197,94,0.6)",
                  boxShadow: `0 0 14px ${i % 2 === 0 ? "rgba(139,92,246,0.7)" : "rgba(34,197,94,0.7)"}`,
                }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.25 }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* ── Rising particles (always) ── */}
      {Array.from({ length: 14 }, (_, i) => (
        <Particle
          key={i}
          x={`${4 + i * 7}%`}
          size={i % 4 === 0 ? 5 : i % 3 === 0 ? 4 : 3}
          color={
            i % 3 === 0 ? "rgba(139,92,246,0.9)" :
            i % 3 === 1 ? "rgba(59,130,246,0.8)" :
                          "rgba(34,197,94,0.7)"
          }
          delay={i * 0.5}
        />
      ))}

      {/* ── Radial vignette ── */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(11,15,26,0.5) 100%)" }}
      />
    </div>
  );
});
