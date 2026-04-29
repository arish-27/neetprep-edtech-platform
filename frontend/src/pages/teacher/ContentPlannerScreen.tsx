import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { staggerItem } from "@/lib/motion";
import { apiV2, type ContentPlan, type TopicItem } from "@/lib/apiV2";
import { useAppStore } from "@/state/useAppStore";

const SUBJECTS = ["Physics", "Chemistry", "Biology"];

const STATUS_CONFIG = {
  pending:     { icon: Circle,       label: "Pending",     darkColor: "#9CA3AF", darkBg: "rgba(156,163,175,0.15)", darkBorder: "rgba(156,163,175,0.3)",  lightColor: "#6B7280", lightBg: "rgba(107,114,128,0.08)",  lightBorder: "rgba(107,114,128,0.2)" },
  in_progress: { icon: Clock,        label: "In Progress", darkColor: "#FBBF24", darkBg: "rgba(251,191,36,0.15)",  darkBorder: "rgba(251,191,36,0.3)",   lightColor: "#D97706", lightBg: "rgba(217,119,6,0.08)",    lightBorder: "rgba(217,119,6,0.25)" },
  done:        { icon: CheckCircle2, label: "Done",        darkColor: "#34D399", darkBg: "rgba(52,211,153,0.15)",  darkBorder: "rgba(52,211,153,0.3)",   lightColor: "#059669", lightBg: "rgba(5,150,105,0.08)",    lightBorder: "rgba(5,150,105,0.25)" },
};

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, onUpdate, onDelete, isDark }: {
  plan: ContentPlan;
  onUpdate: (id: string, topics: TopicItem[]) => void;
  onDelete: (id: string) => void;
  isDark: boolean;
}) {
  const done = plan.topics.filter((t) => t.status === "done").length;
  const pct  = plan.topics.length ? Math.round((done / plan.topics.length) * 100) : 0;

  const cardBg     = isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1";
  const titleColor = isDark ? "#FFFFFF" : "#0F172A";
  const metaColor  = isDark ? "#9CA3AF" : "#475569";
  const pctColor   = isDark ? "#A78BFA" : "#7C3AED";
  const barTrack   = isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0";
  const btnBg      = isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9";
  const btnBorder  = isDark ? "rgba(255,255,255,0.1)"  : "#CBD5E1";
  const btnColor   = isDark ? "#9CA3AF" : "#64748B";
  const topicText  = isDark ? "#E5E7EB" : "#1E293B";

  function cycleStatus(idx: number) {
    const order: TopicItem["status"][] = ["pending", "in_progress", "done"];
    const next = order[(order.indexOf(plan.topics[idx].status) + 1) % 3];
    onUpdate(plan.id, plan.topics.map((t, i) => i === idx ? { ...t, status: next } : t));
  }

  return (
    <motion.div variants={staggerItem} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
      <div className="h-full rounded-2xl p-5 flex flex-col"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isDark ? "blur(16px)" : "none", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: titleColor }}>{plan.title}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(139,92,246,0.15)", color: isDark ? "#A78BFA" : "#7C3AED", border: "1px solid rgba(139,92,246,0.25)" }}>
                {plan.subject}
              </span>
              <span className="text-[10px]" style={{ color: metaColor }}>Week {plan.week_number}</span>
              {plan.target_date && <span className="text-[10px]" style={{ color: metaColor }}>📅 {plan.target_date}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold" style={{ color: pctColor }}>{pct}%</span>
            <button type="button" onClick={() => onDelete(plan.id)}
              className="grid h-7 w-7 place-items-center rounded-lg transition focus-ring"
              style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: btnColor }}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full overflow-hidden mb-4" style={{ background: barTrack }}>
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #8B5CF6, #A78BFA)" }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Topics */}
        <div className="space-y-1.5 flex-1">
          {plan.topics.length === 0 ? (
            <div className="text-xs text-center py-3" style={{ color: metaColor }}>No topics added</div>
          ) : (
            plan.topics.map((t, i) => {
              const cfg = STATUS_CONFIG[t.status];
              const color  = isDark ? cfg.darkColor  : cfg.lightColor;
              const bg     = isDark ? cfg.darkBg     : cfg.lightBg;
              const border = isDark ? cfg.darkBorder : cfg.lightBorder;
              const Icon = cfg.icon;
              return (
                <button key={i} type="button" onClick={() => cycleStatus(i)}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition focus-ring"
                  style={{ background: bg, border: `1px solid ${border}`, color }}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs font-medium truncate flex-1" style={{ color: topicText }}>{t.topic}</span>
                  <span className="text-[10px] font-medium shrink-0" style={{ color }}>{cfg.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function ContentPlannerScreen() {
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === "dark";

  const [plans, setPlans]           = useState<ContentPlan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [title, setTitle]           = useState("");
  const [subject, setSubject]       = useState("Physics");
  const [week, setWeek]             = useState(1);
  const [targetDate, setTargetDate] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics]         = useState<TopicItem[]>([]);
  const [saving, setSaving]         = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const pageBg      = isDark ? "transparent"              : "#FBF8F3";
  const titleColor  = isDark ? "#FFFFFF"                  : "#0F172A";
  const subColor    = isDark ? "#9CA3AF"                  : "#475569";
  const cardBg      = isDark ? "rgba(255,255,255,0.07)"   : "#FFFFFF";
  const cardBorder  = isDark ? "rgba(255,255,255,0.12)"   : "#CBD5E1";
  const labelColor  = isDark ? "#D1D5DB"                  : "#1E293B";
  const inputBg     = isDark ? "rgba(255,255,255,0.07)"   : "#FFFFFF";
  const inputBorder = isDark ? "rgba(255,255,255,0.15)"   : "#CBD5E1";
  const inputColor  = isDark ? "#FFFFFF"                  : "#0F172A";
  const btnGhostBg  = isDark ? "rgba(255,255,255,0.06)"   : "#F1F5F9";
  const btnGhostBdr = isDark ? "rgba(255,255,255,0.12)"   : "#CBD5E1";
  const btnGhostClr = isDark ? "#D1D5DB"                  : "#334155";
  const emptyBg     = isDark ? "rgba(255,255,255,0.05)"   : "#FFFFFF";
  const emptyBorder = isDark ? "rgba(255,255,255,0.1)"    : "#CBD5E1";
  const iconBg      = isDark ? "rgba(139,92,246,0.2)"     : "#EDE9FE";
  const iconColor   = isDark ? "#A78BFA"                  : "#7C3AED";
  const chipBg      = isDark ? "rgba(139,92,246,0.15)"    : "#EDE9FE";
  const chipBorder  = isDark ? "rgba(139,92,246,0.3)"     : "rgba(139,92,246,0.25)";
  const chipColor   = isDark ? "#C4B5FD"                  : "#5B21B6";

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${inputBorder}`,
    borderRadius: "0.75rem", color: inputColor,
    fontSize: "0.875rem", padding: "0.625rem 0.875rem",
    width: "100%", outline: "none",
  };

  useEffect(() => {
    apiV2.contentPlans.list()
      .then(setPlans).catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  function addTopic() {
    const t = topicInput.trim();
    if (!t) return;
    setTopics((prev) => [...prev, { topic: t, status: "pending", notes: "" }]);
    setTopicInput("");
  }

  async function save() {
    if (!title.trim() || topics.length === 0) return;
    setSaving(true);
    try {
      const p = await apiV2.contentPlans.create({ title: title.trim(), subject, week_number: week, topics, target_date: targetDate || undefined });
      setPlans((prev) => [...prev, p]);
      setTitle(""); setTopics([]); setTopicInput(""); setTargetDate(""); setShowForm(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  async function handleUpdate(id: string, updatedTopics: TopicItem[]) {
    try {
      const updated = await apiV2.contentPlans.update(id, { topics: updatedTopics });
      setPlans((prev) => prev.map((p) => p.id === id ? updated : p));
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await apiV2.contentPlans.delete(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6" style={{ position: "relative", zIndex: 1 }}>

      {/* ── Page header ── */}
      <motion.div className="flex flex-wrap items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: titleColor }}>Content Planner</h1>
          <p className="mt-1 text-sm" style={{ color: subColor }}>Plan weekly topics and track your teaching progress</p>
        </div>
        <motion.button type="button" onClick={() => setShowForm((v) => !v)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}>
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Plan"}
        </motion.button>
      </motion.div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isDark ? "blur(16px)" : "none", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 className="text-base font-bold" style={{ color: titleColor }}>New Weekly Plan</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: labelColor }}>Title *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mechanics Week 1" style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: labelColor }}>Subject</label>
                  <div className="flex gap-2">
                    {SUBJECTS.map((s) => (
                      <button key={s} type="button" onClick={() => setSubject(s)}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold transition"
                        style={{
                          background: subject === s ? "rgba(139,92,246,0.2)" : inputBg,
                          border: `1px solid ${subject === s ? "rgba(139,92,246,0.5)" : inputBorder}`,
                          color: subject === s ? (isDark ? "#FFFFFF" : "#6D28D9") : subColor,
                        }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: labelColor }}>Week Number</label>
                  <input type="number" min={1} max={52} value={week}
                    onChange={(e) => setWeek(Number(e.target.value))} style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: labelColor }}>
                    Target Date <span style={{ color: subColor }}>(optional)</span>
                  </label>
                  <input type="date" value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{ ...inputStyle, colorScheme: isDark ? "dark" : "light" }} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: labelColor }}>Topics</label>
                <div className="flex gap-2">
                  <input value={topicInput} onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                    placeholder="Type a topic and press Enter or click Add"
                    style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={addTopic}
                    className="px-4 py-2 text-sm font-semibold rounded-xl transition"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)", color: isDark ? "#A78BFA" : "#6D28D9" }}>
                    Add
                  </button>
                </div>
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {topics.map((t, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{ background: chipBg, border: `1px solid ${chipBorder}`, color: chipColor }}>
                        {t.topic}
                        <button type="button"
                          onClick={() => setTopics((prev) => prev.filter((_, j) => j !== i))}
                          className="ml-0.5 transition hover:text-red-500" style={{ color: chipColor }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={save}
                  disabled={saving || !title.trim() || topics.length === 0}
                  className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Plan"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl transition"
                  style={{ background: btnGhostBg, border: `1px solid ${btnGhostBdr}`, color: btnGhostClr }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ background: emptyBg, border: `1px solid ${emptyBorder}`, boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)" }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-4 grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: iconBg, border: `1px solid ${chipBorder}` }}>
            <CalendarDays className="h-8 w-8" style={{ color: iconColor }} />
          </motion.div>
          <h3 className="text-lg font-bold" style={{ color: titleColor }}>No plans yet</h3>
          <p className="mt-2 max-w-xs text-sm" style={{ color: subColor }}>
            Create your first weekly content plan to organise your teaching schedule.
          </p>
          <button type="button" onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
            <Plus className="h-4 w-4" /> Create First Plan
          </button>
        </div>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
          initial="hidden" animate="show">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onUpdate={handleUpdate} onDelete={handleDelete} isDark={isDark} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
