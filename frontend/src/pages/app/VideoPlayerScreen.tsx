import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Lock, NotebookPen, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Reveal } from "@/components/motion/Reveal";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { type NoteItem, starterNotes, type Video as UiVideo } from "@/data/mockData";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useAppStore } from "@/state/useAppStore";
import { ApiError, api, apiSubjectToKey, type ApiCoursePublic, type ApiLessonPublic } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/auth/AuthContext";

function toUiVideo(lesson: ApiLessonPublic, course: ApiCoursePublic): UiVideo {
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

export function VideoPlayerScreen() {
  const { videoId = "" } = useParams();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<ApiLessonPublic | null>(null);
  const [course, setCourse] = useState<ApiCoursePublic | null>(null);
  const [playlistLessons, setPlaylistLessons] = useState<ApiLessonPublic[]>([]);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [playYouTubeId, setPlayYouTubeId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [notes, setNotes] = useLocalStorageState<NoteItem[]>("neet_notes_v1", starterNotes);
  const isBookmarked = useAppStore((s) => Boolean(s.videoBookmarks[videoId]));

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLesson(null);
    setCourse(null);
    setPlaylistLessons([]);
    setAccessLoading(true);
    setAccessAllowed(null);
    setPlayYouTubeId(null);
    setAccessError(null);

    (async () => {
      try {
        const l = await api.lessons.get(videoId);
        if (cancelled) return;
        setLesson(l);
        // Ensure progress summaries include this course even if user opened the lesson directly.
        await api.courses.enroll(l.course_id).catch(() => undefined);
        const c = await api.courses.details(l.course_id);
        if (cancelled) return;
        setCourse(c);
        const list = await api.lessons.byCourse(l.course_id, { limit: 100, offset: 0 });
        if (cancelled) return;
        setPlaylistLessons(list.items ?? []);

        // Secure video access (paid simulation): backend returns YouTube ID only if allowed.
        setAccessLoading(true);
        try {
          const res = await api.lessons.play(videoId);
          if (cancelled) return;
          if (res?.access && res?.video?.youtube_id) {
            setAccessAllowed(true);
            setPlayYouTubeId(res.video.youtube_id);
          } else {
            setAccessAllowed(false);
            setPlayYouTubeId(null);
          }
        } catch (err: any) {
          if (cancelled) return;
          if (err instanceof ApiError && err.status === 401) {
            signOut();
            navigate("/login", { replace: true, state: { from: location.pathname } });
            return;
          }
          setAccessAllowed(false);
          setPlayYouTubeId(null);
          setAccessError(err?.message ?? "Access check failed.");
        } finally {
          if (!cancelled) setAccessLoading(false);
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          navigate("/login", { replace: true, state: { from: location.pathname } });
          return;
        }
        setError(err?.message ?? "Failed to load video.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const video = useMemo(() => {
    if (!lesson || !course) return null;
    const yid = playYouTubeId ?? lesson.youtube_id ?? null;
    return toUiVideo({ ...lesson, youtube_id: yid }, course);
  }, [course, lesson, playYouTubeId]);

  const playlist = useMemo(() => {
    if (!course) return [];
    const sorted = [...playlistLessons].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    return sorted.map((l) => toUiVideo(l, course));
  }, [course, playlistLessons]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="mt-4 h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-1/2" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border border-red-400/30 bg-red-500/10">
        <div className="text-lg font-extrabold text-red-700 dark:text-red-100">Unable to load video</div>
        <div className="mt-2 text-sm font-semibold text-red-700/80 dark:text-red-100/80">{error}</div>
        <div className="mt-4">
          <Link to="/app/recorded-classes">
            <Button variant="secondary">
              <ChevronLeft className="h-4 w-4" /> Back to courses
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!video) {
    return (
      <Card className="p-6">
        <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Video not found</div>
        <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">Try opening from My Courses.</div>
        <div className="mt-4">
          <Link to="/app/recorded-classes">
            <Button variant="secondary">My Courses</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Reveal>
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/app/recorded-classes"
                className="inline-flex items-center gap-1 text-sm font-bold text-byjus-300 hover:underline"
              >
                <ChevronLeft className="h-4 w-4" /> My Courses
              </Link>
              <div className="mt-2 truncate text-lg font-extrabold text-ink-900 dark:text-ink-50">{video.title}</div>
              <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
                {video.teacher} • {video.durationMin} min
              </div>
            </div>
            <Badge
              className={
                isBookmarked
                  ? "bg-byjus-600/15 border-byjus-400/30 text-byjus-100"
                  : "bg-white/10 border-white/10 text-ink-200"
              }
            >
              {isBookmarked ? "Bookmarked" : "Not bookmarked"}
            </Badge>
          </div>
        </Card>
      </Reveal>

      {accessLoading ? (
        <Card className="p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-56 w-full rounded-3xl" />
          <Skeleton className="mt-4 h-4 w-2/3" />
        </Card>
      ) : accessAllowed ? (
        // Video section — from uploaded code: scale 0.8 → 1 whileInView
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <VideoPlayer video={video} playlist={playlist} />
        </motion.div>
      ) : (
        <Card className="p-5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-byjus-900/30 via-ink-950/20 to-ink-950/50" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <Badge className="bg-red-600/15 border-red-400/30 text-red-200">
                <Lock className="h-3.5 w-3.5" />
                Access required
              </Badge>
              <div className="mt-3 text-2xl font-extrabold text-ink-900 dark:text-ink-50">Unable to play this lesson</div>
              <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
                {accessError ? accessError : "Video is not available right now. Please retry."}
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <Button
                className="h-11 rounded-2xl"
                onClick={async () => {
                  setAccessError(null);
                  try {
                    setAccessLoading(true);
                    const res = await api.lessons.play(videoId);
                    if (res?.access && res?.video?.youtube_id) {
                      setAccessAllowed(true);
                      setPlayYouTubeId(res.video.youtube_id);
                      setAccessError(null);
                    } else {
                      setAccessAllowed(false);
                      setPlayYouTubeId(null);
                    }
                  } catch (err: any) {
                    if (err instanceof ApiError && err.status === 401) {
                      signOut();
                      navigate("/login", { replace: true, state: { from: location.pathname } });
                      return;
                    }
                    setAccessAllowed(false);
                    setPlayYouTubeId(null);
                    setAccessError(err?.message ?? "Retry failed.");
                  } finally {
                    setAccessLoading(false);
                  }
                }}
                disabled={accessLoading}
              >
                Retry
              </Button>
              <Link to="/app/recorded-classes">
                <Button variant="secondary" className="h-11 rounded-2xl w-full">
                  Back to courses
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Reveal>
          <Card className="p-4 md:p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-ink-900 dark:text-ink-50">
              <NotebookPen className="h-5 w-5 text-byjus-400" />
              Quick note
            </div>
            <div className="mt-3 space-y-2">
              <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Title" />
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Write a short note..."
                className="w-full min-h-[140px] rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-ink-100 shadow-soft focus-ring placeholder:text-ink-400"
              />
              <Button
                variant="secondary"
                className="h-10 w-full rounded-2xl"
                onClick={() => {
                  if (!noteTitle.trim() && !noteBody.trim()) return;
                  setNotes((prev) => [
                    {
                      id: `note_${Date.now()}`,
                      title: noteTitle.trim() || "Untitled note",
                      body: noteBody.trim(),
                      updatedAt: "Just now",
                    },
                    ...prev,
                  ]);
                  setNoteTitle("");
                  setNoteBody("");
                }}
              >
                Save note
              </Button>
            </div>
          </Card>
        </Reveal>

        <div className="space-y-4">
          <Reveal delay={0.05}>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Saved notes</div>
                  <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Keep formulas and tricks handy.</div>
                </div>
                <Badge className="bg-white/10 border-white/10 text-ink-200">{notes.length}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {notes.slice(0, 4).map((n) => (
                  <div key={n.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">{n.title}</div>
                        <div className="mt-1 text-xs font-semibold text-ink-500 dark:text-ink-300">{n.updatedAt}</div>
                      </div>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition hover:bg-white/15 focus-ring"
                        onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                        aria-label="Delete note"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-ink-700 line-clamp-3 dark:text-ink-200">{n.body}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link to="/app/notes">
                  <Button variant="secondary" className="h-10 w-full rounded-2xl">
                    Open Notes
                  </Button>
                </Link>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card className="p-5">
              <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Bookmarks</div>
              <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
                Quickly jump back to important content.
              </div>
              <div className="mt-4">
                <Link to="/app/bookmarks">
                  <Button variant="secondary" className="h-10 w-full rounded-2xl">
                    Open Bookmarks
                  </Button>
                </Link>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
