import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player/lazy";
import { MessageCircle, Radio, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError, api, type ApiDemoClassPublic } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseIsoMs(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function formatHms(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LiveClassScreen() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [liveClass, setLiveClass] = useState<ApiDemoClassPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await api.demo.classes();
        if (cancelled) return;
        setLiveClass((list ?? []).find((c) => c.type === "live") ?? null);
      } catch (err: any) {
        if (cancelled) return;
        setLiveClass(null);
        setError("Unable to load live class. Start FastAPI backend and retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const statusLine = useMemo(() => {
    if (!liveClass) return null;
    const start = parseIsoMs(liveClass.starts_at);
    const end = parseIsoMs(liveClass.ends_at);
    const isLive = start != null && nowMs >= start && (end == null || nowMs <= end);
    const startsIn = start != null && nowMs < start ? start - nowMs : null;
    const endsIn = end != null && isLive ? end - nowMs : null;
    if (isLive) return `LIVE now • Ends in ${endsIn != null ? formatHms(endsIn) : "--:--"}`;
    if (startsIn != null) return `Starts in ${formatHms(startsIn)}`;
    return "Live session";
  }, [liveClass, nowMs]);

  const joinLive = async () => {
    if (!liveClass || joining) return;
    setJoining(true);
    setError(null);
    await sleep(2000);
    try {
      const res = await api.demo.checkAccess({ class_id: liveClass.id });
      if (res?.access && res?.video?.youtube_id) {
        setYoutubeId(res.video.youtube_id);
        return;
      }
      setError("Live stream not available right now.");
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        signOut();
        navigate("/login", { replace: true, state: { from: location.pathname } });
        return;
      }
      setError(err?.message ?? "Access check failed.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <Reveal>
        <Card className="p-5">
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge className="bg-white/10 border-white/10 text-ink-200">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <Radio className="h-3.5 w-3.5" />
                  Live
                </motion.span>
              </Badge>
              <div className="mt-3 text-2xl font-extrabold text-ink-900 dark:text-white">
                {loading ? <Skeleton className="h-8 w-64" /> : liveClass?.title ?? "Live class"}
              </div>
              <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-300">
                {loading ? <Skeleton className="h-4 w-72" /> : (
                  <>
                    {statusLine}
                    {liveClass?.duration_min ? ` • ${liveClass.duration_min} mins` : ""}
                    {liveClass?.instructor ? ` • Teacher: ${liveClass.instructor}` : ""}
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold text-ink-500 dark:text-ink-400">Enrolled</div>
              <div className="mt-1 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <Users className="h-4 w-4 text-ink-400 dark:text-ink-300" />
                <span className="text-sm font-extrabold text-ink-700 dark:text-ink-100">1,248</span>
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {/* ── Video Box — dark purple bg, ALL text pure white ── */}
          <div
            className="mt-5 overflow-hidden rounded-3xl"
            style={{
              background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1e1b4b 100%)",
              border: "1px solid rgba(139,92,246,0.4)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.1)",
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="relative w-full pt-[56.25%]">
              <div className="absolute inset-0">
                {youtubeId ? (
                  <ReactPlayer
                    url={`https://www.youtube.com/watch?v=${youtubeId}`}
                    playing controls width="100%" height="100%"
                    config={{ youtube: { playerVars: { autoplay: 1, modestbranding: 1, rel: 0, playsinline: 1 } } }}
                  />
                ) : (
                  /* ── Waiting screen — everything WHITE ── */
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    {/* LIVE pill */}
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold"
                      style={{
                        background: "rgba(239,68,68,0.2)",
                        border: "1px solid rgba(239,68,68,0.6)",
                        color: "#FFFFFF",
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full bg-red-500 animate-pulse"
                        style={{ boxShadow: "0 0 10px rgba(239,68,68,1)" }}
                      />
                      LIVE
                    </div>

                    {/* Main heading — pure white, large */}
                    <p
                      className="text-2xl font-extrabold"
                      style={{ color: "#FFFFFF", textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}
                    >
                      Join to start watching
                    </p>

                    {/* Sub text — white, clearly readable */}
                    <p
                      className="text-sm font-semibold max-w-xs"
                      style={{ color: "#FFFFFF", opacity: 0.9 }}
                    >
                      Video plays inside the app. If your session expired, you'll be asked to log in again.
                    </p>

                    {/* Animated purple dots */}
                    <div className="flex gap-2 mt-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full"
                          style={{ background: "#A78BFA" }}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.4, 0.8] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User watermark */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute top-3 right-3 rounded-xl px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    color: "#FFFFFF",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {user?.email ?? "demo@neet.com"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Buttons ── */}
          <div className="mt-6 flex flex-wrap gap-3">
            <motion.div
              animate={!youtubeId && !joining ? {
                boxShadow: ["0 0 0px rgba(139,92,246,0)", "0 0 20px rgba(139,92,246,0.6)", "0 0 0px rgba(139,92,246,0)"]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-2xl"
            >
              <Button className="h-11 rounded-2xl" onClick={() => void joinLive()} disabled={joining || loading || !liveClass}>
                {joining ? <Spinner className="h-4 w-4" /> : null}
                {youtubeId ? "Watching" : "Join Live"}
              </Button>
            </motion.div>
            <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => setYoutubeId(null)} disabled={!youtubeId}>
              <X className="h-4 w-4" /> Leave
            </Button>
          </div>
        </Card>
      </Reveal>

      {/* ── Live Chat ── */}
      <Reveal delay={0.05}>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-white">Live chat</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-300">Ask doubts while learning</div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center">
              <MessageCircle className="h-5 w-5 text-byjus-400" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-xs font-extrabold text-ink-600 dark:text-ink-300">Teacher</div>
              <div className="mt-1 text-sm font-semibold text-ink-700 dark:text-ink-200">Welcome! Drop your doubts here.</div>
            </div>
            <div className="rounded-2xl bg-byjus-600/15 border border-byjus-400/30 px-4 py-3">
              <div className="text-xs font-extrabold text-byjus-600 dark:text-byjus-200">You</div>
              <div className="mt-1 text-sm font-semibold text-ink-700 dark:text-byjus-100">Please explain capacitance quickly.</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-xs font-extrabold text-ink-600 dark:text-ink-300">Teacher</div>
              <div className="mt-1 text-sm font-semibold text-ink-700 dark:text-ink-200">
                Capacitance is the ability to store charge per unit potential difference: C = Q/V.
              </div>
            </div>
          </div>

          <div className="mt-4">
            <textarea
              className="w-full min-h-[110px] rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-ink-900 dark:text-ink-100 focus-ring placeholder:text-ink-400"
              placeholder="Type your doubt..."
            />
            <Button className="mt-3 h-10 w-full rounded-2xl">Send</Button>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
