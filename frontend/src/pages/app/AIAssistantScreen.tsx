import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, Trash2, User, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { GeminiMarkdown } from "@/components/ui/GeminiMarkdown";
import { askNEETAssistant, type GeminiMessage } from "@/lib/gemini";

// ── Inline AI brain animation ───────────────────────────────────────────────
const AI_ANIM = {
  v: "5.7.4", fr: 30, ip: 0, op: 90, w: 200, h: 200,
  nm: "ai", ddd: 0, assets: [],
  layers: [
    // Outer pulsing ring
    { ddd: 0, ind: 1, ty: 4, nm: "ring",
      sr: 1, ks: {
        o: { a: 1, k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0,  s: [30] },
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 45, s: [70] },
          { t: 90, s: [30] }
        ]},
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] }, t: 0,  s: [80, 80, 100] },
          { i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] }, t: 45, s: [120, 120, 100] },
          { t: 90, s: [80, 80, 100] }
        ]}
      },
      ao: 0,
      shapes: [
        { ty: "gr", nm: "ring", it: [
          { ty: "el", d: 1, s: { a: 0, k: [120, 120] }, p: { a: 0, k: [0, 0] }, nm: "el" },
          { ty: "st", c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 3 }, lc: 1, lj: 1, nm: "st" },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
        ]}
      ],
      ip: 0, op: 90, st: 0, bm: 0
    },
    // Core circle
    { ddd: 0, ind: 2, ty: 4, nm: "core",
      sr: 1, ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0,  s: [0] },
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 90, s: [360] }
        ]},
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        { ty: "gr", nm: "core", it: [
          { ty: "el", d: 1, s: { a: 0, k: [70, 70] }, p: { a: 0, k: [0, 0] }, nm: "el" },
          { ty: "fl", c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, o: { a: 0, k: 100 }, r: 1, nm: "fl" },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
        ]},
        // Sparkle dot 1
        { ty: "gr", nm: "dot1", it: [
          { ty: "el", d: 1, s: { a: 0, k: [12, 12] }, p: { a: 0, k: [30, 0] }, nm: "el" },
          { ty: "fl", c: { a: 0, k: [1, 1, 1, 0.9] }, o: { a: 0, k: 100 }, r: 1, nm: "fl" },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
        ]},
        // Sparkle dot 2
        { ty: "gr", nm: "dot2", it: [
          { ty: "el", d: 1, s: { a: 0, k: [8, 8] }, p: { a: 0, k: [-20, 20] }, nm: "el" },
          { ty: "fl", c: { a: 0, k: [1, 1, 1, 0.7] }, o: { a: 0, k: 100 }, r: 1, nm: "fl" },
          { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
        ]},
      ],
      ip: 0, op: 90, st: 0, bm: 0
    }
  ]
};

const SUBJECTS = ["General", "Physics", "Chemistry", "Biology"];

const QUICK_QUESTIONS = [
  "Explain Coulomb's Law",
  "What is photosynthesis?",
  "Mole concept basics",
  "Newton's laws of motion",
  "DNA replication steps",
  "Hybridization in chemistry",
];

type LocalMessage = { id: string; role: "user" | "assistant"; content: string };

// Strip LaTeX delimiters so they render as plain text instead of raw $...$
function cleanLatex(text: string): string {
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => m.trim())   // $$...$$ block
    .replace(/\$([\s\S]+?)\$/g, (_, m) => m.trim())         // $...$ inline
    .replace(/\\rightarrow/g, "→")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2")
    .replace(/\\[a-zA-Z]+/g, "");                            // remaining \commands
}

