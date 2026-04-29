import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player/lazy";
import type { OnProgressProps } from "react-player/base";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ExternalLink, FileText, Play, Search, Upload, UserRound, Video, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { ApiError, api, apiSubjectToKey, type ApiDemoClassPublic, type ApiUploadPublic } from "@/lib/api";
import { subjects } from "@/data/mockData";
import { useAuth } from "@/auth/AuthContext";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDurationMin(min: number) {
  const safe = Math.max(0, Math.floor(Number(min) || 0));
  if (!safe) return "";
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function subjectGradient(subject: ApiDemoClassPublic["subject"]) {
  const key = apiSubjectToKey(subject);
  return subjects.find((s) => s.id === key)?.gradient ?? "from-byjus-700 via-byjus-600 to-indigo-500";
}

function ClassCard({
  item,
  busy,
  onJoin,
}: {
  item: ApiDemoClassPublic;
  busy: boolean;
  onJoin: (item: ApiDemoClassPublic) => void;
}) {
  const gradient = subjectGradient(item.subject);

  return (
    <Card interactive className="p-4 group overflow-hidden">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 shadow-soft",
          "bg-gradient-to-br",
          gradient,
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent opacity-95" />
        <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,.18),transparent_55%)]" />

        <div className="relative p-5">
          <div className="flex items-center justify-between gap-2">
            <Badge className="bg-white/10 border-white/15 text-white">{item.subject.toUpperCase()}</Badge>
            <Badge className="bg-white/10 border-white/15 text-white/90">{formatDurationMin(item.duration_min)}</Badge>
          </div>

          <div className="mt-4">
            <div className="text-xl font-extrabold text-white leading-snug line-clamp-2">{item.title}</div>
            <div className="mt-2 text-sm font-semibold text-white/80">{item.instructor}</div>
          </div>
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-red-600/90 border border-white/15 shadow-glow grid place-items-center transition group-hover:scale-110 group-hover:shadow-neon" />
            <div className="absolute inset-0 grid place-items-center">
              <Play className="h-7 w-7 text-white fill-white translate-x-[1px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <Button className="h-11 rounded-2xl" onClick={() => onJoin(item)} disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {busy ? "Checking access..." : "Watch video"}
        </Button>

        <div className="flex items-center justify-between text-xs font-semibold text-ink-500 dark:text-ink-300">
          <span>Secure player • Watermarked</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> 2s check
          </span>
        </div>
      </div>
    </Card>
  );
}

