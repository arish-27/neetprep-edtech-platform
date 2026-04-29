import { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player/lazy";
import type { OnProgressProps } from "react-player/base";
import {
  Bookmark,
  BookmarkCheck,
  FastForward,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Video } from "@/data/mockData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppStore } from "@/state/useAppStore";
import { getYouTubeThumbnail } from "@/lib/video";
import { ThumbImage } from "@/components/ui/ThumbImage";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function VideoPlayer({
  video,
  playlist,
  className,
  playlistHref,
}: {
  video: Video;
  playlist: Video[];
  className?: string;
  playlistHref?: (videoId: string) => string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hrefFor = useMemo(() => playlistHref ?? ((id: string) => `/app/videos/${id}`), [playlistHref]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<ReactPlayer | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const lastKnownSecondsRef = useRef(0);
  const didInitialSeekRef = useRef(false);

  const defaultPlaybackRate = useAppStore((s) => s.defaultPlaybackRate);
  const setDefaultPlaybackRate = useAppStore((s) => s.setDefaultPlaybackRate);
  const [rate, setRate] = useState(defaultPlaybackRate);

  const isBookmarked = useAppStore((s) => Boolean(s.videoBookmarks[video.id]));
  const toggleVideoBookmark = useAppStore((s) => s.toggleVideoBookmark);
  const touchRecentVideo = useAppStore((s) => s.touchRecentVideo);

  const progress = useAppStore((s) => s.videoProgress[video.id]);
  const setVideoProgress = useAppStore((s) => s.setVideoProgress);
  const clearVideoProgress = useAppStore((s) => s.clearVideoProgress);
  const allVideoProgress = useAppStore((s) => s.videoProgress);

  const nextVideoId = useMemo(() => {
    const idx = playlist.findIndex((v) => v.id === video.id);
    if (idx < 0) return null;
    return playlist[idx + 1]?.id ?? null;
  }, [playlist, video.id]);

  const prevVideoId = useMemo(() => {
    const idx = playlist.findIndex((v) => v.id === video.id);
    if (idx <= 0) return null;
    return playlist[idx - 1]?.id ?? null;
  }, [playlist, video.id]);

  useEffect(() => {
    setRate(defaultPlaybackRate);
  }, [defaultPlaybackRate, video.id]);

  useEffect(() => {
    setReady(false);
    setDurationSeconds(null);
    setPlaying(false);
    lastKnownSecondsRef.current = 0;
    didInitialSeekRef.current = false;
  }, [video.id]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Load progress from server (DB-backed) for resume support across devices.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api.lessons.progress.get(video.id);
        if (cancelled) return;
        if (p.completed) {
          clearVideoProgress(video.id);
          return;
        }
        lastKnownSecondsRef.current = p.watched_seconds ?? 0;
        setVideoProgress(video.id, {
          seconds: p.watched_seconds ?? 0,
          updatedAt: Date.now(),
        });
      } catch {
        // Ignore network / auth errors; local progress still works.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const el = wrapperRef.current;
      if (!el?.requestFullscreen) return;
      await el.requestFullscreen();
    } catch {
      // ignore
    }
  };

  // Throttle localStorage writes a bit.
  const lastCommitRef = useRef(0);
  const lastServerCommitRef = useRef(0);
  const serverInFlightRef = useRef(false);

  const commitProgressToServer = async (seconds: number, completed: boolean) => {
    const now = Date.now();
    const safeSeconds = Math.max(0, Math.round(seconds));
    // Server commits are more expensive; throttle harder unless completing.
    if (!completed && now - lastServerCommitRef.current < 4500) return;
    if (serverInFlightRef.current) return;
    serverInFlightRef.current = true;
    lastServerCommitRef.current = now;
    try {
      await api.lessons.progress.update(video.id, { watched_seconds: safeSeconds, completed });
    } catch {
      // ignore
    } finally {
      serverInFlightRef.current = false;
    }
  };

  const handleProgress = (state: OnProgressProps) => {
    const now = Date.now();
    if (now - lastCommitRef.current < 1500) return;
    lastCommitRef.current = now;

    const seconds = state.playedSeconds ?? 0;
    lastKnownSecondsRef.current = seconds;
    const approxDuration = durationSeconds ?? video.durationMin * 60;
    setVideoProgress(video.id, { seconds, durationSeconds: approxDuration, updatedAt: now });
    void commitProgressToServer(seconds, false);
  };

  const resumeSeconds = progress?.seconds ?? 0;
  const safeResumeSeconds = useMemo(() => {
    const approxDuration = durationSeconds ?? video.durationMin * 60;
    if (!Number.isFinite(approxDuration) || approxDuration <= 0) return 0;
    return clamp(resumeSeconds, 0, Math.max(0, approxDuration - 5));
  }, [durationSeconds, resumeSeconds, video.durationMin]);

  // Ensure we seek after server progress loads (can arrive after onReady).
  useEffect(() => {
    if (!ready) return;
    if (playing) return;
    if (didInitialSeekRef.current) return;
    const seekTo = safeResumeSeconds;
    if (!seekTo || seekTo < 5) return;
    try {
      playerRef.current?.seekTo(seekTo, "seconds");
      didInitialSeekRef.current = true;
    } catch {
      // ignore
    }
  }, [playing, ready, safeResumeSeconds, video.id]);

  const pct = useMemo(() => {
    const dur = (progress?.durationSeconds ?? durationSeconds ?? video.durationMin * 60) || video.durationMin * 60;
    if (!dur) return 0;
    return Math.round(((progress?.seconds ?? 0) / dur) * 100);
  }, [durationSeconds, progress?.durationSeconds, progress?.seconds, video.durationMin]);

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[1.65fr_.9fr]", className)}>
      <Card className="p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold text-ink-900 dark:text-ink-50">{video.title}</div>
            <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
              {video.teacher} · {video.durationMin} min
            </div>
            <div className="mt-2 text-sm font-semibold text-ink-700 dark:text-ink-200">{video.description}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/10 border-white/10 text-ink-200">
              <FastForward className="h-3.5 w-3.5" /> {rate}x
            </Badge>
            {pct > 0 ? <Badge className="bg-white/10 border-white/10 text-ink-200">{pct}% watched</Badge> : null}
            <Button
              variant={isBookmarked ? "secondary" : "primary"}
              className="h-11 rounded-2xl"
              onClick={() => toggleVideoBookmark(video.id)}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
          </div>
        </div>

        <div
          ref={wrapperRef}
          className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-soft"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="relative">
            {!ready ? (
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-950/70 to-byjus-900/30">
                <div className="h-14 w-14 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 animate-pulse" />
              </div>
            ) : null}

            <div className="relative w-full pt-[56.25%]">
              <ReactPlayer
                ref={(p) => {
                  playerRef.current = p;
                }}
                className="absolute inset-0"
                url={video.url}
                width="100%"
                height="100%"
                controls
                playing={playing}
                playbackRate={rate}
                onReady={() => {
                  setReady(true);
                }}
                onPlay={() => {
                  setPlaying(true);
                  touchRecentVideo(video.id);
                }}
                onPause={() => {
                  setPlaying(false);
                  void commitProgressToServer(lastKnownSecondsRef.current, false);
                }}
                onDuration={(d) => {
                  if (!Number.isFinite(d)) return;
                  setDurationSeconds(d);
                  setVideoProgress(video.id, {
                    seconds: progress?.seconds ?? 0,
                    durationSeconds: d,
                  });
                }}
                onProgress={handleProgress}
                onEnded={() => {
                  setPlaying(false);
                  clearVideoProgress(video.id);
                  void commitProgressToServer(durationSeconds ?? lastKnownSecondsRef.current, true);
                  if (nextVideoId) navigate(hrefFor(nextVideoId));
                }}
                config={{
                  youtube: { playerVars: { modestbranding: 1, rel: 0 } },
                }}
              />
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-3 right-3 rounded-2xl border border-white/10 bg-ink-950/50 px-3 py-2 text-xs font-extrabold text-white/90 shadow-soft backdrop-blur">
                User: {user?.email ?? "demo@neet.com"}
              </div>
              <div className="absolute bottom-3 left-3 rounded-2xl border border-white/10 bg-ink-950/50 px-3 py-2 text-xs font-extrabold text-white/75 shadow-soft backdrop-blur">
                Secure content
              </div>
            </div>

            <AnimatePresence>
              {!playing && ready ? (
                <motion.button
                  type="button"
                  className="absolute inset-0 grid place-items-center"
                  onClick={() => setPlaying(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  aria-label="Play video"
                >
                  <motion.div
                    className="grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-neon"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  >
                    <Play className="h-9 w-9 text-white" />
                  </motion.div>
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {pct > 0 ? <ProgressBar value={pct} className="mt-4 h-2.5" /> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="h-10 rounded-2xl"
              onClick={() => setPlaying((v) => !v)}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : "Play"}
            </Button>

            <Button
              variant="secondary"
              className="h-10 rounded-2xl"
              disabled={!prevVideoId}
              onClick={() => {
                if (!prevVideoId) return;
                navigate(hrefFor(prevVideoId));
              }}
            >
              <SkipBack className="h-4 w-4" />
              Prev
            </Button>

            <Button
              className="h-10 rounded-2xl"
              disabled={!nextVideoId}
              onClick={() => {
                if (!nextVideoId) return;
                navigate(hrefFor(nextVideoId));
              }}
            >
              Next <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-extrabold text-ink-600 dark:text-ink-200">Speed</div>
            <div className="flex items-center gap-1.5">
              {SPEEDS.map((s) => {
                const active = s === rate;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setRate(s);
                      setDefaultPlaybackRate(s);
                    }}
                    className={cn(
                      "h-9 rounded-2xl border px-3 text-xs font-extrabold shadow-soft transition focus-ring",
                      active
                        ? "border-byjus-300 bg-byjus-600 text-white"
                        : "border-white/10 bg-white/10 text-ink-200 hover:bg-white/15",
                    )}
                  >
                    {s}x
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition hover:bg-white/15 focus-ring"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {safeResumeSeconds >= 10 ? (
          <motion.div
            className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold text-ink-200">Continue watching</div>
                <div className="mt-1 text-sm font-semibold text-ink-200">
                  Resume from {formatTime(safeResumeSeconds)}
                </div>
              </div>
              <Button
                variant="secondary"
                className="h-10 rounded-2xl"
                onClick={() => setPlaying(true)}
              >
                Resume
              </Button>
            </div>
          </motion.div>
        ) : null}
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Playlist</div>
            <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Auto-next enabled</div>
          </div>
          <Badge className="bg-white/10 border-white/10 text-ink-200">{playlist.length}</Badge>
        </div>

        <div className="mt-4 space-y-2">
          {playlist.map((p) => {
            const active = p.id === video.id;
            const pProgress = allVideoProgress[p.id];
            const dur = (pProgress?.durationSeconds ?? p.durationMin * 60) || p.durationMin * 60;
            const ppct =
              pProgress?.seconds != null && dur > 0 ? Math.round((pProgress.seconds / dur) * 100) : 0;
            const thumb = getYouTubeThumbnail(p.url, "mq");

            return (
              <Link key={p.id} to={hrefFor(p.id)} className="focus-ring rounded-2xl block">
                <div
                  className={cn(
                    "rounded-2xl border border-white/10 bg-white/[0.03] shadow-soft transition hover:bg-white/[0.06]",
                    active ? "ring-1 ring-byjus-400/40 shadow-glow" : null,
                  )}
                >
                  <div className="flex gap-3 p-3">
                    <div className="h-14 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <ThumbImage src={thumb} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">
                        {p.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs font-semibold text-ink-600 dark:text-ink-200">
                        {p.durationMin} min · {p.teacher}
                      </div>
                      {ppct > 0 ? (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-500 dark:text-ink-300">
                            <span>{ppct}%</span>
                            <span>{pProgress?.seconds != null ? formatTime(pProgress.seconds) : null}</span>
                          </div>
                          <ProgressBar value={ppct} className="mt-1 h-1.5" />
                        </div>
                      ) : null}
                    </div>

                    <Badge className="bg-white/10 border-white/10 text-ink-200">{ppct}%</Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
