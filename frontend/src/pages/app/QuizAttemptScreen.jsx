import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, Check, ChevronLeft, Flag, RotateCcw, Timer, X, } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/state/useAppStore";
import { formatSeconds, shuffleArray } from "@/features/assessments/utils";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
const questionVariants = {
    enter: (dir) => ({
        opacity: 0,
        x: dir >= 0 ? 26 : -26,
    }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({
        opacity: 0,
        x: dir >= 0 ? -22 : 22,
    }),
};
function toQuizData(data) {
    const questions = (data.questions ?? []).map((q) => ({
        id: String(q.id),
        text: String(q.question_text ?? ""),
        options: Array.isArray(q.options) ? q.options.map((o) => String(o)) : [],
        answerIndex: Number(q.correct_answer ?? 0),
        explanation: String(q.explanation ?? "Explanation coming soon."),
    }));
    const durationSeconds = Math.max(5 * 60, questions.length * 60);
    return {
        id: String(data.id),
        title: String(data.title ?? "Quiz"),
        durationSeconds,
        questions,
    };
}
export function QuizAttemptScreen() {
    const navigate = useNavigate();
    const { quizId = "" } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [dir, setDir] = useState(1);
    const submittedRef = useRef(false);
    const active = useAppStore((s) => s.activeAttempts[quizId]);
    const questionBookmarks = useAppStore((s) => s.questionBookmarks);
    const startAttempt = useAppStore((s) => s.startAttempt);
    const clearAttempt = useAppStore((s) => s.clearAttempt);
    const answer = useAppStore((s) => s.answer);
    const toggleMarkForReview = useAppStore((s) => s.toggleMarkForReview);
    const setCurrentIndex = useAppStore((s) => s.setCurrentIndex);
    const decrementSecond = useAppStore((s) => s.decrementSecond);
    const submitAttempt = useAppStore((s) => s.submitAttempt);
    const toggleQuestionBookmark = useAppStore((s) => s.toggleQuestionBookmark);
    const questionById = useMemo(() => {
        return new Map(quiz ? quiz.questions.map((q) => [q.id, q]) : []);
    }, [quiz]);
    useEffect(() => {
        submittedRef.current = false;
        setDir(1);
        setSubmitError(null);
    }, [quizId]);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        setQuiz(null);
        (async () => {
            try {
                if (!quizId)
                    throw new Error("Missing quiz id.");
                const data = await api.quizzes.get(quizId);
                if (cancelled)
                    return;
                setQuiz(toQuizData(data));
            }
            catch (err) {
                if (cancelled)
                    return;
                setLoadError(err?.message ?? "Failed to load quiz.");
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [quizId]);
    useEffect(() => {
        if (!quiz)
            return;
        const current = useAppStore.getState().activeAttempts[quizId];
        if (current?.type === "quiz" && current.questionOrder.length > 0)
            return;
        const order = shuffleArray(quiz.questions.map((q) => q.id));
        startAttempt({
            assessmentId: quizId,
            type: "quiz",
            durationSeconds: quiz.durationSeconds,
            questionOrder: order,
        });
    }, [quiz, quizId, startAttempt]);
    useEffect(() => {
        if (!quiz || !active)
            return;
        if (active.secondsLeft <= 0)
            return;
        const t = window.setTimeout(() => decrementSecond(quizId), 1000);
        return () => window.clearTimeout(t);
    }, [active?.secondsLeft, decrementSecond, quiz, quizId]);
    const order = active?.questionOrder ?? [];
    const total = order.length;
    const idx = Math.min(active?.currentIndex ?? 0, Math.max(0, total - 1));
    const qid = order[idx];
    const q = qid ? questionById.get(qid) : null;
    const selected = qid ? (active?.answers[qid] ?? null) : null;
    const marked = qid ? Boolean(active?.markedForReview[qid]) : false;
    const isBookmarked = qid ? Boolean(questionBookmarks[qid]) : false;
    const answeredCount = useMemo(() => {
        if (!active)
            return 0;
        return order.filter((id) => active.answers[id] != null).length;
    }, [active, order]);
    const markedCount = useMemo(() => {
        if (!active)
            return 0;
        return order.filter((id) => Boolean(active.markedForReview[id])).length;
    }, [active, order]);
    const progressPct = total ? Math.round(((idx + 1) / total) * 100) : 0;
    const attemptedPct = total ? Math.round((answeredCount / total) * 100) : 0;
    const goTo = (nextIndex) => {
        if (!active)
            return;
        const clamped = Math.max(0, Math.min(total - 1, nextIndex));
        setDir(clamped >= idx ? 1 : -1);
        setCurrentIndex(quizId, clamped);
    };
    const submit = async (autoSubmitted) => {
        if (!quiz || !active)
            return;
        if (submittedRef.current)
            return;
        submittedRef.current = true;
        setSubmitError(null);
        const answers = Object.fromEntries(order.map((id) => [id, active.answers[id] ?? null]));
        const markedForReview = Object.fromEntries(order.map((id) => [id, Boolean(active.markedForReview[id])]));
        const submitAnswers = {};
        for (const id of order) {
            const picked = active.answers[id];
            if (typeof picked === "number")
                submitAnswers[id] = picked;
        }
        try {
            const server = await api.quizzes.submit(quizId, submitAnswers);
            const score = server.result.score;
            const totalQuestions = server.result.total_questions;
            const finishedAt = Date.now();
            submitAttempt(quizId, {
                assessmentId: quizId,
                type: "quiz",
                startedAt: active.startedAt,
                finishedAt,
                durationSeconds: active.durationSeconds,
                timeTakenSeconds: Math.max(0, active.durationSeconds - active.secondsLeft),
                questionOrder: order,
                answers,
                markedForReview,
                score,
                total: totalQuestions || order.length,
            });
            navigate(`/app/quizzes/${quizId}/result`, {
                replace: true,
                state: { autoSubmitted, accuracyPct: server.accuracy_pct },
            });
        }
        catch (err) {
            submittedRef.current = false;
            setSubmitError(err?.message ?? "Failed to submit quiz. Please try again.");
        }
    };
    useEffect(() => {
        if (!quiz || !active)
            return;
        if (active.secondsLeft > 0)
            return;
        void submit(true);
    }, [active?.secondsLeft, quiz]);
    if (loading) {
        return (<Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Preparing quiz…</div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-2/3"/>
          <Skeleton className="h-4 w-1/2"/>
          <Skeleton className="h-10 w-full"/>
        </div>
      </Card>);
    }
    if (loadError) {
        return (<Card className="p-6 border border-red-400/30 bg-red-500/10">
        <div className="text-lg font-extrabold text-red-700 dark:text-red-100">Unable to load quiz</div>
        <div className="mt-2 text-sm font-semibold text-red-700/80 dark:text-red-100/80">{loadError}</div>
        <div className="mt-4">
          <Link to="/app/quizzes">
            <Button variant="secondary">
              <ChevronLeft className="h-4 w-4"/> Back to quizzes
            </Button>
          </Link>
        </div>
      </Card>);
    }
    if (!quiz) {
        return (<Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Quiz not found</div>
        <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">Please go back and choose a quiz.</div>
        <div className="mt-4">
          <Link to="/app/quizzes">
            <Button variant="secondary">
              <ChevronLeft className="h-4 w-4"/> Back to quizzes
            </Button>
          </Link>
        </div>
      </Card>);
    }
    if (!active || !q) {
        return (<Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Preparing quiz...</div>
        <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
          Loading questions and starting your timer.
        </div>
      </Card>);
    }
    const showFeedback = selected != null;
    const isCorrect = selected != null && selected === q.answerIndex;
    return (<div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to="/app/quizzes" className="inline-flex items-center gap-1 text-sm font-bold text-byjus-300 hover:underline">
              <ChevronLeft className="h-4 w-4"/> Quizzes
            </Link>
            <div className="mt-2 truncate text-lg font-extrabold text-ink-900 dark:text-ink-50">{quiz.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                <Timer className="h-3.5 w-3.5"/> {formatSeconds(active.secondsLeft)}
              </Badge>
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                Q {idx + 1}/{total}
              </Badge>
              <Badge className="bg-white/10 border-white/10 text-ink-200">{answeredCount} answered</Badge>
              <Badge className="bg-white/10 border-white/10 text-ink-200">{markedCount} marked</Badge>
              <AnimatePresence>
                {showFeedback ? (<motion.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <Badge className={cn("border-white/10", isCorrect
                ? "bg-emerald-500/15 text-emerald-100"
                : "bg-red-500/15 text-red-100")}>
                      {isCorrect ? <Check className="h-3.5 w-3.5"/> : <X className="h-3.5 w-3.5"/>}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </motion.span>) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="h-10 rounded-2xl" onClick={() => {
            clearAttempt(quizId);
            const fresh = shuffleArray(quiz.questions.map((x) => x.id));
            startAttempt({
                assessmentId: quizId,
                type: "quiz",
                durationSeconds: quiz.durationSeconds,
                questionOrder: fresh,
            });
            setDir(1);
            setCurrentIndex(quizId, 0);
        }}>
              <RotateCcw className="h-4 w-4"/>
              Restart
            </Button>
            <Button variant={marked ? "secondary" : "ghost"} className="h-10 rounded-2xl" onClick={() => toggleMarkForReview(quizId, q.id)}>
              <Flag className="h-4 w-4"/>
              {marked ? "Marked" : "Mark"}
            </Button>
            <Button variant={isBookmarked ? "secondary" : "primary"} className="h-10 rounded-2xl" onClick={() => toggleQuestionBookmark(q.id, q.text.slice(0, 56) + (q.text.length > 56 ? "..." : ""))}>
              {isBookmarked ? <BookmarkCheck className="h-4 w-4"/> : <Bookmark className="h-4 w-4"/>}
              {isBookmarked ? "Saved" : "Save"}
            </Button>
          </div>
        </div>

        {submitError ? (<div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
            {submitError}
          </div>) : null}

        <div className="mt-4 grid gap-2">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-ink-500 dark:text-ink-300">
              <span>Progress</span>
              <span>{progressPct}%</span>
            </div>
            <ProgressBar value={progressPct} className="mt-2"/>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-ink-500 dark:text-ink-300">
              <span>Attempted</span>
              <span>{attemptedPct}%</span>
            </div>
            <ProgressBar value={attemptedPct} className="mt-2"/>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={q.id} className="mt-5" variants={questionVariants} initial="enter" animate="center" exit="exit" custom={dir} transition={{ duration: 0.22, ease: "easeOut" }}>
            <div className="text-xs font-extrabold text-ink-500 dark:text-ink-300">Question</div>
            <div className="mt-2 text-sm font-extrabold text-ink-900 dark:text-ink-50">{q.text}</div>

            <div className="mt-4 grid gap-2">
              {q.options.map((opt, i) => {
            const chosen = selected === i;
            const correct = q.answerIndex === i;
            const showCorrect = showFeedback && correct;
            const showWrong = showFeedback && chosen && !correct;
            const cls = showCorrect
                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                : showWrong
                    ? "border-red-400/50 bg-red-500/10 text-red-100"
                    : chosen
                        ? "border-byjus-400/40 bg-white/10 text-ink-100"
                        : "border-white/10 bg-white/[0.03] text-ink-100 hover:bg-white/[0.06]";
            return (<motion.button key={`${q.id}_${i}`} type="button" onClick={() => answer(quizId, q.id, i)} className={cn("w-full text-left rounded-2xl border px-4 py-3 shadow-soft transition focus-ring", cls)} animate={showWrong
                    ? { x: [0, -6, 6, -4, 4, 0] }
                    : showCorrect && chosen
                        ? { scale: [1, 1.02, 1] }
                        : { x: 0, scale: 1 }} transition={{ duration: 0.36, ease: "easeOut" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold">{String.fromCharCode(65 + i)}.</div>
                        <div className="mt-1 text-sm font-semibold">{opt}</div>
                      </div>
                      {showCorrect ? (<span className="mt-0.5 grid h-8 w-8 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30">
                          <Check className="h-4 w-4 text-emerald-100"/>
                        </span>) : showWrong ? (<span className="mt-0.5 grid h-8 w-8 place-items-center rounded-2xl bg-red-500/15 border border-red-400/30">
                          <X className="h-4 w-4 text-red-100"/>
                        </span>) : null}
                    </div>
                  </motion.button>);
        })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => goTo(idx - 1)} disabled={idx === 0}>
            Previous
          </Button>
          {idx === total - 1 ? (<Button className="h-11 rounded-2xl" onClick={() => void submit(false)}>
              Submit Quiz
            </Button>) : (<Button className="h-11 rounded-2xl" onClick={() => goTo(idx + 1)}>
              Next
            </Button>)}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Navigate</div>
            <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
              Jump, mark for review, and submit anytime.
            </div>
          </div>
          <Button className="h-10 rounded-2xl" onClick={() => void submit(false)}>
            Submit
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-6 gap-2">
          {order.map((questionId, i) => {
            const done = active.answers[questionId] != null;
            const activeQ = i === idx;
            const review = Boolean(active.markedForReview[questionId]);
            const base = "h-10 rounded-2xl border text-sm font-extrabold shadow-soft transition focus-ring";
            const cls = activeQ
                ? "border-byjus-300 bg-byjus-600 text-white"
                : review
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
                    : done
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
                        : "border-white/10 bg-white/[0.03] text-ink-200 hover:bg-white/[0.06]";
            return (<button key={questionId} type="button" onClick={() => goTo(i)} className={cn(base, cls)}>
                {i + 1}
              </button>);
        })}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
          <div className="text-xs font-extrabold text-ink-200">Tip</div>
          <div className="mt-1 text-sm font-semibold text-ink-200">
            Mark tough questions, move on, and return at the end.
          </div>
        </div>
      </Card>
    </div>);
}
