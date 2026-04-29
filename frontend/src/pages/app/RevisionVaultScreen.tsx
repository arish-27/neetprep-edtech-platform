import { useEffect, useState } from "react";
import { BookMarked, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type RevisionItem } from "@/lib/apiV2";

export function RevisionVaultScreen() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiV2.adaptive.revision()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markReviewed(id: string) {
    setReviewing(id);
    try {
      await apiV2.adaptive.markReviewed(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { /* ignore */ }
    finally { setReviewing(null); }
  }

  const subjectGroups = items.reduce<Record<string, RevisionItem[]>>((acc, item) => {
    if (!acc[item.subject]) acc[item.subject] = [];
    acc[item.subject].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-byjus-600/30 grid place-items-center">
                <BookMarked className="h-5 w-5 text-byjus-400" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Revision Vault</div>
                <div className="text-sm text-ink-500 dark:text-ink-400">
                  Questions you got wrong — spaced repetition keeps them coming back
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 border-white/10 text-ink-200">{items.length} due today</Badge>
              <button type="button" onClick={load} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/10 text-ink-300 hover:text-ink-50 transition focus-ring">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      </Reveal>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-byjus-400" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
          <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">All caught up!</div>
          <div className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            No revisions due today. Keep practicing to add questions here.
          </div>
        </Card>
      ) : (
        Object.entries(subjectGroups).map(([subj, subItems]) => (
          <Reveal key={subj} delay={0.05}>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">{subj}</div>
                <Badge className="bg-white/10 border-white/10 text-ink-200">{subItems.length}</Badge>
              </div>
              <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
                {subItems.map((item) => (
                  <motion.div key={item.id} variants={staggerItem}>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50 cursor-pointer"
                            onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                            {item.question_text}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-500">
                            {item.topic && <span>{item.topic}</span>}
                            <span>Reviewed {item.review_count}×</span>
                            <span>Next: {item.next_review_at}</span>
                          </div>

                          {expanded === item.id && item.explanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 overflow-hidden"
                            >
                              💡 {item.explanation}
                            </motion.div>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          className="h-9 rounded-xl shrink-0 text-xs"
                          onClick={() => markReviewed(item.id)}
                          disabled={reviewing === item.id}
                        >
                          {reviewing === item.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <><CheckCircle2 className="h-3.5 w-3.5" /> Done</>}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </Card>
          </Reveal>
        ))
      )}
    </div>
  );
}
