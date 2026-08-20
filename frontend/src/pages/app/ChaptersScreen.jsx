import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, PlayCircle, Tag, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BuyCourseButton } from "@/components/payment/BuyCourseButton";
import { getChaptersForSubject, getSubject, getVideosForChapter, } from "@/data/mockData";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { useAppStore } from "@/state/useAppStore";
import { useHydrated } from "@/state/useHydrated";
import { cn } from "@/lib/cn";
// ── Subject gradient map ──────────────────────────────────────────────────────
const SUBJECT_GRADIENTS = {
    physics: "from-violet-600 via-fuchsia-600 to-pink-500",
    chemistry: "from-blue-700 via-blue-600 to-indigo-500",
    biology: "from-emerald-600 via-teal-600 to-cyan-500",
};
// ── Local chapter card (mock data fallback) ───────────────────────────────────
function LocalChapterCard({ chapter, subjectId, progressPct, }) {
    const navigate = useNavigate();
    const videos = getVideosForChapter(chapter.id);
    const gradient = SUBJECT_GRADIENTS[subjectId] ?? "from-byjus-700 to-byjus-500";
    return (<Card interactive className="p-5 overflow-hidden">
      {/* Thin gradient accent bar */}
      <div className={`h-1 w-full rounded-full bg-gradient-to-r ${gradient} mb-4`}/>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold text-ink-900 dark:text-ink-50 truncate">
            {chapter.title}
          </div>
          {/* Topics */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chapter.topics.map((t) => (<span key={t} className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-ink-300">
                <Tag className="h-2.5 w-2.5"/>
                {t}
              </span>))}
          </div>
        </div>
        <Badge className="bg-white/10 border-white/10 text-ink-300 shrink-0">
          <Timer className="h-3.5 w-3.5"/>
          {videos.length} video{videos.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1.5">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <ProgressBar value={progressPct}/>
      </div>

      {/* Video list preview */}
      {videos.length > 0 && (<div className="mt-4 space-y-1.5">
          {videos.slice(0, 3).map((v, i) => (<button key={v.id} type="button" onClick={() => navigate(`/app/videos/${v.id}`)} className="w-full flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10 focus-ring group">
              <div className="h-6 w-6 shrink-0 rounded-lg bg-byjus-600/30 grid place-items-center">
                <PlayCircle className="h-3.5 w-3.5 text-byjus-400"/>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-ink-200 group-hover:text-ink-50 transition">
                  {v.title}
                </div>
                <div className="text-[10px] text-ink-500">{v.teacher} · {v.durationMin}m</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-ink-500 shrink-0 group-hover:text-byjus-400 transition"/>
            </button>))}
          {videos.length > 3 && (<div className="text-xs text-ink-500 dark:text-ink-400 pl-1">
              +{videos.length - 3} more video{videos.length - 3 !== 1 ? "s" : ""}
            </div>)}
        </div>)}

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="h-10 w-full rounded-2xl" onClick={() => navigate(`/app/videos/${chapter.nextVideoId}`)}>
          <PlayCircle className="h-4 w-4"/>
          Watch
        </Button>
        <Button className="h-10 w-full rounded-2xl" onClick={() => navigate(`/app/quizzes/${chapter.quizId}/attempt`)}>
          Start Quiz
        </Button>
      </div>
    </Card>);
}
// ── API course card ───────────────────────────────────────────────────────────
function ApiCourseCard({ course, progressPct, progressLoading, action, onAction, onPurchaseSuccess, }) {
    const isBusy = action?.courseId === course.id;
    const watchBusy = isBusy && action?.type === "watch";
    const quizBusy = isBusy && action?.type === "quiz";
    return (<Card interactive className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold text-ink-900 dark:text-ink-50">
            {course.title}
          </div>
          <div className="mt-1 text-sm font-semibold text-ink-600 line-clamp-2 dark:text-ink-200">
            {course.description || "NEET-focused lesson series with practice and PYQs."}
          </div>
        </div>
        <Badge className="bg-white/10 border-white/10 text-ink-200 shrink-0">
          <Timer className="h-3.5 w-3.5"/>
          Course
        </Badge>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1.5">
          <span>Progress</span>
          {progressLoading ? (<Skeleton className="h-3 w-8"/>) : (<span>{progressPct}%</span>)}
        </div>
        {progressLoading ? (<Skeleton className="h-2.5 w-full"/>) : (<ProgressBar value={progressPct}/>)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="h-10 w-full rounded-2xl" onClick={() => onAction(course.id, "watch")} disabled={Boolean(action) && !watchBusy}>
          <PlayCircle className="h-4 w-4"/>
          {watchBusy ? "Opening…" : "Watch"}
        </Button>
        <Button className="h-10 w-full rounded-2xl" onClick={() => onAction(course.id, "quiz")} disabled={Boolean(action) && !quizBusy}>
          {quizBusy ? "Loading…" : "Start Quiz"}
        </Button>
      </div>

      {/* Buy Course Button */}
      <div className="mt-3">
        <BuyCourseButton courseId={course.id} onSuccess={onPurchaseSuccess} className="h-10 w-full rounded-2xl"/>
      </div>
    </Card>);
}
// ── Main screen ───────────────────────────────────────────────────────────────
export function ChaptersScreen() {
    const navigate = useNavigate();
    const { subjectId = "" } = useParams();
    const subject = getSubject(subjectId);
    const apiSubject = subjectId;
    // Local mock chapters for this subject — always available
    const localChapters = useMemo(() => getChaptersForSubject(subjectId), [subjectId]);
    // API courses state
    const [apiLoading, setApiLoading] = useState(true);
    const [apiCourses, setApiCourses] = useState([]);
    const [apiError, setApiError] = useState(null);
    const [action, setAction] = useState(null);
    // Course progress from API
    const [courseProgress, setCourseProgress] = useState({});
    const [progressLoading, setProgressLoading] = useState(true);
    // Local video progress from Zustand (for mock chapters)
    const hasHydrated = useHydrated();
    const videoProgress = useAppStore((s) => s.videoProgress);
    useEffect(() => {
        if (!subject)
            return;
        setApiLoading(true);
        setApiError(null);
        api.courses.list({ subject: apiSubject, limit: 50, offset: 0 })
            .then((page) => setApiCourses(page.items ?? []))
            .catch((err) => {
            setApiCourses([]);
            setApiError(err?.message ?? "Could not reach backend.");
        })
            .finally(() => setApiLoading(false));
    }, [apiSubject, subject?.id]);
    useEffect(() => {
        setProgressLoading(true);
        api.dashboard.courseProgress({ limit: 100, offset: 0 })
            .then((page) => {
            const next = {};
            for (const p of page.items ?? [])
                next[p.course_id] = p.progress_pct ?? 0;
            setCourseProgress(next);
        })
            .catch(() => setCourseProgress({}))
            .finally(() => setProgressLoading(false));
    }, []);
    // Compute local chapter progress from Zustand video progress
    const localChapterProgress = useMemo(() => {
        const result = {};
        for (const ch of localChapters) {
            const chVideos = getVideosForChapter(ch.id);
            if (!hasHydrated || chVideos.length === 0) {
                result[ch.id] = ch.progress; // use static value until hydrated
                continue;
            }
            const watched = chVideos.filter((v) => {
                const p = videoProgress[v.id];
                return p && p.seconds > 30;
            }).length;
            result[ch.id] = Math.round((watched / chVideos.length) * 100);
        }
        return result;
    }, [localChapters, videoProgress, hasHydrated]);
    const runCourse = async (courseId, mode) => {
        setApiError(null);
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
            setApiError(err?.message ?? "Action failed.");
        }
        finally {
            setAction(null);
        }
    };
    const handlePurchaseSuccess = () => {
        // Refresh course progress after purchase
        setProgressLoading(true);
        api.dashboard.courseProgress({ limit: 100, offset: 0 })
            .then((page) => {
            const next = {};
            for (const p of page.items ?? [])
                next[p.course_id] = p.progress_pct ?? 0;
            setCourseProgress(next);
        })
            .catch(() => setCourseProgress({}))
            .finally(() => setProgressLoading(false));
    };
    if (!subject) {
        return (<Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Subject not found</div>
        <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
          Please go back and choose a subject.
        </div>
        <div className="mt-4">
          <Link to="/app/subjects">
            <Button variant="secondary">
              <ChevronLeft className="h-4 w-4"/> Back to subjects
            </Button>
          </Link>
        </div>
      </Card>);
    }
    const gradient = SUBJECT_GRADIENTS[subjectId] ?? "from-byjus-700 to-byjus-500";
    // Decide what to show: API courses if available, otherwise local chapters
    const showApiCourses = !apiLoading && apiCourses.length > 0;
    const showLocalChapters = !showApiCourses; // always show local when API has nothing
    return (<div className="space-y-4">
      {/* Header */}
      <Reveal>
        <Card className="p-5 overflow-hidden">
          <div className={`h-1 w-full rounded-full bg-gradient-to-r ${gradient} mb-4`}/>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-br grid place-items-center text-white shrink-0", gradient)}>
                  <BookOpen className="h-4 w-4"/>
                </div>
                <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
                  {subject.name} — Chapters
                </div>
              </div>
              <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
                {showLocalChapters
            ? `${localChapters.length} chapters · Watch lessons, take quizzes, track progress`
            : `${apiCourses.length} course${apiCourses.length !== 1 ? "s" : ""} · Watch lessons, take quizzes, track progress`}
              </div>
            </div>
            <Link to="/app/subjects" className="text-sm font-bold text-byjus-300 hover:underline inline-flex items-center gap-1 shrink-0">
              <ChevronLeft className="h-4 w-4"/> All Subjects
            </Link>
          </div>
        </Card>
      </Reveal>

      {/* API error banner (non-blocking — local data still shows) */}
      {apiError && showLocalChapters && (<div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-300">
          Backend offline — showing local content. Connect your backend to sync live courses.
        </div>)}

      {/* Loading skeletons */}
      {apiLoading && (<motion.div className="grid gap-4 lg:grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
          {Array.from({ length: localChapters.length || 3 }).map((_, i) => (<motion.div key={`sk_${i}`} variants={staggerItem}>
              <Card className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3"/>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-lg"/>
                  <Skeleton className="h-5 w-20 rounded-lg"/>
                  <Skeleton className="h-5 w-14 rounded-lg"/>
                </div>
                <Skeleton className="h-2.5 w-full"/>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 w-full"/>
                  <Skeleton className="h-10 w-full"/>
                </div>
              </Card>
            </motion.div>))}
        </motion.div>)}

      {/* API courses */}
      {showApiCourses && (<motion.div className="grid gap-4 lg:grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
          {apiCourses.map((c) => (<motion.div key={c.id} variants={staggerItem}>
              <ApiCourseCard course={c} progressPct={courseProgress[c.id] ?? 0} progressLoading={progressLoading} action={action} onAction={runCourse} onPurchaseSuccess={handlePurchaseSuccess}/>
            </motion.div>))}
        </motion.div>)}

      {/* Local mock chapters (fallback) */}
      {showLocalChapters && !apiLoading && (<motion.div className="grid gap-4 lg:grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
          {localChapters.map((ch) => (<motion.div key={ch.id} variants={staggerItem}>
              <LocalChapterCard chapter={ch} subjectId={subjectId} progressPct={localChapterProgress[ch.id] ?? ch.progress}/>
            </motion.div>))}
        </motion.div>)}
    </div>);
}
