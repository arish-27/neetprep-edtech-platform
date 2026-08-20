import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Timer, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Reveal } from "@/components/motion/Reveal";
import { staggerItemScale } from "@/lib/motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { subjects } from "@/data/mockData";
import { api, apiSubjectToKey } from "@/lib/api";
import { Button } from "@/components/ui/Button";
function formatHours(totalSeconds) {
    const h = Math.max(0, totalSeconds) / 3600;
    if (h < 1)
        return `${Math.round(h * 60)}m`;
    return `${h.toFixed(h < 10 ? 1 : 0)}h`;
}
function pctForResult(r) {
    const total = r.total_questions ?? 0;
    if (!total)
        return 0;
    return Math.round(((r.score ?? 0) / total) * 100);
}
function formatDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    catch {
        return "";
    }
}
export function PerformanceDashboardScreen() {
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [subjectLoading, setSubjectLoading] = useState(true);
    const [subjectProgress, setSubjectProgress] = useState({});
    const [quizLoading, setQuizLoading] = useState(true);
    const [recentQuizzes, setRecentQuizzes] = useState([]);
    useEffect(() => {
        setSummaryLoading(true);
        api.dashboard.summary()
            .then((s) => setSummary(s))
            .catch(() => setSummary(null))
            .finally(() => setSummaryLoading(false));
    }, []);
    useEffect(() => {
        setSubjectLoading(true);
        api.dashboard.subjectProgress()
            .then((rows) => {
            const next = {};
            for (const r of rows ?? [])
                next[apiSubjectToKey(r.subject)] = r.progress_pct ?? 0;
            setSubjectProgress(next);
        })
            .catch(() => setSubjectProgress({}))
            .finally(() => setSubjectLoading(false));
    }, []);
    useEffect(() => {
        setQuizLoading(true);
        api.dashboard.quizPerformance({ limit: 10, offset: 0 })
            .then((page) => setRecentQuizzes(page.items ?? []))
            .catch(() => setRecentQuizzes([]))
            .finally(() => setQuizLoading(false));
    }, []);
    const watchedLabel = useMemo(() => formatHours(summary?.watched_seconds ?? 0), [summary?.watched_seconds]);
    const avgScore = summary?.avg_score_pct ?? 0;
    const attempts = summary?.quiz_attempts ?? 0;
    return (<div className="space-y-4">
      <motion.div className="grid gap-4 md:grid-cols-3" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }} initial="hidden" animate="show">
        <motion.div variants={staggerItemScale}>
          <Card interactive className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Time watched</div>
                <div className="mt-2 text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                  {summaryLoading ? <Skeleton className="h-10 w-24"/> : watchedLabel}
                </div>
                <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">From your video progress</div>
              </div>
              <motion.div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center" whileHover={{ scale: 1.15, rotate: 10 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <Timer className="h-5 w-5 text-byjus-400"/>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItemScale}>
          <Card interactive className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Avg quiz score</div>
                <div className="mt-2 text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                  {summaryLoading ? <Skeleton className="h-10 w-20"/> : <AnimatedNumber value={avgScore} suffix="%"/>}
                </div>
                <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">Based on submitted quizzes</div>
              </div>
              <motion.div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center" whileHover={{ scale: 1.15, rotate: 10 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <TrendingUp className="h-5 w-5 text-byjus-400"/>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItemScale}>
          <Card interactive className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Quiz attempts</div>
                <div className="mt-2 text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                  {summaryLoading ? <Skeleton className="h-10 w-16"/> : <AnimatedNumber value={attempts}/>}
                </div>
                <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">Attempts stored in DB</div>
              </div>
              <motion.div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center" whileHover={{ scale: 1.15, rotate: 10 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <BarChart3 className="h-5 w-5 text-byjus-400"/>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Recent quizzes</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                Live stats update after you submit a quiz.
              </div>
            </div>
            <Badge className="bg-white/10 border-white/10 text-ink-200">
              <Activity className="h-3.5 w-3.5"/>
              {attempts}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {quizLoading ? (<>
                <Skeleton className="h-12 w-full"/>
                <Skeleton className="h-12 w-full"/>
                <Skeleton className="h-12 w-full"/>
              </>) : recentQuizzes.length ? (recentQuizzes.map((r) => {
            const pct = pctForResult(r);
            return (<div key={r.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">
                          Quiz score: {pct}%
                        </div>
                        <div className="mt-1 text-xs font-semibold text-ink-600 dark:text-ink-200">
                          {formatDate(r.created_at)} · {r.score}/{r.total_questions}
                        </div>
                      </div>
                      <Badge className="bg-white/10 border-white/10 text-ink-200">{pct}%</Badge>
                    </div>
                    <ProgressBar value={pct} className="mt-3"/>
                  </div>);
        })) : (<div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-ink-600 dark:text-ink-200">
                No quiz attempts yet. Start a quiz to see your analytics here.
              </div>)}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="p-5">
          <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Subject progress</div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {subjectLoading ? (<><Skeleton className="h-24 w-full"/><Skeleton className="h-24 w-full"/><Skeleton className="h-24 w-full"/></>) : (subjects.map((s, i) => {
            const pct = subjectProgress[s.id] ?? 0;
            return (<motion.div key={s.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 300, damping: 24 }} whileHover={{ y: -3 }} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">{s.name}</div>
                      <Badge className="bg-white/10 border-white/10 text-ink-200">
                        <AnimatedNumber value={pct} suffix="%"/>
                      </Badge>
                    </div>
                    <ProgressBar value={pct} className="mt-3"/>
                    <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
                      Progress updates as you watch lessons.
                    </div>
                  </motion.div>);
        }))}
          </div>
          <div className="mt-4">
            <Link to="/app/performance/subjects">
              <Button variant="secondary" className="h-10 rounded-2xl">
                View detailed subject analytics →
              </Button>
            </Link>
          </div>
        </Card>
      </Reveal>
    </div>);
}
