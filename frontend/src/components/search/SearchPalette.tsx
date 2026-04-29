import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Search, Video, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { subjects, type Subject } from "@/data/mockData";
import { cn } from "@/lib/cn";
import { api, apiSubjectToKey, type ApiCoursePublic } from "@/lib/api";

type ResultItem =
  | { type: "subject"; id: string; title: string; subtitle: string; href: string }
  | { type: "course"; id: string; title: string; subtitle: string; href: string };

function subjectResults(query: string): ResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return subjects
    .filter((s) => s.name.toLowerCase().includes(q))
    .slice(0, 4)
    .map((s) => ({
      type: "subject" as const,
      id: s.id,
      title: s.name,
      subtitle: s.tagline,
      href: `/app/subjects/${s.id}/chapters`,
    }));
}

function courseResults(courses: ApiCoursePublic[]): ResultItem[] {
  return courses.slice(0, 6).map((c) => ({
    type: "course" as const,
    id: c.id,
    title: c.title,
    subtitle: `${c.subject.toUpperCase()} • ${c.description || "Open chapters"}`,
    href: `/app/subjects/${apiSubjectToKey(c.subject)}/chapters`,
  }));
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  const [courses, setCourses] = useState<ApiCoursePublic[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCourses([]);
    setLoadingCourses(false);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }

    let cancelled = false;
    setLoadingCourses(true);
    const t = window.setTimeout(() => {
      (async () => {
        try {
          const page = await api.search.courses({ q, limit: 6, offset: 0 });
          if (cancelled) return;
          setCourses(page.items ?? []);
        } catch {
          if (cancelled) return;
          setCourses([]);
        } finally {
          if (!cancelled) setLoadingCourses(false);
        }
      })();
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, query]);

  const results = useMemo(() => {
    return [...subjectResults(query), ...courseResults(courses)];
  }, [courses, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && results[0]) navigate(results[0].href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, onClose, open, results]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close search"
            className="fixed inset-0 z-[60] bg-ink-900/30 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed left-0 right-0 top-16 z-[61] px-4"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="mx-auto max-w-2xl">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <Input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search subjects and courses…"
                      className="pl-9"
                    />
                  </div>
                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center rounded-2xl border border-ink-200/60 bg-white/70 text-ink-700 shadow-soft hover:bg-ink-50 focus-ring dark:border-white/10 dark:bg-ink-900/30 dark:text-ink-200 dark:hover:bg-white/10"
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-ink-600 dark:text-ink-200">
                    Tip: Press <span className="font-extrabold">Enter</span> to open the first result.
                  </div>
                  <Badge className="bg-white/70 dark:bg-white/10">{results.length} results</Badge>
                </div>

                <div className="mt-4 grid gap-2">
                  {query.trim() && results.length === 0 && !loadingCourses ? (
                    <div className="rounded-2xl border border-ink-200/60 bg-white/70 px-4 py-3 text-sm font-semibold text-ink-700 shadow-soft dark:border-white/10 dark:bg-ink-900/30 dark:text-ink-200">
                      No matches. Try a different keyword.
                    </div>
                  ) : null}

                  {loadingCourses ? (
                    <div className="rounded-2xl border border-ink-200/60 bg-white/70 px-4 py-3 text-sm font-semibold text-ink-700 shadow-soft dark:border-white/10 dark:bg-ink-900/30 dark:text-ink-200">
                      Searching courses…
                    </div>
                  ) : null}

                  {results.map((item) => {
                    const Icon = item.type === "subject" ? BookOpen : Video;
                    return (
                      <button
                        key={`${item.type}_${item.id}`}
                        type="button"
                        className={cn(
                          "w-full rounded-2xl border border-ink-200/60 bg-white/70 px-4 py-3 text-left shadow-soft transition focus-ring",
                          "hover:bg-ink-50 dark:border-white/10 dark:bg-ink-900/30 dark:hover:bg-white/10",
                        )}
                        onClick={() => {
                          onClose();
                          navigate(item.href);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-byjus-50 border border-byjus-200/70 text-byjus-700 dark:bg-white/10 dark:border-white/10 dark:text-ink-200">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">
                              {item.title}
                            </div>
                            <div className="truncate text-xs font-semibold text-ink-600 dark:text-ink-200">
                              {item.subtitle}
                            </div>
                          </div>
                          <Badge className="bg-white/70 dark:bg-white/10">{item.type.toUpperCase()}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