function MessageBubble({ msg }: { msg: LocalMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div className={`h-7 w-7 shrink-0 rounded-xl grid place-items-center mt-0.5 ${
        isUser ? "byjus-gradient" : "bg-white/10 border border-white/10"
      }`}>
        {isUser
          ? <User className="h-3.5 w-3.5 text-white" />
          : <Bot className="h-3.5 w-3.5 text-byjus-400" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "byjus-gradient text-white rounded-tr-sm font-semibold"
          : "bg-white/8 border border-white/10 rounded-tl-sm"
      }`}
        style={!isUser ? { background: "rgba(255,255,255,0.07)" } : {}}
      >
        {isUser
          ? msg.content
          : <GeminiMarkdown content={cleanLatex(msg.content)} />
        }
      </div>
    </motion.div>
  );
}

export function AIAssistantScreen() {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [geminiHistory, setGeminiHistory] = useState<GeminiMessage[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("General");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setInput("");

    const userMsg: LocalMessage = { id: `u_${Date.now()}`, role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await askNEETAssistant(question, subject);
      setMessages((prev) => [...prev, { id: `a_${Date.now()}`, role: "assistant", content: reply }]);
      setGeminiHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: question }] },
        { role: "model", parts: [{ text: reply }] },
      ]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: `Sorry, I couldn't process that. ${err?.message ?? "Please try again."}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-3" style={{ height: "calc(100svh - 120px)", minHeight: 500 }}>

      {/* ── Header ── */}
      <div
        className="shrink-0 rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-10 w-10 rounded-2xl byjus-gradient grid place-items-center shrink-0"
              animate={{ boxShadow: ["0 0 0px rgba(0,200,83,0)", "0 0 18px rgba(0,200,83,0.55)", "0 0 0px rgba(0,200,83,0)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50 flex items-center gap-2 flex-wrap">
                AI Study Assistant
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <Zap className="h-2.5 w-2.5" /> Gemini
                </span>
              </div>
              <div className="text-xs text-ink-500 dark:text-ink-400">Powered by Google Gemini AI</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setMessages([]); setGeminiHistory([]); }}
            disabled={messages.length === 0}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/10 text-ink-300 hover:text-rose-400 transition focus-ring disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Subject pills */}
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {SUBJECTS.map((s) => (
            <motion.button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition focus-ring ${
                subject === s
                  ? "border-byjus-500/60 bg-byjus-600/25 text-byjus-300"
                  : "border-white/10 bg-white/5 text-ink-400 hover:bg-white/10 hover:text-ink-200"
              }`}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-4"
          >
            {/* Lottie AI Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="relative"
            >
              {/* Glow ring behind animation */}
              <div className="absolute inset-0 rounded-full blur-2xl opacity-30"
                style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)" }} />
              <Lottie
                animationData={AI_ANIM}
                loop
                style={{ width: 200, height: 200 }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-lg font-extrabold text-ink-900 dark:text-white mt-1">
                Ask me anything!
              </div>
              <div className="mt-1 text-xs text-ink-500 dark:text-ink-400 max-w-xs">
                Instant NEET explanations powered by Google Gemini
              </div>
            </motion.div>

            {/* Quick question chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-5 grid grid-cols-2 gap-2 w-full max-w-sm"
            >
              {QUICK_QUESTIONS.map((q, i) => (
                <motion.button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  whileHover={{ scale: 1.03, boxShadow: "0 0 14px rgba(139,92,246,0.25)" }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold transition text-left focus-ring"
                  style={{
                    background: "rgba(139,92,246,0.08)",
                    borderColor: "rgba(139,92,246,0.2)",
                    color: "inherit",
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2.5"
            >
              <div className="h-7 w-7 shrink-0 rounded-xl bg-white/10 border border-white/10 grid place-items-center">
                <Bot className="h-3.5 w-3.5 text-byjus-400" />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-byjus-400"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                  <span className="ml-1 text-xs text-ink-400">Gemini is thinking…</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0">
        <div className="flex gap-2">
          <motion.input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask about ${subject === "General" ? "any NEET topic" : subject}…`}
            whileFocus={{ boxShadow: "0 0 0 2px rgba(0,200,83,0.35)" }}
            className="flex-1 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-ink-100 focus:outline-none placeholder:text-ink-500"
            style={{ background: "rgba(255,255,255,0.07)" }}
          />
          <motion.button
            type="button"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="h-12 w-12 rounded-2xl byjus-gradient grid place-items-center text-white disabled:opacity-40 shrink-0 shadow-btn"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
