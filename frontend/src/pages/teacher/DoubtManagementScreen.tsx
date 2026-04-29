import { useEffect, useState } from "react";
import { CheckCircle2, HelpCircle, Loader2, MessageSquare, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type Doubt } from "@/lib/apiV2";

const SUBJECTS = ["All", "Physics", "Chemistry", "Biology"];

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; }
}

export function DoubtManagementScreen() {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "answered">("open");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    apiV2.doubts.list({
      subject: subject === "All" ? undefined : subject,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
      .then(setDoubts)
      .catch(() => setDoubts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [subject, statusFilter]);

  async function submitAnswer(id: string) {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await apiV2.doubts.answer(id, answerText.trim());
      setDoubts((prev) => prev.map((d) => d.id === id ? updated : d));
      setAnsweringId(null);
      setAnswerText("");
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  }

  const openCount = doubts.filter((d) => d.status === "open").length;

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
                <HelpCircle className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-800">Doubt Management</div>
                <div className="text-sm text-slate-500 ">
                  {openCount} open doubt{openCount !== 1 ? "s" : ""} waiting for your reply
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["open", "answered", "all"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)}
                  className={`rounded-2xl border px-3 py-1.5 text-xs font-extrabold transition focus-ring capitalize ${statusFilter === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {SUBJECTS.map((s) => (
              <button key={s} type="button" onClick={() => setSubject(s)}
                className={`rounded-2xl border px-3 py-1.5 text-xs font-extrabold transition focus-ring ${subject === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                {s}
              </button>
            ))}
          </div>
        </Card>
      </Reveal>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
      ) : doubts.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-3" />
          <div className="text-base font-extrabold text-slate-800">All caught up!</div>
          <div className="mt-2 text-sm text-slate-500 ">No doubts in this category.</div>
        </Card>
      ) : (
        <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
          {doubts.map((d) => (
            <motion.div key={d.id} variants={staggerItem}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={`text-[10px] ${d.status === "open" ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"}`}>
                        {d.status}
                      </Badge>
                      <Badge className="bg-brand-50 border-brand-200 text-brand-400 text-[10px]">{d.subject}</Badge>
                      {d.topic && <span className="text-[10px] text-slate-500">{d.topic}</span>}
                      <span className="text-[10px] text-slate-500">{formatDate(d.created_at)}</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-800">{d.question}</div>
                    <div className="mt-1 text-xs text-slate-500">by {d.student_name}</div>

                    {d.answer && (
                      <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <div className="text-[10px] font-extrabold text-emerald-400 mb-1">Your Answer</div>
                        <div className="text-xs text-emerald-300">{d.answer}</div>
                      </div>
                    )}

                    {answeringId === d.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Type your answer..."
                          className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-ink-100 focus-ring placeholder:text-slate-400"
                        />
                        <div className="flex gap-2">
                          <Button className="h-9 rounded-2xl flex-1" onClick={() => submitAnswer(d.id)} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Answer"}
                          </Button>
                          <Button variant="secondary" className="h-9 rounded-2xl" onClick={() => { setAnsweringId(null); setAnswerText(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <ThumbsUp className="h-3.5 w-3.5" /> {d.upvotes}
                    </div>
                    {d.status === "open" && answeringId !== d.id && (
                      <Button variant="secondary" className="h-8 rounded-xl text-xs" onClick={() => { setAnsweringId(d.id); setAnswerText(""); }}>
                        <MessageSquare className="h-3.5 w-3.5" /> Reply
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
