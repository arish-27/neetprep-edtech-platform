import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { subjects } from "@/data/mockData";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Reveal } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, apiSubjectToKey } from "@/lib/api";

export function SubjectsScreen() {
  const [q, setQ] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [progressLoading, setProgressLoading] = useState(true);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((s) => s.name.toLowerCase().includes(query));
  }, [q]);

  useEffect(() => {
    setProgressLoading(true);
    api.dashboard.subjectProgress()
      .then((rows) => {
        const next: Record<string, number> = {};
        for (const r of rows ?? []) next[apiSubjectToKey(r.subject)] = r.progress_pct ?? 0;
        setProgress(next);
      })
      .catch(() => setProgress({}))
      .finally(() => setProgressLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <Reveal>
        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
                Subjects
              </div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                Choose a subject to view chapters, videos, and quizzes.
              </div>
            </div>
            <div className="relative md:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search subjects…"
                className="pl-9"
              />
            </div>
          </div>
        </Card>
      </Reveal>

      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        variants={{
          animate: { transition: { staggerChildren: 0.15 } },
        }}
        initial="initial"
        animate="animate"
      >
        {filtered.map((s) => {
          const pct = progress[s.id] ?? 0;
          return (
            <motion.div
              key={s.id}
              variants={{ initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(0,200,83,0.4)" }}
            >
              <Link to={`/app/subjects/${s.id}/chapters`} className="focus-ring rounded-3xl block">
                <Card interactive className="p-5 overflow-hidden group">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl bg-gradient-to-br shadow-glow grid place-items-center text-white",
                      s.gradient,
                    )}
                  >
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="mt-4">
                    <div className="text-lg font-extrabold text-ink-900 group-hover:text-byjus-400 transition dark:text-ink-50">
                      {s.name}
                    </div>
                    <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">{s.tagline}</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-ink-700 dark:text-ink-200">
                      <span>Progress</span>
                      {progressLoading ? (
                        <Skeleton className="h-4 w-10" />
                      ) : (
                        <span className="text-ink-500 dark:text-ink-300">{pct}%</span>
                      )}
                    </div>
                    {progressLoading ? (
                      <Skeleton className="mt-2 h-2.5 w-full" />
                    ) : (
                      <ProgressBar value={pct} className="mt-2" />
                    )}
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
