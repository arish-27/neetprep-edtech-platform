import { useEffect, useState } from "react";
import { Bot, CheckCircle2, HelpCircle, Loader2, MessageSquare, Plus, Sparkles, ThumbsUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { GeminiMarkdown } from "@/components/ui/GeminiMarkdown";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type Doubt } from "@/lib/apiV2";
import { answerDoubt } from "@/lib/gemini";

const SUBJECTS = ["All", "Physics", "Chemistry", "Biology"];

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; }
}

export function AskDoubtScreen() {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("");
  const [askSubject, setAskSubject] = useState("Physics");
  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState<string | null>(null);
  const [geminiAnswers, setGeminiAnswers] = useState<Record<string, string>>({});
  const [geminiLoading, setGeminiLoading] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiV2.doubts.list({ subject: subject === "All" ? undefined : subject })
      .then(setDoubts)
      .catch(() => setDoubts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [subject]);

  async function submitDoubt() {
    if (!question.trim()) return;
    setSubmitting(true);
    try {
      const d = await apiV2.doubts.create({ subject: askSubject, topic, question: question.trim() });
      setDoubts((prev) => [d, ...prev]);
      setQuestion(""); setTopic(""); setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  async function upvote(id: string) {
    setUpvoting(id);
    try {
      const updated = await apiV2.doubts.upvote(id);
      setDoubts((prev) => prev.map((d) => d.id === id ? updated : d));
    } catch { /* ignore */ }
    finally { setUpvoting(null); }
  }

  async function getGeminiAnswer(d: Doubt) {
    if (geminiAnswers[d.id] || geminiLoading === d.id) return;
    setGeminiLoading(d.id);
    try {
      const answer = await answerDoubt(d.question, d.subject, d.topic || "General");
      setGeminiAnswers((prev) => ({ ...prev, [d.id]: answer }));
    } catch {
      setGeminiAnswers((prev) => ({ ...prev, [d.id]: "Unable to get AI answer. Please try again." }));
    } finally {
      setGeminiLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-byjus-600/30 grid place-items-center">
                <HelpCircle className="h-5 w-5 text-byjus-400" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Ask a Doubt</div>
                <div className="text-sm text-ink-500 dark:text-ink-400">Get answers from your teachers</div>
              </div>
            </div>
            <Button className="h-10 rounded-2xl" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : <><Plus className="h-4 w-4" /> Ask Doubt</>}
            </Button>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {SUBJECTS.map((s) => (
              <button key={s} type="button" onClick={() => setSubject(s)}
                className={`rounded-2xl border px-3 py-1.5 text-xs font-extrabold transition focus-ring ${subject === s ? "border-byjus-500/60 bg-byjus-600/20 text-byjus-300" : "border-white/10 bg-white/5 text-ink-300 hover:bg-white/10"}`}>
                {s}
              </button>
            ))}
          </div>
        </Card>
      </Reveal>

      {showForm && (
        <Reveal delay={0.05}>
          <Card className="p-5 space-y-4">
            <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">New Doubt</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Physics", "Chemistry", "Biology"].map((s) => (
                    <button key={s} type="button" onClick={() => setAskSubject(s)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${askSubject === s ? "border-byjus-500/60 bg-byjus-600/20 text-byjus-300" : "border-white/10 bg-white/5 text-ink-300 hover:bg-white/10"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Topic (optional)</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Electrostatics" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Your Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Describe your doubt clearly..."
                className="w-full min-h-[100px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-ink-100 focus-ring placeholder:text-ink-400"
              />
            </div>
            <Button className="w-full h-11 rounded-2xl" onClick={submitDoubt} disabled={submitting || !question.trim()}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><MessageSquare className="h-4 w-4" /> Submit Doubt</>}
            </Button>
          </Card>
        </Reveal>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-byjus-400" /></div>
      ) : doubts.length === 0 ? (
        <Card className="p-8 text-center">
          <HelpCircle className="mx-auto h-10 w-10 text-ink-400 mb-3" />
          <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">No doubts yet</div>
          <div className="mt-2 text-sm text-ink-500 dark:text-ink-400">Be the first to ask a question!</div>
        </Card>
      ) : (
        <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
          {doubts.map((d) => (
            <motion.div key={d.id} variants={staggerItem}>
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={`text-[10px] ${d.status === "open" ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"}`}>
                        {d.status === "answered" ? <><CheckCircle2 className="inline h-3 w-3 mr-0.5" />Answered</> : "Open"}
                      </Badge>
                      <Badge className="bg-byjus-600/20 border-byjus-500/30 text-byjus-300 text-[10px]">{d.subject}</Badge>
                      {d.topic && <span className="text-[10px] text-ink-500">{d.topic}</span>}
                      <span className="text-[10px] text-ink-500">{formatDate(d.created_at)}</span>
                    </div>
                    <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">{d.question}</div>
                    <div className="mt-0.5 text-xs text-ink-500">by {d.student_name}</div>

                    {d.answer && (
                      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <div className="text-[10px] font-extrabold text-emerald-400 mb-1">
                          Answer by {d.answered_by_name ?? "Teacher"}
                        </div>
                        <div className="text-xs text-emerald-300">{d.answer}</div>
                      </div>
                    )}

                    {/* Gemini AI Answer */}
                    <div className="mt-3">
                      {geminiAnswers[d.id] ? (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border p-3"
                            style={{ borderColor: "rgba(0,200,83,0.25)", background: "rgba(0,200,83,0.06)" }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Bot className="h-3 w-3 text-byjus-400" />
                              <span className="text-[10px] font-extrabold text-byjus-400">Gemini AI Answer</span>
                            </div>
                            <GeminiMarkdown content={geminiAnswers[d.id]} />
                          </motion.div>
                        </AnimatePresence>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={() => getGeminiAnswer(d)}
                          disabled={geminiLoading === d.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition focus-ring disabled:opacity-50"
                          style={{ borderColor: "rgba(0,200,83,0.3)", background: "rgba(0,200,83,0.08)", color: "#00C853" }}
                        >
                          {geminiLoading === d.id
                            ? <><Loader2 className="h-3 w-3 animate-spin" /> Getting AI answer…</>
                            : <><Sparkles className="h-3 w-3" /> Ask Gemini AI</>}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  <button type="button" onClick={() => upvote(d.id)} disabled={upvoting === d.id}
                    className="flex flex-col items-center gap-0.5 shrink-0 rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-ink-300 hover:text-byjus-400 transition focus-ring">
                    {upvoting === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    <span className="text-[10px] font-extrabold">{d.upvotes}</span>
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
