import { useEffect, useState } from "react";
import { Crown, Flame, Loader2, RefreshCw, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type LeaderboardEntry } from "@/lib/apiV2";
import { api, type ApiTeacherDashboard } from "@/lib/api";

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-400" />;
  if (rank === 2) return <Trophy className="h-4 w-4 text-slate-300" />;
  if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
  return <span className="text-xs font-extrabold text-slate-400">#{rank}</span>;
}

export function LeaderboardControlScreen() {
  const [xpBoard, setXpBoard] = useState<LeaderboardEntry[]>([]);
  const [classBoard, setClassBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"class" | "global">("class");

  function load() {
    setLoading(true);
    Promise.all([
      apiV2.adaptive.leaderboard(50),
      api.teacher.dashboard().catch(() => null),
    ]).then(([lb, dash]) => {
      setXpBoard(lb);
      if (dash) {
        const sorted = [...(dash as ApiTeacherDashboard).all_students].sort((a, b) => b.accuracy_pct - a.accuracy_pct);
        setClassBoard(sorted.map((s, i) => ({ ...s, rank: i + 1 })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 grid place-items-center">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-800">Leaderboard Control</div>
                <div className="text-sm text-slate-500">Monitor student rankings and engagement</div>
              </div>
            </div>
            <button type="button" onClick={load} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-800 transition focus-ring">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {(["class", "global"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`rounded-2xl border px-4 py-2 text-xs font-extrabold transition focus-ring capitalize ${tab === t ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                {t === "class" ? "My Class (Accuracy)" : "Global (XP)"}
              </button>
            ))}
          </div>
        </Card>
      </Reveal>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
      ) : (
        <Reveal delay={0.05}>
          <Card className="p-5">
            {tab === "class" ? (
              <>
                <div className="text-sm font-extrabold text-slate-800 mb-4">
                  Class Ranking — by Quiz Accuracy
                </div>
                {classBoard.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-6">No student data yet.</div>
                ) : (
                  <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                    {classBoard.map((s) => (
                      <motion.div key={String(s.user_id)} variants={staggerItem}
                        className={`flex items-center gap-3 rounded-2xl border p-3 ${s.is_weak ? "border-rose-500/20 bg-rose-500/5" : "border-slate-200 bg-slate-50"}`}>
                        <div className="h-8 w-8 shrink-0 grid place-items-center">{rankIcon(s.rank)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-800 truncate">{s.username}</span>
                            {s.is_weak && <Badge className="bg-rose-500/20 border-rose-500/30 text-rose-300 text-[10px]">Weak</Badge>}
                          </div>
                          <div className="text-[10px] text-slate-500">{s.quiz_attempts} quizzes · {s.completed_lessons} lessons</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-sm font-extrabold ${s.accuracy_pct >= 75 ? "text-emerald-400" : s.accuracy_pct >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                            {s.accuracy_pct.toFixed(0)}%
                          </div>
                          <div className="text-[10px] text-slate-500">accuracy</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              <>
                <div className="text-sm font-extrabold text-slate-800 mb-4">
                  Global Ranking — by XP (Adaptive Practice)
                </div>
                {xpBoard.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-6">No XP data yet. Students need to use Adaptive Practice.</div>
                ) : (
                  <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
                    {xpBoard.map((e) => (
                      <motion.div key={e.student_id} variants={staggerItem}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="h-8 w-8 shrink-0 grid place-items-center">{rankIcon(e.rank)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-slate-800 truncate">{e.username}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Flame className="h-3 w-3 text-orange-400" /> {e.streak_days}d streak
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-sm font-extrabold text-amber-400">{e.xp}</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </Card>
        </Reveal>
      )}
    </div>
  );
}