function VideoModal({
  open,
  item,
  youtubeId,
  onClose,
}: {
  open: boolean;
  item: ApiDemoClassPublic | null;
  youtubeId: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const { user, signOut } = useAuth();

  const playerRef = useRef<ReactPlayer | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [completed, setCompleted] = useState(false);
  const lastKnownSecondsRef = useRef(0);
  const didInitialSeekRef = useRef(false);
  const lastCommitRef = useRef(0);
  const lastServerCommitRef = useRef(0);
  const serverInFlightRef = useRef(false);

  const safeResumeSeconds = useMemo(() => {
    const seconds = resumeSeconds ?? 0;
    const approxDuration = durationSeconds ?? Math.max(0, (item?.duration_min ?? 0) * 60);
    if (!Number.isFinite(approxDuration) || approxDuration <= 0) return 0;
    return Math.max(0, Math.min(seconds, Math.max(0, approxDuration - 5)));
  }, [durationSeconds, item?.duration_min, resumeSeconds]);

  useEffect(() => {
    if (!open) {
      setReady(false);
      setDurationSeconds(null);
      setResumeSeconds(0);
      setCompleted(false);
      lastKnownSecondsRef.current = 0;
      didInitialSeekRef.current = false;
      lastCommitRef.current = 0;
      lastServerCommitRef.current = 0;
      serverInFlightRef.current = false;
      return;
    }
    setReady(false);
    setPlayerKey(0);
    setDurationSeconds(null);
    setResumeSeconds(0);
    setCompleted(false);
    lastKnownSecondsRef.current = 0;
    didInitialSeekRef.current = false;
    lastCommitRef.current = 0;
    lastServerCommitRef.current = 0;
    serverInFlightRef.current = false;
  }, [open, youtubeId]);

  // Load progress from server (DB-backed) for resume support across devices.
  useEffect(() => {
    if (!open || !item?.id) return;

    let cancelled = false;
    (async () => {
      try {
        const p = await api.demo.progress.get(item.id);
        if (cancelled) return;
        setCompleted(Boolean(p.completed));
        if (p.completed) {
          setResumeSeconds(0);
          lastKnownSecondsRef.current = 0;
          return;
        }
        const s = p.watched_seconds ?? 0;
        setResumeSeconds(s);
        lastKnownSecondsRef.current = s;
      } catch (err: any) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          navigate("/login", { replace: true, state: { from: location.pathname } });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item?.id, location.pathname, navigate, open, signOut]);

  const commitProgressToServer = useCallback(
    async (seconds: number, nextCompleted: boolean, opts?: { force?: boolean }) => {
      if (!item?.id) return;
      if (completed && !nextCompleted) return;

      const now = Date.now();
      const safeSeconds = Math.max(0, Math.round(seconds));
      const force = Boolean(opts?.force) || nextCompleted;

      if (!force && now - lastServerCommitRef.current < 4500) return;
      if (serverInFlightRef.current) return;

      serverInFlightRef.current = true;
      lastServerCommitRef.current = now;
      try {
        await api.demo.progress.update(item.id, { watched_seconds: safeSeconds, completed: nextCompleted });
        if (nextCompleted) setCompleted(true);
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          navigate("/login", { replace: true, state: { from: location.pathname } });
        }
      } finally {
        serverInFlightRef.current = false;
      }
    },
    [completed, item?.id, location.pathname, navigate, signOut],
  );

  const requestClose = useCallback(() => {
    void commitProgressToServer(lastKnownSecondsRef.current, false, { force: true });
    onClose();
  }, [commitProgressToServer, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  const safeUrl = useMemo(() => {
    if (!youtubeId) return null;
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  }, [youtubeId]);

  // Seek once after server progress loads (can arrive after onReady).
  useEffect(() => {
    if (!open) return;
    if (!ready) return;
    if (didInitialSeekRef.current) return;
    if (!safeResumeSeconds || safeResumeSeconds < 5) return;
    try {
      playerRef.current?.seekTo(safeResumeSeconds, "seconds");
      didInitialSeekRef.current = true;
    } catch {
      // ignore
    }
  }, [open, playerKey, ready, safeResumeSeconds]);

  const subjectKey = useMemo(() => (item ? apiSubjectToKey(item.subject) : "physics"), [item]);

  return (
    <AnimatePresence>
      {open && item && safeUrl ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-3 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
            onClick={requestClose}
            aria-label="Close video"
          />

          <motion.div
            className="relative w-full max-w-6xl"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, bounce: 0.18 }}
          >
            <Card className="p-4 md:p-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-byjus-900/25 via-ink-950/25 to-ink-950/55" />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge className="bg-white/10 border-white/10 text-ink-200">{item.subject.toUpperCase()}</Badge>
                  <div className="mt-3 truncate text-xl md:text-2xl font-extrabold text-ink-900 dark:text-ink-50">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">{item.instructor}</div>
                </div>

                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition hover:bg-white/15 focus-ring"
                  onClick={requestClose}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
                <div
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-950 shadow-soft"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="relative w-full pt-[56.25%]">
                    <div className="absolute inset-0">
                      <ReactPlayer
                        ref={(p) => {
                          playerRef.current = p;
                        }}
                        key={`${youtubeId}_${playerKey}`}
                        url={safeUrl}
                        playing
                        controls
                        width="100%"
                        height="100%"
                        onReady={() => setReady(true)}
                        onDuration={(d) => {
                          if (!Number.isFinite(d)) return;
                          setDurationSeconds(d);
                        }}
                        onProgress={(state: OnProgressProps) => {
                          const now = Date.now();
                          if (now - lastCommitRef.current < 1500) return;
                          lastCommitRef.current = now;
                          const seconds = state.playedSeconds ?? 0;
                          lastKnownSecondsRef.current = seconds;
                          void commitProgressToServer(seconds, false);
                        }}
                        onPause={() => {
                          void commitProgressToServer(lastKnownSecondsRef.current, false, { force: true });
                        }}
                        onEnded={() => {
                          void commitProgressToServer(durationSeconds ?? lastKnownSecondsRef.current, true, { force: true });
                        }}
                        config={{
                          youtube: {
                            playerVars: {
                              autoplay: 1,
                              modestbranding: 1,
                              rel: 0,
                              playsinline: 1,
                            },
                          },
                        }}
                      />
                    </div>

                    {!ready ? (
                      <div className="absolute inset-0">
                        <Skeleton className="h-full w-full rounded-none" />
                        <div className="absolute inset-0 grid place-items-center">
                          <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 shadow-soft backdrop-blur">
                            <div className="flex items-center gap-3">
                              <Spinner className="h-5 w-5" />
                              <div className="text-sm font-extrabold text-ink-50">Loading player...</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-3 right-3 rounded-2xl border border-white/10 bg-ink-950/50 px-3 py-2 text-xs font-extrabold text-white/90 shadow-soft backdrop-blur">
                        User: {user?.email ?? "demo@neet.com"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                    <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Session details</div>
                    <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
                      Recorded class player with watermark overlay and right-click protection (basic).
                    </div>
                    <div className="mt-4 grid gap-2 text-xs font-semibold text-ink-500 dark:text-ink-300">
                      <div className="flex items-center justify-between">
                        <span>Duration</span>
                        <span className="text-ink-700 dark:text-ink-100">{formatDurationMin(item.duration_min)}</span>
                      </div>
                      {safeResumeSeconds >= 10 && !completed ? (
                        <div className="flex items-center justify-between">
                          <span>Resume</span>
                          <span className="text-ink-700 dark:text-ink-100">{Math.floor(safeResumeSeconds / 60)}:{String(Math.floor(safeResumeSeconds % 60)).padStart(2, "0")}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span>Provider</span>
                        <span className="text-ink-700 dark:text-ink-100">YouTube embed</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                    <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Next actions</div>
                    <div className="mt-3 grid gap-2">
                      <Link to={`/app/subjects/${subjectKey}/chapters`} onClick={requestClose}>
                        <Button variant="secondary" className="h-11 w-full rounded-2xl">
                          View chapters
                        </Button>
                      </Link>
                      <Link to={`/app/quizzes?subject=${subjectKey}`} onClick={requestClose}>
                        <Button variant="secondary" className="h-11 w-full rounded-2xl">
                          Practice quizzes
                        </Button>
                      </Link>
                      <Button
                        className="h-11 rounded-2xl"
                        onClick={() => {
                          setReady(false);
                          setPlayerKey((k) => k + 1);
                        }}
                      >
                        <Play className="h-4 w-4" /> Replay
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function RecordedClassesScreen() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState<string>("all");

  const [demoClasses, setDemoClasses] = useState<ApiDemoClassPublic[]>([]);
  const [demoLoading, setDemoLoading] = useState(true);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Teacher-uploaded resources
  const [teacherResources, setTeacherResources] = useState<ApiUploadPublic[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [active, setActive] = useState<{ item: ApiDemoClassPublic; youtubeId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDemoLoading(true);
    setDemoError(null);

    (async () => {
      try {
        const list = await api.demo.classes();
        if (cancelled) return;
        setDemoClasses(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.error(err);
        if (cancelled) return;
        setDemoClasses([]);
        setDemoError("Unable to load video library. Start FastAPI backend and retry.");
      } finally {
        if (!cancelled) setDemoLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Load teacher-uploaded resources
  useEffect(() => {
    setResourcesLoading(true);
    api.uploads.list({ limit: 100 })
      .then((page) => setTeacherResources(page.items ?? []))
      .catch(() => setTeacherResources([]))
      .finally(() => setResourcesLoading(false));
  }, []);

  const recorded = useMemo(() => demoClasses.filter((c) => c.type === "recorded"), [demoClasses]);

  const tabs = useMemo(
    () => [{ id: "all", label: "All" }, ...subjects.map((s) => ({ id: s.id, label: s.name }))],
    [],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return recorded.filter((c) => {
      const key = apiSubjectToKey(c.subject);
      if (subjectId !== "all" && key !== subjectId) return false;
      if (!query) return true;
      return `${c.title} ${c.instructor}`.toLowerCase().includes(query);
    });
  }, [q, recorded, subjectId]);

  // Filter teacher resources by active subject tab
  const filteredResources = useMemo(() => {
    return teacherResources.filter((r) => {
      if (subjectId === "all") return true;
      return apiSubjectToKey(r.subject) === subjectId;
    });
  }, [teacherResources, subjectId]);

  const joinClass = async (item: ApiDemoClassPublic) => {
    if (joiningId) return;
    setJoiningId(item.id);
    setDemoError(null);
    setActive(null);

    await sleep(2000);

    try {
      const res = await api.demo.checkAccess({ class_id: item.id });
      if (res?.access && res?.video?.youtube_id) {
        setActive({ item, youtubeId: res.video.youtube_id });
        return;
      }
      setDemoError("Video not available right now.");
    } catch (err: any) {
      console.error(err);
      if (err instanceof ApiError && err.status === 401) {
        signOut();
        navigate("/login", { replace: true, state: { from: location.pathname } });
        return;
      }
      setDemoError(err?.message ?? "Access check failed.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Reveal>
        <Card className="p-5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-byjus-900/25 via-ink-950/15 to-ink-950/45" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                <Play className="h-3.5 w-3.5" />
                Recorded classes
              </Badge>
              <div className="mt-3 text-2xl font-extrabold text-ink-900 dark:text-ink-50">Watch by subject</div>
              <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
                Pick a subject, click Watch, and the player opens inside the app (no external links).
              </div>
            </div>

            <div className="shrink-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="text-xs font-extrabold text-ink-500 dark:text-ink-300">Logged in</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-extrabold text-ink-900 dark:text-ink-50">
                <span className="grid h-8 w-8 place-items-center rounded-2xl border border-white/10 bg-white/10">
                  <UserRound className="h-4 w-4 text-byjus-400" />
                </span>
                {user?.email ?? "student@demo.com"}
              </div>
            </div>
          </div>

          <div className="relative mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <div className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 shadow-soft">
                {tabs.map((t) => {
                  const activeTab = t.id === subjectId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSubjectId(t.id)}
                      className={cn(
                        "relative h-10 whitespace-nowrap rounded-2xl px-4 text-sm font-extrabold transition focus-ring",
                        activeTab ? "text-ink-50" : "text-ink-200 hover:text-ink-50",
                      )}
                    >
                      {activeTab ? (
                        <motion.span layoutId="rec_tab" className="absolute inset-0 rounded-2xl byjus-gradient opacity-90" />
                      ) : null}
                      <span className="relative">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos..." className="pl-9" />
            </div>
          </div>
        </Card>
      </Reveal>

      {demoError ? (
        <Card className="p-4 border border-red-400/30 bg-red-500/10">
          <div className="text-sm font-extrabold text-red-700 dark:text-red-100">{demoError}</div>
        </Card>
      ) : null}

      <Reveal delay={0.05}>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Video library</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                {demoLoading ? "Loading..." : `${filtered.length} videos`}
              </div>
            </div>
            <Badge className="bg-white/10 border-white/10 text-ink-200">{demoLoading ? "..." : filtered.length}</Badge>
          </div>

          <motion.div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3" variants={staggerContainer} initial="hidden" animate="show">
            {demoLoading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <motion.div key={`sk_rec_${i}`} variants={staggerItem}>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                    <Skeleton className="h-40 w-full rounded-3xl" />
                    <Skeleton className="mt-4 h-4 w-2/3" />
                    <Skeleton className="mt-3 h-3 w-1/2" />
                    <Skeleton className="mt-4 h-11 w-full rounded-2xl" />
                  </div>
                </motion.div>
              ))
            ) : filtered.length ? (
              filtered.map((item) => (
                <motion.div key={item.id} variants={staggerItem}>
                  <ClassCard item={item} busy={joiningId === item.id} onJoin={joinClass} />
                </motion.div>
              ))
            ) : (
              <motion.div variants={staggerItem} className="md:col-span-2 xl:col-span-3">
                <Card className="p-6 text-center">
                  <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">No videos found</div>
                  <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
                    Try a different subject or search term.
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </Card>
      </Reveal>

      {/* Teacher-uploaded resources */}
      {(resourcesLoading || filteredResources.length > 0) && (
        <Reveal delay={0.1}>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-byjus-400" />
                  <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
                    Teacher Resources
                  </div>
                </div>
                <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                  Notes and videos uploaded by your teachers
                </div>
              </div>
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                {resourcesLoading ? "…" : filteredResources.length}
              </Badge>
            </div>

            {resourcesLoading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <motion.div
                className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {filteredResources.map((r) => (
                  <motion.div key={r.id} variants={staggerItem}>
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-soft transition hover:bg-white/10 focus-ring group"
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center ${
                        r.file_type === "video" ? "bg-byjus-600/30" : "bg-amber-500/20"
                      }`}>
                        {r.file_type === "video"
                          ? <Video className="h-4 w-4 text-byjus-400" />
                          : <FileText className="h-4 w-4 text-amber-400" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50 group-hover:text-byjus-300 transition">
                          {r.title}
                        </div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">
                          {r.subject} · {r.file_type.toUpperCase()}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-ink-400 shrink-0 group-hover:text-byjus-400 transition" />
                    </a>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>
        </Reveal>
      )}

      <VideoModal
        open={Boolean(active)}
        item={active?.item ?? null}
        youtubeId={active?.youtubeId ?? null}
        onClose={() => setActive(null)}
      />
    </motion.div>
  );
}
