import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, History, Timer, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { getMockTest } from "@/data/mockData";
import { useAppStore } from "@/state/useAppStore";
import { formatSeconds } from "@/features/assessments/utils";
import { cn } from "@/lib/cn";
export function TestResultScreen() {
    const location = useLocation();
    const { testId = "" } = useParams();
    const test = getMockTest(testId);
    const attempts = useAppStore((s) => s.attemptHistory[testId] ?? []);
    const clearHistory = useAppStore((s) => s.clearHistory);
    const [selectedAttemptId, setSelectedAttemptId] = useState(null);
    useEffect(() => {
        setSelectedAttemptId(attempts[0]?.attemptId ?? null);
    }, [testId, attempts]);
    const attempt = useMemo(() => {
        if (!attempts.length)
            return null;
        if (!selectedAttemptId)
            return attempts[0] ?? null;
        return attempts.find((a) => a.attemptId === selectedAttemptId) ?? attempts[0] ?? null;
    }, [attempts, selectedAttemptId]);
    const questionById = useMemo(() => {
        return new Map(test ? test.questions.map((q) => [q.id, q]) : []);
    }, [test]);
    if (!test) {
        return (<Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Test not found</div>
        <div className="mt-4">
          <Link to="/app/mock-tests">
            <Button variant="secondary">
              <ChevronLeft className="h-4 w-4"/> Back to mock tests
            </Button>
          </Link>
        </div>
      </Card>);
    }
    if (!attempt) {
        return (<Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">No attempt found</div>
        <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
          Start the test to see results and explanations.
        </div>
        <div className="mt-4">
          <Link to={`/app/mock-tests/${testId}/attempt`}>
            <Button>Start test</Button>
          </Link>
        </div>
      </Card>);
    }
    const total = attempt.total ?? attempt.questionOrder.length;
    const answeredCount = attempt.questionOrder.filter((id) => attempt.answers[id] != null).length;
    const incorrect = Math.max(0, answeredCount - attempt.score);
    const unattempted = Math.max(0, total - answeredCount);
    const percent = total ? Math.round((attempt.score / total) * 100) : 0;
    const autoSubmitted = Boolean(location?.state?.autoSubmitted);
    return (<div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to="/app/mock-tests" className="inline-flex items-center gap-1 text-sm font-bold text-byjus-300 hover:underline">
              <ChevronLeft className="h-4 w-4"/> Mock Tests
            </Link>
            <div className="mt-2 text-lg font-extrabold text-ink-900 dark:text-ink-50">{test.title}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                Score: {attempt.score}/{total} ({percent}%)
              </Badge>
              <Badge className="bg-emerald-500/15 border-white/10 text-emerald-100">{attempt.score} correct</Badge>
              <Badge className="bg-red-500/15 border-white/10 text-red-100">{incorrect} incorrect</Badge>
              <Badge className="bg-white/10 border-white/10 text-ink-200">{unattempted} skipped</Badge>
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                <Timer className="h-3.5 w-3.5"/> {formatSeconds(attempt.timeTakenSeconds)}
              </Badge>
              {autoSubmitted ? <Badge className="bg-white/10 border-white/10 text-ink-200">Auto-submitted</Badge> : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/app/mock-tests/${testId}/attempt`}>
                <Button variant="secondary" className="h-11 rounded-2xl">
                  Retry
                </Button>
              </Link>
              <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => clearHistory(testId)} disabled={attempts.length === 0}>
                Clear history
              </Button>
            </div>
          </div>

          <div className="shrink-0">
            <DonutChart value={percent} label="Test accuracy"/>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Badge className="bg-white/10 border-white/10 text-ink-200">
            <History className="h-3.5 w-3.5"/> Attempts: {attempts.length}
          </Badge>
          <div className="text-xs font-semibold text-ink-500 dark:text-ink-300">
            Select an attempt to review explanations.
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {attempts.slice(0, 8).map((a, i) => {
            const active = a.attemptId === attempt.attemptId;
            const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
            return (<button key={a.attemptId} type="button" onClick={() => setSelectedAttemptId(a.attemptId)} className={cn("h-10 rounded-2xl border px-3 text-xs font-extrabold shadow-soft transition focus-ring", active
                    ? "border-byjus-300 bg-byjus-600 text-white"
                    : "border-white/10 bg-white/10 text-ink-200 hover:bg-white/15")} title={new Date(a.finishedAt).toLocaleString()}>
                #{attempts.length - i} · {a.score}/{a.total} ({pct}%)
              </button>);
        })}
        </div>
      </Card>

      <div className="grid gap-4">
        {attempt.questionOrder.map((questionId, i) => {
            const q = questionById.get(questionId);
            if (!q)
                return null;
            const chosen = attempt.answers[questionId];
            const correct = q.answerIndex;
            const ok = chosen != null && chosen === correct;
            const skipped = chosen == null;
            const marked = Boolean(attempt.markedForReview[questionId]);
            const statusBadge = skipped
                ? "bg-white/10 border-white/10 text-ink-200"
                : ok
                    ? "bg-emerald-500/15 border-white/10 text-emerald-100"
                    : "bg-red-500/15 border-white/10 text-red-100";
            return (<Card key={questionId} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-ink-500 dark:text-ink-300">Q{i + 1}</div>
                  <div className="mt-1 text-sm font-extrabold text-ink-900 dark:text-ink-50">{q.text}</div>
                  {marked ? (<div className="mt-2">
                      <Badge className="bg-amber-500/15 border-white/10 text-amber-100">Marked for review</Badge>
                    </div>) : null}
                </div>
                <Badge className={statusBadge}>
                  {skipped ? ("Skipped") : ok ? (<>
                      <CheckCircle2 className="h-3.5 w-3.5"/> Correct
                    </>) : (<>
                      <XCircle className="h-3.5 w-3.5"/> Incorrect
                    </>)}
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
                    return (<div key={opt} className={cn("rounded-2xl border px-4 py-3 shadow-soft", pill)}>
                      <div className="text-xs font-extrabold">{String.fromCharCode(65 + idx)}</div>
                      <div className="mt-1 text-sm font-semibold">{opt}</div>
                    </div>);
                })}
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                <div className="text-xs font-extrabold text-ink-200">Explanation</div>
                <div className="mt-1 text-sm font-semibold text-ink-200">{q.explanation}</div>
              </div>
            </Card>);
        })}
      </div>
    </div>);
}
