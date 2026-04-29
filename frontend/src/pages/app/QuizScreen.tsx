import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, PlayCircle, Search, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { subjects } from "@/data/mockData";
import { api, type ApiCoursePublic, type SubjectKey } from "@/lib/api";

export function QuizScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApiCoursePublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionCourseId, setActionCourseId] = useState<string | null>(null);
  const [randomBusy, setRandomBusy] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setQuery(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const raw = new URLSearchParams(location.search).get("subject");
    if (!raw) return;
    const next = raw.trim().toLowerCase();
    if (next === "physics" || next === "chemistry" || next === "biology" || next === "all") {
      setSubjectId(next);
    }
  }, [location.search]);

  const apiSubject = useMemo(() => {
    if (subjectId === "all") return undefined;
    return subjectId as SubjectKey;
  }, [subjectId]);

  const tabs = useMemo(
    () => [{ id: "all", label: "All" }, ...subjects.map((s) => ({ id: s.id, label: s.name }))],
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const page = await api.courses.list({ subject: apiSubject, q: query || undefined, limit: 30, offset: 0 });
        if (cancelled) return;
        setItems(page.items ?? []);
      } catch (err: any) {
        if (cancelled) return;
        setItems([]);
        setError(err?.message ?? "Failed to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiSubject, query]);

  const openQuiz = async (courseId: string, dest: "attempt" | "result") => {
    setError(null);
    setActionCourseId(courseId);
    try {
      await api.courses.enroll(courseId).catch(() => undefined);
      const quiz = await api.quizzes.byCourse(courseId);
      navigate(`/app/quizzes/${quiz.id}/${dest}`);
    } catch (err: any) {
      setError(err?.message ?? "Quiz not available for this course yet.");
    } finally {
      setActionCourseId(null);
    }
  };

  const startRandomQuiz = async () => {
    if (randomBusy) return;
    setRandomBusy(true);
    setError(null);
    try {
      const subjectKeys: SubjectKey[] = ["physics", "chemistry", "biology"];
      const chosenSubject = subjectKeys[Math.floor(Math.random() * subjectKeys.length)];
      setSubjectId(chosenSubject);
      setQ("");

      const page = await api.courses.list({ subject: chosenSubject, limit: 50, offset: 0 });
      const pool = page.items ?? [];
      if (!pool.length) {
        throw new Error("No courses found. Make sure the backend is running and demo data is seeded.");
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (!pick?.id) throw new Error("No courses found.");
      await openQuiz(pick.id, "attempt");
    } catch (err: any) {
      setError(err?.message ?? "Failed to start random quiz.");
    } finally {
      setRandomBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Reveal>
        <Card className="p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Quizzes</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                Course-wise quizzes loaded from the database.
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative sm:w-[320px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" className="pl-9" />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-2xl"
                onClick={startRandomQuiz}
                disabled={loading || randomBusy}
                title="Pick a random subject + course and start a quiz"
              >
                <Shuffle className="h-4 w-4" />
                {randomBusy ? "Picking…" : "Random quiz"}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 shadow-soft">
                {tabs.map((t) => {
                  const active = t.id === subjectId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSubjectId(t.id)}
                      className={cn(
                        "relative h-10 whitespace-nowrap rounded-2xl px-4 text-sm font-extrabold transition focus-ring",
                        active ? "text-ink-50" : "text-ink-200 hover:text-ink-50",
                      )}
                    >
                      {active ? (
                        <motion.span layoutId="quiz_tab" className="absolute inset-0 rounded-2xl byjus-gradient opacity-90" />
                      ) : null}
                      <span className="relative">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Badge className="bg-white/10 border-white/10 text-ink-200">{items.length} courses</Badge>
          </div>
        </Card>
      </Reveal>

      {error ? (
        <Card className="p-4 border border-red-400/30 bg-red-500/10">
          <div className="text-sm font-extrabold text-red-700 dark:text-red-100">{error}</div>
        </Card>
      ) : null}

      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={`sk_${i}`} variants={staggerItem}>
                <Card className="p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              </motion.div>
            ))
          : items.map((c) => {
              const busy = actionCourseId === c.id;
              return (
                <motion.div key={c.id} variants={staggerItem}>
                  <Card interactive className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">{c.title}</div>
                        <div className="mt-1 text-xs font-semibold text-ink-600 dark:text-ink-200">
                          {c.subject.toUpperCase()} • Practice quiz
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-2xl bg-byjus-50 border border-byjus-200/70 grid place-items-center dark:bg-white/10 dark:border-white/10">
                        <ClipboardList className="h-5 w-5 text-byjus-700 dark:text-ink-200" />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button className="h-10 w-full rounded-2xl" onClick={() => openQuiz(c.id, "attempt")} disabled={busy}>
                        <PlayCircle className="h-4 w-4" />
                        {busy ? "Loading…" : "Start"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-10 w-full rounded-2xl"
                        onClick={() => openQuiz(c.id, "result")}
                        disabled={busy}
                      >
                        Results
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
      </motion.div>

      {!loading && items.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">No courses found</div>
          <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
            Start the backend API (port 8001). Demo courses + quizzes auto-seed on first run.
          </div>
          <div className="mt-4">
            <Link to="/app/subjects">
              <Button variant="secondary" className="h-11 rounded-2xl">
                Browse subjects
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
