import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Dna, Heart, Plus, Stethoscope } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

// ── Particles ─────────────────────────────────────────────────────────────────
type Particle = { id: number; x: number; y: number; size: number; sx: number; sy: number; op: number };

function useParticles(n: number) {
  const [init] = useState<Particle[]>(() =>
    Array.from({ length: n }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.8,
      sx: (Math.random() - 0.5) * 0.012, sy: (Math.random() - 0.5) * 0.012,
      op: Math.random() * 0.45 + 0.1,
    }))
  );
  const ref = useRef(init.map((p) => ({ ...p })));
  const [, tick] = useState(0);
  useAnimationFrame(() => {
    ref.current = ref.current.map((p) => {
      let x = p.x + p.sx, y = p.y + p.sy;
      if (x < 0 || x > 100) { p.sx *= -1; x = Math.max(0, Math.min(100, x)); }
      if (y < 0 || y > 100) { p.sy *= -1; y = Math.max(0, Math.min(100, y)); }
      return { ...p, x, y };
    });
    tick((t) => t + 1);
  });
  return ref.current;
}

// ── Floating icon ─────────────────────────────────────────────────────────────
function FIcon({ Icon, x, y, delay, size = 28 }: {
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  x: string; y: string; delay: number; size?: number;
}) {
  return (
    <motion.div className="absolute pointer-events-none" style={{ left: x, top: y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.1, 0.07, 0.13, 0.05], y: [0, -16, 5, -10, 0], rotate: [0, 7, -3, 5, 0] }}
      transition={{ duration: 10 + delay * 1.8, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <Icon style={{ width: size, height: size, color: "#FF7A18" }} />
    </motion.div>
  );
}

// ── Scanline ──────────────────────────────────────────────────────────────────
function Scanline() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none"
      style={{ background: "linear-gradient(90deg, transparent, rgba(255,122,24,0.3), transparent)" }}
      initial={{ top: "0%" }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function SplashScreen() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [exiting, setExiting] = useState(false);
  const [ripple, setRipple] = useState(false);
  const particles = useParticles(35);

  const getTarget = useCallback(() => {
    if (token && user?.role === "admin") return "/admin";
    if (token && user?.role === "teacher") return "/teacher";
    if (token) return "/app";
    return "/role";
  }, [token, user?.role]);

  // Only navigate when user clicks "Get Started" — no auto-redirect
  function go() {
    if (exiting) return;
    setRipple(true);
    setExiting(true);
    setTimeout(() => navigate(getTarget(), { replace: true }), 700);
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          className="fixed inset-0 overflow-hidden"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── BG: stethoscope photo ── */}
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1920&q=85')`,
            }}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* ── Gradient overlay — heavy black everywhere for text readability ── */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(100deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.92) 30%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.35) 100%)",
          }} />

          {/* ── Subtle purple tint on left ── */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(135deg, rgba(20,10,40,0.6) 0%, transparent 60%)",
          }} />

          {/* ── Scanline ── */}
          <Scanline />

          {/* ── Shimmer sweep ── */}
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,122,24,0.04) 50%, transparent 65%)" }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
          />

          {/* ── Particles ── */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p) => (
              <div key={p.id} className="absolute rounded-full" style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.size, height: p.size, opacity: p.op,
                background: p.id % 2 === 0 ? "#FF7A18" : "#ffffff",
                boxShadow: `0 0 ${p.size * 3}px ${p.size}px ${p.id % 2 === 0 ? "rgba(255,122,24,0.5)" : "rgba(255,255,255,0.2)"}`,
              }} />
            ))}
          </div>

          {/* ── Floating icons (right side, subtle) ── */}
          <FIcon Icon={Stethoscope} x="72%" y="10%" delay={0}   size={32} />
          <FIcon Icon={Dna}         x="85%" y="55%" delay={1.4} size={26} />
          <FIcon Icon={Plus}        x="65%" y="80%" delay={0.7} size={22} />
          <FIcon Icon={Heart}       x="90%" y="25%" delay={2}   size={24} />

          {/* ── Ambient orange glow (left) ── */}
          <motion.div className="absolute pointer-events-none"
            style={{ width: 500, height: 500, left: "-10%", top: "20%",
              background: "radial-gradient(circle, rgba(255,122,24,0.08) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* ── 5 Floating orbs from uploaded code ── */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 160, height: 160,
                left: `${10 + i * 18}%`,
                top: `${20 + (i % 3) * 25}%`,
                background: i % 2 === 0
                  ? "radial-gradient(circle, rgba(255,122,24,0.18) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
              }}
              animate={{
                x: [0, 200 - i * 40, -(200 - i * 40), 0],
                y: [0, -(200 - i * 30), 200 - i * 30, 0],
              }}
              transition={{
                duration: 10 + i,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* ── LEFT-SIDE CONTENT (matches image layout) ── */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-2xl">

            {/* Orange NEET badge — exact match to image */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative inline-block">
                {/* Glow behind badge */}
                <motion.div className="absolute inset-0 rounded-sm pointer-events-none"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ background: "#FF7A18", filter: "blur(16px)", transform: "scale(1.3)" }}
                />
                <div className="relative px-5 py-2" style={{ background: "#FF7A18" }}>
                  <h1 className="text-5xl md:text-7xl font-black tracking-wider text-white leading-none select-none"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                    NEET
                  </h1>
                </div>
              </div>
            </motion.div>

            {/* Orange underline — matches image */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "left", height: 2, background: "#FF7A18", width: 120, marginTop: 6 }}
            />

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-xl md:text-3xl font-bold leading-snug"
              style={{ color: "#FFFFFF", textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}
            >
              National Eligibility cum<br />Entrance Test
            </motion.p>

            {/* Quote with left border — matches image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex items-start gap-3"
            >
              <div className="w-0.5 self-stretch rounded-full" style={{ background: "#FF7A18", minHeight: 40 }} />
              <p className="text-sm md:text-base italic leading-relaxed"
                style={{ color: "rgba(255,255,255,0.85)", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
                Medicine is a science of uncertainty<br />and an art of probability.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex items-center gap-6"
            >
              {[
                { val: "3", label: "Subjects" },
                { val: "180", label: "Questions" },
                { val: "720", label: "Max Marks" },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + i * 0.1, duration: 0.4 }}
                  className="text-center"
                >
                  <div className="text-2xl font-black" style={{ color: "#FFFFFF", textShadow: "0 0 20px rgba(255,122,24,0.6)" }}>
                    {s.val}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                    style={{ color: "rgba(255,255,255,0.7)" }}>{s.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Get Started button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10"
            >
              <motion.button
                type="button"
                onClick={go}
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,122,24,0.7), 0 0 80px rgba(255,122,24,0.3)" }}
                whileTap={{ scale: 0.96 }}
                className="relative inline-flex items-center gap-3 overflow-hidden rounded-full px-8 py-3.5 text-base font-bold text-white focus:outline-none"
                style={{
                  background: "linear-gradient(135deg, #FF7A18 0%, #FF9A4A 50%, #E86A0A 100%)",
                  boxShadow: "0 0 24px rgba(255,122,24,0.55), 0 0 48px rgba(255,122,24,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                {/* Ripple */}
                <AnimatePresence>
                  {ripple && (
                    <motion.span className="absolute inset-0 rounded-full bg-white/25"
                      initial={{ scale: 0, opacity: 0.7 }}
                      animate={{ scale: 3, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.55 }}
                    />
                  )}
                </AnimatePresence>

                {/* Button shimmer */}
                <motion.span className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)" }}
                  animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                />

                <span className="relative z-10 tracking-wide">Get Started</span>
                <motion.span className="relative z-10 flex items-center"
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </motion.button>
            </motion.div>

            {/* Subjects hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.1, duration: 0.5 }}
              className="mt-5 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Physics · Chemistry · Biology
            </motion.p>
          </div>

          {/* ── Bottom progress bar ── */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5"
            style={{ background: "linear-gradient(90deg, #FF7A18, #FF9A4A, #FF7A18)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.4, duration: 4.6, ease: "linear" }}
          />

          {/* ── Corner accent lines ── */}
          <motion.div className="absolute top-0 left-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}>
            <div style={{ width: 60, height: 2, background: "#FF7A18" }} />
            <div style={{ width: 2, height: 60, background: "#FF7A18" }} />
          </motion.div>
          <motion.div className="absolute bottom-0 right-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.4 }}>
            <div className="flex justify-end" style={{ width: 60, height: 2, background: "#FF7A18" }} />
            <div className="ml-auto" style={{ width: 2, height: 60, background: "#FF7A18" }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
