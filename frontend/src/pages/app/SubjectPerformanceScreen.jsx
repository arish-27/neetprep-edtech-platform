import { useEffect, useState } from "react";
import { Activity, BookOpen, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Reveal } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { api } from "@/lib/api";
function formatSeconds(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0)
        return `${h}h ${m}m`;
    return `${m}m`;
}
const SUBJECT_GRADIENTS = {
    Physics: "from-violet-600 via-fuchsia-600 to-pink-500",
    Chemistry: "from-blue-700 via-blue-600 to-indigo-500",
    Biology: "from-emerald-600 via-teal-600 to-cyan-500",
};
function accuracyColor(pct) {
    if (pct >= 75)
        return "text-emerald-400";
    if (pct >= 50)
        return "text-amber-400";
    return "text-rose-400";
}
export function SubjectPerformanceScreen() {
    const [loading, setLoading] = useState(true);
    const [performances, setPerformances] = useState([]);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const data = await api.teacher.studentPerformance();
                if (!cancelled)
                    setPerformances(data ?? []);
            }
            catch {
                if (!cancelled)
                    setPerformances([]);
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    return (<div className="space-y-4">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
                Subject Performance
              </div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                Your detailed performance tracked per subject
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center">
              <TrendingUp className="h-5 w-5 text-byjus-400"/>
            </div>
          </div>
        </Card>
      </Reveal>

      {loading ? (<div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-3xl"/>
          <Skeleton className="h-48 w-full rounded-3xl"/>
          <Skeleton className="h-48 w-full rounded-3xl"/>
        </div>) : performances.length === 0 ? (<Card className="p-8 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-byjus-400"/>
          <div className="mt-3 text-base font-extrabold text-ink-900 dark:text-ink-50">
            No performance data yet
          </div>
          <div className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            Submit quizzes and watch lessons to see your subject-wise analytics here.
          </div>
        </Card>) : (<motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainer} initial="hidden" animate="show">
          {performances.map((p) => {
                const gradient = SUBJECT_GRADIENTS[p.subject] ?? "from-byjus-700 to-byjus-500";
                return (<motion.div key={p.id} variants={staggerItem}>
                <Card interactive className="overflow-hidden">
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-r ${gradient} p-4`}>
                    <div className="text-base font-extrabold text-white">{p.subject}</div>
                    <div className={`mt-1 text-3xl font-extrabold text-white`}>
                      {p.accuracy_pct.toFixed(0)}%
                    </div>
                    <div className="text-xs text-white/70 mt-0.5">accuracy</div>
                  </div>

                  {/* Stats */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-ink-500 dark:text-ink-400">
                        <span>Course Progress</span>
                        <span>{p.progress_pct.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={p.progress_pct}/>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                          <Activity className="h-3.5 w-3.5 text-byjus-400"/>
                          Quizzes
                        </div>
                        <div className="mt-1 text-sm font-extrabold text-ink-900 dark:text-ink-50">
                          {p.quiz_attempts}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400"/>
                          Lessons
                        </div>
                        <div className="mt-1 text-sm font-extrabold text-ink-900 dark:text-ink-50">
                          {p.completed_lessons}
                          {p.total_lessons > 0 && (<span className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                              /{p.total_lessons}
                            </span>)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                          <Clock className="h-3.5 w-3.5 text-sky-400"/>
                          Watch time
                        </div>
                        <div className="mt-1 text-sm font-extrabold text-ink-900 dark:text-ink-50">
                          {formatSeconds(p.watched_seconds)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                          <TrendingUp className="h-3.5 w-3.5 text-amber-400"/>
                          Score
                        </div>
                        <div className={`mt-1 text-sm font-extrabold ${accuracyColor(p.accuracy_pct)}`}>
                          {p.total_score}/{p.total_questions}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>);
            })}
        </motion.div>)}
    </div>);
}
