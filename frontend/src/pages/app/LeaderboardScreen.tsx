import { useEffect, useState } from "react";
import { Crown, Flame, Loader2, Medal, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type LeaderboardEntry, type MyStats } from "@/lib/apiV2";
import { useAuth } from "@/auth/AuthContext";

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-extrabold text-ink-400">#{rank}</span>;
}

function rankBg(rank: number) {
  if (rank === 1) return "border-amber-500/40 bg-amber-500/10";
  if (rank === 2) return "border-slate-400/30 bg-slate-400/10";
  if (rank === 3) return "border-amber-600/30 bg-amber-600/10";
  return "border-white/10 bg-white/5";
}

export function LeaderboardScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiV2.adaptive.leaderboard(50),
      apiV2.adaptive.myStats(),
    ])
      .then(([lb, stats]) => { setEntries(lb); setMyStats(stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 grid place-items-center">
              <Trophy className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-ink-900 dark:text-ink-50">Leaderboard</div>
              <div className="text-sm text-ink-500 dark:text-ink-400">Top students by XP — resets weekly</div>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* My stats card */}
      {myStats && (
        <Reveal delay={0.05}>
          <Card className="p-5">
            <div className="text-xs font-extrabold text-ink-500 dark:text-ink-400 uppercase tracking-wide mb-3">Your Stats</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xl font-extrabold text-ink-900 dark:text-ink-50">{myStats.xp}</div>
                <div className="text-[10px] text-ink-500">XP</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <div className="text-xl font-extrabold text-ink-900 dark:text-ink-50">{myStats.streak_days}</div>
                <div className="text-[10px] text-ink-500">Day Streak</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="h-4 w-4 text-byjus-400" />
                </div>
                <div className="text-xl font-extrabold text-ink-900 dark:text-ink-50">
                  {myStats.rank ? `#${myStats.rank}` : "—"}
                </div>
                <div className="text-[10px] text-ink-500">Rank</div>
              </div>
            </div>
            {myStats.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {myStats.badges.map((b) => (
                  <Badge key={b} className="bg-byjus-600/20 border-byjus-500/30 text-byjus-300 text-[10px]">{b}</Badge>
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      )}

      {/* Leaderboard */}
      <Reveal delay={0.1}>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-byjus-400" /></div>
        ) : entries.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="mx-auto h-10 w-10 text-ink-400 mb-3" />
            <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">No rankings yet</div>
            <div className="mt-2 text-sm text-ink-500 dark:text-ink-400">Start practicing to earn XP and appear here!</div>
          </Card>
        ) : (
          <Card className="p-5">
            <div className="text-base font-extrabold text-ink-900 dark:text-ink-50 mb-4">Top Students</div>
            <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
              {entries.map((e) => {
                const isMe = e.username === user?.name || e.student_id === user?.id;
                return (
                  <motion.div key={e.student_id} variants={staggerItem}
                    whileHover={{ x: 4, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${rankBg(e.rank)} ${isMe ? "ring-1 ring-byjus-400/40" : ""}`}>
                    <div className="h-8 w-8 shrink-0 grid place-items-center">
                      {rankIcon(e.rank)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-ink-900 dark:text-ink-50 truncate">{e.username}</span>
                        {isMe && <Badge className="bg-byjus-600/20 border-byjus-500/30 text-byjus-300 text-[10px]">You</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-ink-500 flex items-center gap-0.5">
                          <Flame className="h-3 w-3 text-orange-400" /> {e.streak_days}d
                        </span>
                        {e.badges.slice(0, 2).map((b) => (
                          <span key={b} className="text-[10px] text-ink-500">{b}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-sm font-extrabold text-amber-400">{e.xp}</span>
                      </div>
                      <div className="text-[10px] text-ink-500">XP</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </Card>
        )}
      </Reveal>
    </div>
  );
}
