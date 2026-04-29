import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bookmark, FileQuestion, Loader2, Trash2, Video } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ThumbImage } from "@/components/ui/ThumbImage";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { getChapter, getSubject, getVideo } from "@/data/mockData";
import { useAppStore } from "@/state/useAppStore";
import { useHydrated } from "@/state/useHydrated";
import { getYouTubeThumbnail } from "@/lib/video";

function formatWhen(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  return new Date(ts).toLocaleDateString();
}

/** Resolve a human-readable "Subject · Chapter" label for a video. */
function resolveVideoMeta(videoId: string): { subject: string; chapter: string } {
  const v = getVideo(videoId);
  if (!v) return { subject: "Unknown Subject", chapter: "Unknown Chapter" };

  const subject = getSubject(v.subjectId)?.name ?? v.subjectId ?? "Unknown Subject";
  const chapter = getChapter(v.chapterId)?.title ?? v.chapterId ?? "Unknown Chapter";
  return { subject, chapter };
}

export function BookmarksScreen() {
  const videoBookmarks = useAppStore((s) => s.videoBookmarks);
  const questionBookmarks = useAppStore((s) => s.questionBookmarks);
  const clearBookmarks = useAppStore((s) => s.clearBookmarks);
  const toggleVideoBookmark = useAppStore((s) => s.toggleVideoBookmark);
  const toggleQuestionBookmark = useAppStore((s) => s.toggleQuestionBookmark);
  const hasHydrated = useHydrated();

  const items = useMemo(() => {
    const videoItems = Object.entries(videoBookmarks).map(([videoId, meta]) => {
      const v = getVideo(videoId);
      const { subject, chapter } = resolveVideoMeta(videoId);
      return {
        key: `v_${videoId}`,
        type: "video" as const,
        refId: videoId,
        title: v?.title ?? "Saved Video",
        teacher: v?.teacher ?? "Teacher",
        subject,
        chapter,
        url: v?.url ?? "",
        addedAt: meta.addedAt,
      };
    });

    const questionItems = Object.entries(questionBookmarks).map(([questionId, meta]) => ({
      key: `q_${questionId}`,
      type: "question" as const,
      refId: questionId,
      title: meta.title ?? "Saved Question",
      teacher: "Quiz / Mock Test",
      subject: "Practice",
      chapter: "Saved Question",
      url: "",
      addedAt: meta.addedAt,
    }));

    return [...videoItems, ...questionItems].sort((a, b) => b.addedAt - a.addedAt);
  }, [questionBookmarks, videoBookmarks]);

  // Wait for Zustand persist to finish rehydrating from localStorage
  if (!hasHydrated) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-byjus-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Bookmarks</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                Save videos and questions for quick revision.
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center">
              <Bookmark className="h-5 w-5 text-byjus-400" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Badge className="bg-white/10 border-white/10 text-ink-200">{items.length} items</Badge>
            <Button
              variant="secondary"
              className="h-10 rounded-2xl"
              onClick={clearBookmarks}
              disabled={items.length === 0}
            >
              Clear all
            </Button>
          </div>
        </Card>
      </Reveal>

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {items.map((b) => {
          const href = b.type === "video" ? `/app/videos/${b.refId}` : "/app/quizzes";
          const thumb = b.type === "video" && b.url ? getYouTubeThumbnail(b.url, "mq") : null;
          const Icon = b.type === "video" ? Video : FileQuestion;

          return (
            <motion.div key={b.key} variants={staggerItem}>
              <Card interactive className="p-5">
                <div className="flex items-start gap-3">
                  {/* Thumbnail / icon */}
                  <div className="h-14 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {thumb ? (
                      <ThumbImage src={thumb} />
                    ) : (
                      <div className="h-full w-full grid place-items-center bg-white/5">
                        <Icon className="h-6 w-6 text-ink-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">
                      {b.title}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-ink-500 dark:text-ink-300">
                      {b.type.toUpperCase()} · {formatWhen(b.addedAt)}
                    </div>
                    {/* Subject + Chapter — always shown */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-lg bg-byjus-600/20 px-2 py-0.5 text-xs font-semibold text-byjus-300">
                        {b.subject}
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-0.5 text-xs font-semibold text-ink-300">
                        {b.chapter}
                      </span>
                    </div>
                    {b.type === "video" && (
                      <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{b.teacher}</div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition focus-ring hover:bg-white/15"
                    onClick={() => {
                      if (b.type === "video") toggleVideoBookmark(b.refId);
                      else toggleQuestionBookmark(b.refId, b.title);
                    }}
                    aria-label="Remove bookmark"
                    title="Remove"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link to={href} className="flex-1">
                    <Button className="h-10 w-full rounded-2xl">Open</Button>
                  </Link>
                  <Button
                    variant="secondary"
                    className="h-10 rounded-2xl"
                    onClick={() => {
                      if (b.type === "video") toggleVideoBookmark(b.refId);
                      else toggleQuestionBookmark(b.refId, b.title);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {items.length === 0 && (
        <Card className="p-6 text-center">
          <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">No bookmarks yet</div>
          <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
            Add bookmarks from the video player or quiz attempt screens.
          </div>
          <div className="mt-4">
            <Link to="/app/recorded-classes">
              <Button variant="secondary">Browse videos</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
