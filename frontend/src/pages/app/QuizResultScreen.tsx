import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, History, Timer, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useAppStore } from "@/state/useAppStore";
import { formatSeconds } from "@/features/assessments/utils";
import { cn } from "@/lib/cn";
import { api, type ApiQuizPublic, type ApiQuizResultPublic } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { staggerContainer, staggerItem } from "@/lib/motion";

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type QuizData = {
  id: string;
  title: string;
  questions: QuizQuestion[];
};

function toQuizData(data: ApiQuizPublic): QuizData {
  const questions: QuizQuestion[] = (data.questions ?? []).map((q) => ({
    id: String(q.id),
    text: String(q.question_text ?? ""),
    options: Array.isArray(q.options) ? q.options.map((o) => String(o)) : [],
    answerIndex: Number(q.correct_answer ?? 0),
    explanation: String(q.explanation ?? "Explanation coming soon."),
  }));
  return { id: String(data.id), title: String(data.title ?? "Quiz"), questions };
}

export function QuizResultScreen() {
  const location = useLocation() as any;
  const { quizId = "" } = useParams();

  const localAttempts = useAppStore((s) => s.attemptHistory[quizId] ?? []);
  const clearHistory = useAppStore((s) => s.clearHistory);

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [results, setResults] = useState<ApiQuizResultPublic[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingQuiz(true);
    setQuizError(null);
    setQuiz(null);
    (async () => {
      try {
        if (!quizId) throw new Error("Missing quiz id.");
        const data = await api.quizzes.get(quizId);
        if (cancelled) return;
        setQuiz(toQuizData(data));
      } catch (err: any) {
        if (cancelled) return;
        setQuizError(err?.message ?? "Failed to load quiz.");
      } finally {
        if (!cancelled) setLoadingQuiz(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingResults(true);
    setResultsError(null);
    setResults([]);
    (async () => {
      try {
        if (!quizId) throw new Error("Missing quiz id.");
        const page = await api.quizzes.results(quizId, { limit: 20, offset: 0 });
        if (cancelled) return;
        setResults(page.items ?? []);
      } catch (err: any) {
        if (cancelled) return;
        setResults([]);
        setResultsError(err?.message ?? "Failed to load results.");
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  useEffect(() => {
    setSelectedKey(localAttempts[0]?.attemptId ?? results[0]?.id ?? null);
  }, [quizId, localAttempts, results]);

  const localAttempt = useMemo(() => {
    if (!localAttempts.length) return null;
    if (!selectedKey) return localAttempts[0] ?? null;
    return localAttempts.find((a) => a.attemptId === selectedKey) ?? localAttempts[0] ?? null;
  }, [localAttempts, selectedKey]);

  const dbAttempt = useMemo(() => {
    if (!results.length) return null;
    if (!selectedKey) return results[0] ?? null;
    return results.find((r) => r.id === selectedKey) ?? results[0] ?? null;
  }, [results, selectedKey]);

  const questionById = useMemo(() => {
    return new Map<string, QuizQuestion>(quiz ? quiz.questions.map((q) => [q.id, q]) : []);
  }, [quiz]);

  if (loadingQuiz) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-4 h-4 w-1/2" />
        <Skeleton className="mt-6 h-12 w-full" />
      </Card>
    );
  }

  if (quizError) {
    return (
      <Card className="p-6 border border-red-400/30 bg-red-500/10">
        <div className="text-lg font-extrabold text-red-700 dark:text-red-100">Unable to load result</div>
        <div className="mt-2 text-sm font-semibold text-red-700/80 dark:text-red-100/80">{quizError}</div>
        <div className="mt-4">
          <Link to="/app/quizzes">
            <Button variant="secondary">
              <ChevronLeft className="h-4 w-4" /> Back to quizzes
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Quiz not found</div>
        <div className="mt-4">
          <Link to="/app/quizzes">
            <Button variant="secondary">
              <ChevronLeft className="h-4 w-4" /> Back to quizzes
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const autoSubmitted = Boolean(location?.state?.autoSubmitted);
  const accuracyPct = typeof location?.state?.accuracyPct === "number" ? (location.state.accuracyPct as number) : null;

  const score = localAttempt?.score ?? dbAttempt?.score ?? 0;
  const total = localAttempt?.total ?? dbAttempt?.total_questions ?? quiz.questions.length;
  const answeredCount = localAttempt ? localAttempt.questionOrder.filter((id) => localAttempt.answers[id] != null).length : total;
  const incorrect = Math.max(0, answeredCount - score);
  const unattempted = Math.max(0, total - answeredCount);
  const percent = total ? Math.round((score / total) * 100) : 0;

  if (!localAttempt && !dbAttempt && !loadingResults) {
    return (
      <Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">No attempts yet</div>
        <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
          Start the quiz to see results and explanations.
        </div>
        <div className="mt-4">
          <Link to={`/app/quizzes/${quizId}/attempt`}>
            <Button>Start quiz</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to="/app/quizzes" className="inline-flex items-center gap-1 text-sm font-bold text-byjus-300 hover:underline">
              <ChevronLeft className="h-4 w-4" /> Quizzes
            </Link>
            <div className="mt-2 text-lg font-extrabold text-ink-900 dark:text-ink-50">{quiz.title}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                Score: {score}/{total} (<AnimatedNumber value={percent} suffix="%" />)
              </Badge>
              {accuracyPct != null ? <Badge className="bg-white/10 border-white/10 text-ink-200">Accuracy: {accuracyPct}%</Badge> : null}
              <Badge className="bg-emerald-500/15 border-white/10 text-emerald-100">{score} correct</Badge>
              <Badge className="bg-red-500/15 border-white/10 text-red-100">{incorrect} incorrect</Badge>
              <Badge className="bg-white/10 border-white/10 text-ink-200">{unattempted} skipped</Badge>
              {localAttempt ? (
                <Badge className="bg-white/10 border-white/10 text-ink-200"><Timer className="h-3.5 w-3.5" /> {formatSeconds(localAttempt.timeTakenSeconds)}</Badge>
              ) : (
                <Badge className="bg-white/10 border-white/10 text-ink-200"><Timer className="h-3.5 w-3.5" /> n/a</Badge>
              )}
              {autoSubmitted ? <Badge className="bg-white/10 border-white/10 text-ink-200">Auto-submitted</Badge> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/app/quizzes/${quizId}/attempt`}>
                <Button variant="secondary" className="h-11 rounded-2xl">Retry</Button>
              </Link>
              <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => clearHistory(quizId)} disabled={localAttempts.length === 0} title="Clears device-only review history (DB results remain).">
                Clear local review
              </Button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 22 }}
            className="shrink-0"
          >
            <DonutChart value={percent} label="Quiz accuracy" />
          </motion.div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Badge className="bg-white/10 border-white/10 text-ink-200">
            <History className="h-3.5 w-3.5" /> Attempts (DB): {results.length}
          </Badge>
          {resultsError ? (
            <div className="text-xs font-semibold text-red-700 dark:text-red-100">{resultsError}</div>
          ) : loadingResults ? (
            <div className="text-xs font-semibold text-ink-500 dark:text-ink-300">Loading attempts…</div>
          ) : (
            <div className="text-xs font-semibold text-ink-500 dark:text-ink-300">
              Select an attempt to review.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(localAttempts.length ? localAttempts.slice(0, 6).map((a) => ({ kind: "local" as const, id: a.attemptId, score: a.score, total: a.total })) : []).map((a, i) => {
            const active = a.id === selectedKey;
            const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
            return (
              <button
                key={`local_${a.id}`}
                type="button"
                onClick={() => setSelectedKey(a.id)}
                className={cn(
                  "h-10 rounded-2xl border px-3 text-xs font-extrabold shadow-soft transition focus-ring",
                  active
                    ? "border-byjus-300 bg-byjus-600 text-white"
                    : "border-white/10 bg-white/10 text-ink-200 hover:bg-white/15",
                )}
                title="Local review (this device)"
              >
                Local #{localAttempts.length - i} · {a.score}/{a.total} ({pct}%)
              </button>
            );
          })}

          {results.slice(0, 6).map((r, i) => {
            const active = r.id === selectedKey;
            const pct = r.total_questions ? Math.round((r.score / r.total_questions) * 100) : 0;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedKey(r.id)}
                className={cn(
                  "h-10 rounded-2xl border px-3 text-xs font-extrabold shadow-soft transition focus-ring",
                  active
                    ? "border-byjus-300 bg-byjus-600 text-white"
                    : "border-white/10 bg-white/10 text-ink-200 hover:bg-white/15",
                )}
                title={new Date(r.created_at).toLocaleString()}
              >
                DB #{results.length - i} · {r.score}/{r.total_questions} ({pct}%)
              </button>
            );
          })}
        </div>
      </Card>
      </motion.div>

      {localAttempt ? (
        <motion.div
          className="grid gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {localAttempt.questionOrder.map((questionId, i) => {
            const q = questionById.get(questionId);
            if (!q) return null;

            const chosen = localAttempt.answers[questionId];
            const correct = q.answerIndex;
            const ok = chosen != null && chosen === correct;
            const skipped = chosen == null;
            const marked = Boolean(localAttempt.markedForReview[questionId]);

            const statusBadge = skipped
              ? "bg-white/10 border-white/10 text-ink-200"
              : ok
                ? "bg-emerald-500/15 border-white/10 text-emerald-100"
                : "bg-red-500/15 border-white/10 text-red-100";

            return (
              <motion.div key={questionId} variants={staggerItem}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-ink-500 dark:text-ink-300">Q{i + 1}</div>
                    <div className="mt-1 text-sm font-extrabold text-ink-900 dark:text-ink-50">{q.text}</div>
                    {marked ? (
                      <div className="mt-2">
                        <Badge className="bg-amber-500/15 border-white/10 text-amber-100">Marked for review</Badge>
                      </div>
                    ) : null}
                  </div>
                  <Badge className={statusBadge}>
                    {skipped ? (
                      "Skipped"
                    ) : ok ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" /> Incorrect
                      </>
                    )}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {q.options.map((opt, idx) => {
                    const isChosen = chosen === idx;
                    const isCorrect = correct === idx;
                    const pill = isCorrect
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                      : isChosen
                        ? "border-red-400/40 bg-red-500/10 text-red-100"
                        : "border-white/10 bg-white/[0.03] text-ink-100";
                    return (
                      <div key={`${questionId}_${idx}`} className={cn("rounded-2xl border px-4 py-3 shadow-soft", pill)}>
                        <div className="text-xs font-extrabold">{String.fromCharCode(65 + idx)}</div>
                        <div className="mt-1 text-sm font-semibold">{opt}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                  <div className="text-xs font-extrabold text-ink-200">Explanation</div>
                  <div className="mt-1 text-sm font-semibold text-ink-200">{q.explanation}</div>
                </div>
              </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <Card className="p-6">
          <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Detailed review unavailable</div>
          <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
            Detailed question review is available on this device right after you submit a quiz. Your score history is stored in the database.
          </div>
          <div className="mt-4">
            <Link to={`/app/quizzes/${quizId}/attempt`}>
              <Button className="h-11 rounded-2xl">Attempt again</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

