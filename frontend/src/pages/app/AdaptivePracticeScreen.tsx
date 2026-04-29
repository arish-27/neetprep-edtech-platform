import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Trophy, XCircle, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Reveal } from "@/components/motion/Reveal";
import { apiV2, type PracticeQuestion, type AnswerResponse, type SessionSummary } from "@/lib/apiV2";

const SUBJECTS = ["Physics", "Chemistry", "Biology"];
const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
const DIFFICULTY_COLORS = ["", "text-emerald-400", "text-sky-400", "text-amber-400", "text-orange-400", "text-rose-400"];

type Phase = "setup" | "question" | "feedback" | "summary";

export function AdaptivePracticeScreen() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentQ, setCurrentQ] = useState<PracticeQuestion | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [questionCount, setQuestionCount] = useState(0);

  // The correct index is not sent by the server — we reveal it from feedback
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const q = await apiV2.adaptive.start(subject, topic);
      setCurrentQ(q);
      setChosen(null);
      setFeedback(null);
      setCorrectIndex(null);
      setQuestionCount(1);
      setPhase("question");
    } catch (err: any) {
      setError(err?.message ?? "Failed to start.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(optionIndex: number) {
    if (!currentQ || chosen !== null) return;
    setChosen(optionIndex);
    setLoading(true);

    // We need the correct index — for mock questions we can derive it
    // The server returns is_correct in the feedback
    try {
      const fb = await apiV2.adaptive.answer({
        session_id: currentQ.session_id,
        question_id: currentQ.question_id,
        chosen_index: optionIndex,
        correct_index: optionIndex, // server computes actual correctness
        question_text: currentQ.question_text,
        explanation: "",
        subject,
        topic,
      });
      setFeedback(fb);
      setPhase("feedback");
    } catch (err: any) {
      setError(err?.message ?? "Failed to submit.");
    } finally {
      setLoading(false);
    }
  }

  async function nextQuestion() {
    if (!currentQ) return;
    setLoading(true);
    try {
      const q = await apiV2.adaptive.next(currentQ.session_id);
      setCurrentQ(q);
      setChosen(null);
      setFeedback(null);
      setCorrectIndex(null);
      setQuestionCount((n) => n + 1);
      setPhase("question");
    } catch {
      // No more questions — end session
      await endSession();
    } finally {
      setLoading(false);
    }
  }

  async function endSession() {
    if (!currentQ) return;
    setLoading(true);
    try {
      const s = await apiV2.adaptive.end(currentQ.session_id);
      setSummary(s);
      setPhase("summary");
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Reveal>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 rounded-2xl bg-byjus-600/30 grid place-items-center">
                    <Sparkles className="h-6 w-6 text-byjus-400" />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-ink-900 dark:text-ink-50">Adaptive Practice</div>
                    <div className="text-sm text-ink-500 dark:text-ink-400">Questions adapt to your performance in real-time</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Subject</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SUBJECTS.map((s) => (
                        <button key={s} type="button" onClick={() => setSubject(s)}
                          className={`rounded-2xl border px-4 py-3 text-sm font-extrabold transition focus-ring ${subject === s ? "border-byjus-500/60 bg-byjus-600/20 text-byjus-300 shadow-glow" : "border-white/10 bg-white/5 text-ink-300 hover:bg-white/10"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Topic (optional)</label>
                    <input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Newton's Laws, Photosynthesis..."
                      className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-ink-100 focus-ring placeholder:text-ink-400"
                    />
                  </div>

                  {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}

                  <Button className="w-full h-12 rounded-2xl text-base" onClick={startSession} disabled={loading}>
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Starting...</> : <><Zap className="h-5 w-5" /> Start Practice</>}
                  </Button>
                </div>
              </Card>
            </Reveal>
          </motion.div>
        )}

        {(phase === "question" || phase === "feedback") && currentQ && (
          <motion.div key="question" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/10 border-white/10 text-ink-200">Q{questionCount}</Badge>
                  <span className={`text-xs font-extrabold ${DIFFICULTY_COLORS[currentQ.difficulty]}`}>
                    {DIFFICULTY_LABELS[currentQ.difficulty]}
                  </span>
                </div>
                {feedback && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-amber-400">+{feedback.xp_earned} XP</span>
                  </div>
                )}
                <button type="button" onClick={endSession} className="text-xs text-ink-500 hover:text-ink-300 transition">
                  End session
                </button>
              </div>

              {/* Question */}
              <div className="text-base font-extrabold text-ink-900 dark:text-ink-50 mb-5">
                {currentQ.question_text}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((opt, i) => {
                  let cls = "border-white/10 bg-white/5 text-ink-200 hover:bg-white/10";
                  if (chosen !== null) {
                    if (i === chosen && feedback?.is_correct) cls = "border-emerald-500/50 bg-emerald-500/15 text-emerald-300";
                    else if (i === chosen && !feedback?.is_correct) cls = "border-rose-500/50 bg-rose-500/15 text-rose-300";
                    else cls = "border-white/10 bg-white/5 text-ink-400 opacity-60";
                  }
                  return (
                    <button key={i} type="button" disabled={chosen !== null}
                      onClick={() => submitAnswer(i)}
                      className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition focus-ring ${cls}`}>
                      <span className="h-6 w-6 shrink-0 rounded-lg border border-current/30 grid place-items-center text-xs font-extrabold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {feedback && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-3">
                  <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${feedback.is_correct ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
                    {feedback.is_correct
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      : <XCircle className="h-5 w-5 text-rose-400 shrink-0" />}
                    <div>
                      <div className={`text-sm font-extrabold ${feedback.is_correct ? "text-emerald-300" : "text-rose-300"}`}>
                        {feedback.is_correct ? "Correct!" : "Incorrect"}
                      </div>
                      {feedback.explanation && <div className="text-xs text-ink-400 mt-0.5">{feedback.explanation}</div>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-500">
                    <span>Session: {feedback.session_correct}/{feedback.session_total} correct</span>
                    <span>Next difficulty: {DIFFICULTY_LABELS[feedback.next_difficulty]}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button className="h-11 rounded-2xl" onClick={nextQuestion} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next Question →"}
                    </Button>
                    <Button variant="secondary" className="h-11 rounded-2xl" onClick={endSession}>
                      End Session
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {phase === "summary" && summary && (
          <motion.div key="summary" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-8 text-center">
              <Trophy className="mx-auto h-14 w-14 text-amber-400 mb-4" />
              <div className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">Session Complete!</div>
              <div className="mt-2 text-sm text-ink-500 dark:text-ink-400">{summary.subject} · {summary.topic || "General"}</div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: "Questions", value: summary.total },
                  { label: "Correct", value: summary.correct },
                  { label: "Accuracy", value: `${summary.accuracy_pct}%` },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">{s.value}</div>
                    <div className="text-xs text-ink-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="text-base font-extrabold text-amber-400">+{summary.xp_earned} XP earned</span>
              </div>

              <ProgressBar value={summary.accuracy_pct} className="mt-4" />

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button className="h-11 rounded-2xl" onClick={() => { setPhase("setup"); setSummary(null); }}>
                  Practice Again
                </Button>
                <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => window.history.back()}>
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
