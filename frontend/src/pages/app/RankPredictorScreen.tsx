import { useEffect, useState } from "react";
import { Calendar, Loader2, Target, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type RankPrediction, type StudyPlan } from "@/lib/apiV2";

export function RankPredictorScreen() {
  const [prediction, setPrediction] = useState<RankPrediction | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiV2.rank.predict(), apiV2.rank.studyPlan()])
      .then(([p, s]) => { setPrediction(p); setPlan(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-byjus-400" /></div>;
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-byjus-600/30 grid place-items-center">
              <Target className="h-6 w-6 text-byjus-400" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-ink-900 dark:text-ink-50">Rank Predictor</div>
              <div className="text-sm text-ink-500 dark:text-ink-400">Based on your current performance data</div>
            </div>
          </div>
        </Card>
      </Reveal>

      {prediction && (
        <>
          <Reveal delay={0.05}>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-byjus-700 via-byjus-600 to-indigo-600 p-6">
                <div className="text-xs font-extrabold text-white/70 uppercase tracking-wide">Estimated NEET Score</div>
                <div className="mt-2 text-5xl font-extrabold text-white">{prediction.estimated_score}</div>
                <div className="text-sm text-white/70 mt-1">out of 720</div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-ink-500 mb-1">Estimated Rank</div>
                    <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
                      {prediction.rank_low.toLocaleString()} – {prediction.rank_high.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-ink-500 mb-1">Percentile</div>
                    <div className="text-lg font-extrabold text-emerald-400">{prediction.percentile}%</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-ink-500 mb-1.5">
                    <span>Score progress</span>
                    <span>{prediction.estimated_score}/720</span>
                  </div>
                  <ProgressBar value={(prediction.estimated_score / 720) * 100} />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-extrabold text-ink-500 uppercase tracking-wide mb-2">Analysis</div>
                  <div className="text-sm text-ink-300">{prediction.message}</div>
                </div>
              </div>
            </Card>
          </Reveal>

          {prediction.improvement_tips.length > 0 && (
            <Reveal delay={0.1}>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-byjus-400" />
                  <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">Improvement Tips</div>
                </div>
                <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                  {prediction.improvement_tips.map((tip, i) => (
                    <motion.div key={i} variants={staggerItem}
                      className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                      <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-sm font-semibold text-amber-300">{tip}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </Card>
            </Reveal>
          )}
        </>
      )}

      {plan && (
        <Reveal delay={0.15}>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-byjus-400" />
              <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">Study Plan</div>
              <Badge className="bg-white/10 border-white/10 text-ink-200 ml-auto">{plan.days_left} days left</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-ink-500">Target Date</div>
                <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50 mt-0.5">{plan.target_date}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-ink-500">Daily Hours</div>
                <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50 mt-0.5">{plan.daily_hours}h/day</div>
              </div>
            </div>

            <div className="space-y-2">
              {plan.weekly_plan.map((week: any) => (
                <div key={week.week} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-byjus-300">Week {week.week}</div>
                    <Badge className="bg-byjus-600/20 border-byjus-500/30 text-byjus-300 text-[10px]">{week.focus}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-ink-400">{week.goal}</div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
