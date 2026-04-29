import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image, Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

type Msg = {
  id: string;
  from: "student" | "mentor";
  text: string;
  time: string;
};

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DoubtSolvingScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "m1", from: "mentor", text: "Hi! Ask your doubt - I'll help you step by step.", time: "Now" },
  ]);
  const [text, setText] = useState("");

  const canSend = useMemo(() => text.trim().length > 0, [text]);

  const send = () => {
    if (!canSend) return;
    const t = text.trim();
    setText("");
    setMessages((prev) => [...prev, { id: `m_${Date.now()}`, from: "student", text: t, time: nowLabel() }]);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}_bot`,
          from: "mentor",
          text: "Quick approach: identify concept -> write formula -> check units -> substitute values. Share the exact question for best help.",
          time: nowLabel(),
        },
      ]);
    }, 650);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Reveal>
        <Card className="p-5 flex flex-col min-h-[520px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                <Sparkles className="h-3.5 w-3.5" />
                Doubt Solving
              </Badge>
              <div className="mt-3 text-lg font-extrabold text-ink-900 dark:text-ink-50">Chat with a mentor (UI demo)</div>
              <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
                Ask anything: concepts, numericals, or mistake checks.
              </div>
            </div>
          </div>

          <div className="mt-5 flex-1 space-y-3 overflow-auto pr-1">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn(
                    "max-w-[85%] rounded-3xl border px-4 py-3 shadow-soft",
                    m.from === "student"
                      ? "ml-auto border-byjus-400/30 bg-byjus-600/15 text-byjus-100"
                      : "border-white/10 bg-white/5 text-ink-100",
                  )}
                >
                  <div className="text-sm font-semibold">{m.text}</div>
                  <div className="mt-1 text-[11px] font-bold text-ink-400">{m.time}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 shadow-soft hover:bg-white/15 focus-ring"
              title="Attach image (placeholder)"
            >
              <Image className="h-5 w-5 text-ink-200" />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-ink-100 shadow-soft focus-ring placeholder:text-ink-400"
              placeholder="Type your doubt..."
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <Button className="h-11 rounded-2xl" onClick={send} disabled={!canSend}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="p-5">
          <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">How to ask</div>
          <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
            Share the question and what you tried for better explanations.
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="text-xs font-extrabold text-ink-200">Best format</div>
              <div className="mt-1 text-sm font-semibold text-ink-200">
                "Given..., find.... I tried..., stuck at..."
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="text-xs font-extrabold text-ink-200">Include</div>
              <div className="mt-1 text-sm font-semibold text-ink-200">Units, diagram info, and options if MCQ.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="text-xs font-extrabold text-ink-200">Avoid</div>
              <div className="mt-1 text-sm font-semibold text-ink-200">"Please solve" without details - add context.</div>
            </div>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}

