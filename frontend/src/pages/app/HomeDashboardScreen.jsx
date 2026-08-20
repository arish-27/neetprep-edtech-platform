import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Flame, GraduationCap, PlayCircle, Sparkles, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ThumbImage } from "@/components/ui/ThumbImage";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { subjects } from "@/data/mockData";
import { useAppStore } from "@/state/useAppStore";
import { useHydrated } from "@/state/useHydrated";
import { getYouTubeThumbnail } from "@/lib/video";
import { api, apiSubjectToKey } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { staggerContainer, staggerItem } from "@/lib/motion";
function pctFor(videoId, durationMin, progress) {
    const p = progress[videoId];
    const dur = (p?.durationSeconds ?? durationMin * 60) || durationMin * 60;
    if (!dur)
        return 0;
    return Math.round(((p?.seconds ?? 0) / dur) * 100);
}
function formatHours(totalSeconds) {
    const h = Math.max(0, totalSeconds) / 3600;
    if (h < 1)
        return `${Math.round(h * 60)}m`;
    return `${h.toFixed(h < 10 ? 1 : 0)}h`;
}
function isUuid(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function toUiVideo(lesson, course) {
    const durationMin = lesson.duration ? Math.max(1, Math.round(lesson.duration / 60)) : 0;
    return {
        id: lesson.id,
        subjectId: apiSubjectToKey(course.subject),
        chapterId: course.id,
        title: lesson.title,
        description: course.description || "Lesson",
        teacher: "NEET Faculty",
        durationMin,
        url: lesson.youtube_id ? `https://www.youtube.com/watch?v=${lesson.youtube_id}` : "",
    };
}
export function HomeDashboardScreen() {
    const navigate = useNavigate();
    const hasHydrated = useHydrated();
    const videoProgress = useAppStore((s) => s.videoProgress);
    const recentVideoIds = useAppStore((s) => s.recentVideoIds);
    const continueLessonIds = useMemo(() => {
        if (!hasHydrated)
            return [];
        return Object.entries(videoProgress)
            .filter(([id, p]) => isUuid(id) && (p?.seconds ?? 0) >= 10)
            .sort((a, b) => (b[1]?.updatedAt ?? 0) - (a[1]?.updatedAt ?? 0))
            .map(([id]) => id)
            .slice(0, 3);
    }, [videoProgress, hasHydrated]);
    const recentLessonIds = useMemo(() => {
        if (!hasHydrated)
            return [];
        return recentVideoIds.filter((id) => isUuid(id)).slice(0, 3);
    }, [recentVideoIds, hasHydrated]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState(null);
    const [courses, setCourses] = useState([]);
    const [videoByLessonId, setVideoByLessonId] = useState({});
    const [action, setAction] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [subjectProgressLoading, setSubjectProgressLoading] = useState(true);
    const [subjectProgress, setSubjectProgress] = useState({});
    const [courseProgress, setCourseProgress] = useState({});
    useEffect(() => {
        setSummaryLoading(true);
        api.dashboard.summary()
            .then((s) => setSummary(s))
            .catch(() => setSummary(null))
            .finally(() => setSummaryLoading(false));
    }, []);
    useEffect(() => {
        setSubjectProgressLoading(true);
        api.dashboard.subjectProgress()
            .then((rows) => {
            const next = {};
            for (const r of rows ?? [])
                next[apiSubjectToKey(r.subject)] = r.progress_pct ?? 0;
            setSubjectProgress(next);
        })
            .catch(() => setSubjectProgress({}))
            .finally(() => setSubjectProgressLoading(false));
    }, []);
    useEffect(() => {
        api.dashboard.courseProgress({ limit: 100, offset: 0 })
            .then((page) => {
            const next = {};
            for (const p of page.items ?? [])
                next[p.course_id] = p.progress_pct ?? 0;
            setCourseProgress(next);
        })
            .catch(() => setCourseProgress({}));
    }, []);
    useEffect(() => {
        setCoursesLoading(true);
        setCoursesError(null);
        api.courses.list({ limit: 12, offset: 0 })
            .then((page) => setCourses(page.items ?? []))
            .catch((err) => {
            setCourses([]);
            setCoursesError(err?.message ?? "Failed to load courses.");
        })
            .finally(() => setCoursesLoading(false));
    }, []);
    useEffect(() => {
        const ids = Array.from(new Set([...continueLessonIds, ...recentLessonIds]));
        const missing = ids.filter((id) => !videoByLessonId[id]);
        if (missing.length === 0)
            return;
        Promise.all(missing.map(async (id) => {
            try {
                const lesson = await api.lessons.get(id);
                const course = await api.courses.details(lesson.course_id);
                return { id, video: toUiVideo(lesson, course) };
            }
            catch {
                return null;
            }
        })).then((results) => {
            setVideoByLessonId((prev) => {
                const next = { ...prev };
                for (const r of results) {
                    if (!r)
                        continue;
                    next[r.id] = r.video;
                }
                return next;
            });
        });
    }, [continueLessonIds.join("|"), recentLessonIds.join("|")]);
    const continueVideos = useMemo(() => {
        return continueLessonIds.map((id) => videoByLessonId[id]).filter(Boolean);
    }, [continueLessonIds, videoByLessonId]);
    const recentlyViewed = useMemo(() => {
        return recentLessonIds.map((id) => videoByLessonId[id]).filter(Boolean);
    }, [recentLessonIds, videoByLessonId]);
    const recommendedCourses = useMemo(() => {
        const targetSubject = [...subjects]
            .map((s) => ({ id: s.id, pct: subjectProgress[s.id] ?? 0 }))
            .sort((a, b) => a.pct - b.pct)[0]?.id ?? "physics";
        const picks = courses.filter((c) => apiSubjectToKey(c.subject) === targetSubject);
        const extra = courses.filter((c) => apiSubjectToKey(c.subject) !== targetSubject);
        return [...picks, ...extra].slice(0, 3);
    }, [courses, subjectProgress]);
    const topCourses = useMemo(() => courses.slice(0, 3), [courses]);
    const runCourse = async (courseId, mode) => {
        setActionError(null);
        setAction({ courseId, type: mode });
        try {
            await api.courses.enroll(courseId).catch(() => undefined);
            if (mode === "watch") {
                const page = await api.lessons.byCourse(courseId, { limit: 50, offset: 0 });
                const lessons = [...(page.items ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
                const first = lessons[0];
                if (!first)
                    throw new Error("No lessons published for this course yet.");
                navigate(`/app/videos/${first.id}`);
                return;
            }
            const quiz = await api.quizzes.byCourse(courseId);
            navigate(`/app/quizzes/${quiz.id}/attempt`);
        }
        catch (err) {
            setActionError(err?.message ?? "Action failed.");
        }
        finally {
            setAction(null);
        }
    };
    return (<div className="space-y-4">
      {/* Hero banner — from uploaded: title x:-50 → 0 */}
      <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
      <Card className="overflow-hidden">
        <div className="relative p-6 md:p-8">
          <div className="absolute inset-0 byjus-gradient opacity-90"/>
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl"/>
          <div className="absolute -left-24 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"/>
          <div className="relative">
            <Badge className="border-white/30 bg-white/15 text-white">
              <Sparkles className="h-3.5 w-3.5"/>
              Today&apos;s focus
            </Badge>
            <div className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Master one course, then test it.
            </div>
            <div className="mt-2 text-sm font-semibold text-white/85 max-w-2xl">
              Watch a short video, take a quiz, then do a quick review. Consistency beats intensity.
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/app/subjects">
                <Button variant="secondary" className="h-11 rounded-2xl border-white/30 bg-white/15 text-white hover:bg-white/20">
                  Explore Subjects <ArrowRight className="h-4 w-4"/>
                </Button>
              </Link>
              <Link to="/app/mock-tests">
                <Button variant="ghost" className="h-11 rounded-2xl text-white hover:bg-white/15">
                  Take a Mock <GraduationCap className="h-4 w-4"/>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
      </motion.div>

      {/* Stats cards — from uploaded: stagger + fadeUp y:60 */}
      <motion.div className="grid gap-4 md:grid-cols-3" variants={{
            animate: { transition: { staggerChildren: 0.15 } },
        }} initial="initial" animate="animate">
        <motion.div variants={{ initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } }} transition={{ duration: 0.6 }} whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(124,58,237,0.4)" }}>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Time watched</div>
              <motion.div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center" whileHover={{ scale: 1.15, rotate: 10 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <Flame className="h-5 w-5 text-byjus-400"/>
              </motion.div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-ink-900 dark:text-ink-50">
              {summaryLoading ? <Skeleton className="h-10 w-24"/> : formatHours(summary?.watched_seconds ?? 0)}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">Updates when you watch lessons.</div>
          </Card>
        </motion.div>

        <motion.div variants={{ initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } }} transition={{ duration: 0.6 }} whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(124,58,237,0.4)" }}>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Avg quiz score</div>
              <motion.div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center" whileHover={{ scale: 1.15, rotate: 10 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <GraduationCap className="h-5 w-5 text-byjus-400"/>
              </motion.div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-ink-900 dark:text-ink-50">
              {summaryLoading ? <Skeleton className="h-10 w-20"/> : (<><AnimatedNumber value={summary?.avg_score_pct ?? 0} suffix="%"/></>)}
            </div>
            <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">Based on submitted quizzes.</div>
          </Card>
        </motion.div>

        <motion.div variants={{ initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 } }} transition={{ duration: 0.6 }} whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(124,58,237,0.4)" }}>
          <Card className="p-5">
            <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Overall progress</div>
            <div className="mt-3 space-y-3">
              {subjectProgressLoading ? (<><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-full"/></>) : (subjects.map((s, i) => {
            const pct = subjectProgress[s.id] ?? 0;
            return (<motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}>
                      <div className="flex items-center justify-between text-sm font-semibold text-ink-700 dark:text-ink-200">
                        <span>{s.name}</span>
                        <span className="text-ink-500 dark:text-ink-300">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} className="mt-2"/>
                    </motion.div>);
        }))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {coursesError || actionError ? (<Card className="p-4 border border-red-400/30 bg-red-500/10">
          <div className="text-sm font-extrabold text-red-700 dark:text-red-100">{coursesError ?? actionError}</div>
        </Card>) : null}

      <motion.div className="grid gap-4 lg:grid-cols-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Continue where you left off</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Your in-progress lessons</div>
            </div>
            <Link to="/app/recorded-classes" className="text-sm font-bold text-byjus-300 hover:underline">
              Open courses
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {!hasHydrated ? (<><Skeleton className="h-20 w-full rounded-2xl"/><Skeleton className="h-20 w-full rounded-2xl"/></>) : continueVideos.length ? (<motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {continueVideos.map((v) => {
                const thumb = getYouTubeThumbnail(v.url, "mq");
                const pct = pctFor(v.id, v.durationMin, videoProgress);
                return (<motion.div key={v.id} variants={staggerItem} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Link to={`/app/videos/${v.id}`} className="focus-ring rounded-2xl">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-soft transition hover:bg-white/10">
                      <div className="h-14 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <ThumbImage src={thumb}/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">{v.title}</div>
                        <div className="truncate text-xs font-semibold text-ink-600 dark:text-ink-200">{v.teacher} · {v.durationMin} min</div>
                        {pct > 0 ? <ProgressBar value={pct} className="mt-2 h-1.5"/> : null}
                      </div>
                      <motion.div className="grid h-11 w-11 place-items-center rounded-2xl byjus-gradient text-white shadow-glow" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <PlayCircle className="h-5 w-5"/>
                      </motion.div>
                    </div>
                  </Link>
                  </motion.div>);
            })}
              </motion.div>) : (<div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-ink-600 dark:text-ink-200">
                Start a course from <span className="font-extrabold text-ink-900 dark:text-ink-50">My Courses</span> to see continue-watching here.
              </div>)}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Recommended next</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Based on your learning activity</div>
            </div>
            <Badge className="bg-white/10 border-white/10 text-ink-200">
              <Wand2 className="h-3.5 w-3.5"/>
              Smart
            </Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {coursesLoading ? (<>
                <Skeleton className="h-14 w-full"/>
                <Skeleton className="h-14 w-full"/>
                <Skeleton className="h-14 w-full"/>
              </>) : (recommendedCourses.map((c) => {
            const busy = action?.courseId === c.id && action.type === "watch";
            return (<button key={c.id} type="button" className="w-full text-left focus-ring rounded-2xl" onClick={() => runCourse(c.id, "watch")} disabled={Boolean(action) && !busy}>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-soft transition hover:bg-white/10">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <ThumbImage src={c.thumbnail_url}/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">{c.title}</div>
                        <div className="truncate text-xs font-semibold text-ink-600 dark:text-ink-200">
                          {c.subject.toUpperCase()}
                        </div>
                      </div>
                      <Badge className="bg-white/10 border-white/10 text-ink-200">{busy ? "..." : "Go"}</Badge>
                    </div>
                  </button>);
        }))}
          </div>
        </Card>
      </motion.div>

      {recentlyViewed.length ? (<Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Recently viewed</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Quickly jump back in</div>
            </div>
            <Link to="/app/recorded-classes" className="text-sm font-bold text-byjus-300 hover:underline">
              Browse
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recentlyViewed.map((v) => {
                const thumb = getYouTubeThumbnail(v.url, "mq");
                return (<Link key={v.id} to={`/app/videos/${v.id}`} className="focus-ring rounded-3xl">
                  <Card interactive className="p-4 group">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <div className="relative w-full pt-[56.25%]">
                        <ThumbImage src={thumb} className="absolute inset-0 h-full w-full object-cover" fallbackClassName="absolute inset-0 bg-gradient-to-br from-byjus-800/50 to-ink-950/50"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent opacity-90"/>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="truncate text-sm font-extrabold text-white">{v.title}</div>
                          <div className="truncate text-xs font-semibold text-white/80">{v.teacher}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button className="h-10 w-full rounded-2xl">
                        <PlayCircle className="h-4 w-4"/>
                        Open
                      </Button>
                    </div>
                  </Card>
                </Link>);
            })}
          </div>
        </Card>) : null}

      <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Top courses</div>
            <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Quick revision + quiz</div>
          </div>
          <Link to="/app/subjects" className="text-sm font-bold text-byjus-300 hover:underline">Open subjects</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {coursesLoading ? (Array.from({ length: 3 }).map((_, i) => (<div key={`top_sk_${i}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft">
                <Skeleton className="h-4 w-2/3"/><Skeleton className="mt-3 h-3 w-1/2"/>
                <Skeleton className="mt-4 h-2.5 w-full"/>
                <div className="mt-3 grid grid-cols-2 gap-2"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>
              </div>))) : (topCourses.map((c, i) => {
            const watchBusy = action?.courseId === c.id && action.type === "watch";
            const quizBusy = action?.courseId === c.id && action.type === "quiz";
            return (<motion.div key={c.id} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6, ease: "easeInOut" }} whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(124,58,237,0.5)" }} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">{c.title}</div>
                      <div className="mt-1 text-xs font-semibold text-ink-600 dark:text-ink-200">{c.subject.toUpperCase()}</div>
                    </div>
                    <Badge className="bg-white/10 border-white/10 text-ink-200">New</Badge>
                  </div>
                  <ProgressBar value={courseProgress[c.id] ?? 0} className="mt-3"/>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="secondary" className="h-10 w-full rounded-2xl" onClick={() => runCourse(c.id, "watch")} disabled={Boolean(action) && !watchBusy}>
                      {watchBusy ? "..." : "Watch"}
                    </Button>
                    <Button className="h-10 w-full rounded-2xl" onClick={() => runCourse(c.id, "quiz")} disabled={Boolean(action) && !quizBusy}>
                      {quizBusy ? "..." : "Quiz"}
                    </Button>
                  </div>
                </motion.div>);
        }))}
        </div>
      </Card>
      </motion.div>
    </div>);
}
