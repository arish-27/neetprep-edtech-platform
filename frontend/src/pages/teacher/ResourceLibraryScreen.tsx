import { useEffect, useState } from "react";
import { ExternalLink, FileText, Link2, Loader2, Plus, Search, Trash2, Video, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { staggerItemScale } from "@/lib/motion";
import { apiV2, type Resource } from "@/lib/apiV2";
import { useAppStore } from "@/state/useAppStore";

const SUBJECTS = ["Physics", "Chemistry", "Biology"];

const TYPES = [
  { value: "video", label: "Video",   icon: Video,    darkColor: "#A78BFA", lightColor: "#7C3AED" },
  { value: "pdf",   label: "PDF",     icon: FileText, darkColor: "#FB923C", lightColor: "#EA580C" },
  { value: "link",  label: "Link",    icon: Link2,    darkColor: "#60A5FA", lightColor: "#2563EB" },
  { value: "note",  label: "Note",    icon: FileText, darkColor: "#34D399", lightColor: "#059669" },
];

function getType(t: string) { return TYPES.find((x) => x.value === t) ?? TYPES[2]; }

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

// ── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({ r, onDelete, isDark }: { r: Resource; onDelete: () => void; isDark: boolean }) {
  const type = getType(r.resource_type);
  const typeColor = isDark ? type.darkColor : type.lightColor;

  const cardBg     = isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1";
  const titleColor = isDark ? "#FFFFFF"                : "#0F172A";
  const dateColor  = isDark ? "#6B7280"                : "#64748B";
  const divider    = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const actionBg   = isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC";
  const actionBdr  = isDark ? "rgba(255,255,255,0.1)"  : "#CBD5E1";
  const actionClr  = isDark ? "#D1D5DB"                : "#334155";

  return (
    <motion.div variants={staggerItemScale} layout whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}>
      <div className="flex flex-col h-full rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isDark ? "blur(16px)" : "none", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Top color strip */}
        <div className="h-1.5 w-full" style={{ background: typeColor }} />

        <div className="flex flex-1 flex-col p-4">
          {/* Icon + badge */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{ background: `${typeColor}22` }}>
              <type.icon className="h-5 w-5" style={{ color: typeColor }} />
            </div>
            <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}44` }}>
              {type.label}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold line-clamp-2 flex-1" style={{ color: titleColor }}>{r.title}</h4>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "rgba(139,92,246,0.12)", color: isDark ? "#A78BFA" : "#7C3AED", border: "1px solid rgba(139,92,246,0.2)" }}>
              {r.subject}
            </span>
            {r.topic && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#F5F2ED", color: isDark ? "#9CA3AF" : "#6B7280", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E8E5E0"}` }}>
                {r.topic}
              </span>
            )}
          </div>

          <div className="mt-1 text-[11px]" style={{ color: dateColor }}>{formatDate(r.created_at)}</div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${divider}` }}>
            <a href={r.url} target="_blank" rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition focus-ring"
              style={{ background: actionBg, border: `1px solid ${actionBdr}`, color: actionClr }}>
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
            <button type="button" onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition focus-ring"
              style={{ background: actionBg, border: `1px solid ${actionBdr}`, color: isDark ? "#9CA3AF" : "#6B7280" }}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Add Form ──────────────────────────────────────────────────────────────────
function AddResourceForm({ onAdded, onCancel, isDark }: { onAdded: (r: Resource) => void; onCancel: () => void; isDark: boolean }) {
  const [subject, setSubject]           = useState("Physics");
  const [topic, setTopic]               = useState("");
  const [title, setTitle]               = useState("");
  const [resourceType, setResourceType] = useState("video");
  const [url, setUrl]                   = useState("");
  const [description, setDescription]   = useState("");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  const cardBg      = isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
  const cardBorder  = isDark ? "rgba(255,255,255,0.15)" : "#CBD5E1";
  const titleColor  = isDark ? "#FFFFFF"                : "#0F172A";
  const labelColor  = isDark ? "#D1D5DB"                : "#1E293B";
  const subColor    = isDark ? "#6B7280"                : "#64748B";
  const inputBg     = isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
  const inputBorder = isDark ? "rgba(255,255,255,0.15)" : "#CBD5E1";
  const inputColor  = isDark ? "#FFFFFF"                : "#0F172A";
  const btnGhostBg  = isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9";
  const btnGhostBdr = isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1";
  const btnGhostClr = isDark ? "#D1D5DB"                : "#334155";

  const inputStyle: React.CSSProperties = {
    background: inputBg, border: `1px solid ${inputBorder}`,
    borderRadius: "0.75rem", color: inputColor,
    fontSize: "0.875rem", padding: "0.625rem 0.875rem",
    width: "100%", outline: "none",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) { setError("Title and URL are required."); return; }
    setSaving(true); setError("");
    try {
      const r = await apiV2.resources.add({ subject, topic, title: title.trim(), resource_type: resourceType, url: url.trim(), description, tags: "" });
      onAdded(r);
    } catch (err: any) {
      setError(err?.message ?? "Failed to add resource.");
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
      <div className="rounded-2xl p-6"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isDark ? "blur(16px)" : "none", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: titleColor }}>Add New Resource</h3>
          <button type="button" onClick={onCancel} className="text-sm font-medium transition"
            style={{ color: subColor }}>Cancel</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: labelColor }}>Subject</label>
              <div className="flex gap-2">
                {SUBJECTS.map((s) => (
                  <button key={s} type="button" onClick={() => setSubject(s)}
                    className="flex-1 rounded-lg py-2 text-xs font-semibold transition"
                    style={{
                      background: subject === s ? "rgba(139,92,246,0.15)" : inputBg,
                      border: `1px solid ${subject === s ? "rgba(139,92,246,0.4)" : inputBorder}`,
                      color: subject === s ? (isDark ? "#A78BFA" : "#6D28D9") : (isDark ? "#9CA3AF" : "#6B7280"),
                    }}>{s}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: labelColor }}>Type</label>
              <div className="flex gap-2">
                {TYPES.map((t) => {
                  const active = resourceType === t.value;
                  const col = isDark ? t.darkColor : t.lightColor;
                  return (
                    <button key={t.value} type="button" onClick={() => setResourceType(t.value)}
                      className="flex-1 rounded-lg py-2 text-xs font-semibold transition"
                      style={{
                        background: active ? `${col}22` : inputBg,
                        border: `1px solid ${active ? `${col}66` : inputBorder}`,
                        color: active ? col : (isDark ? "#9CA3AF" : "#6B7280"),
                      }}>{t.label}</button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: labelColor }}>Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Newton's Laws — Full Lecture" style={inputStyle} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: labelColor }}>
                Topic <span style={{ color: subColor }}>(optional)</span>
              </label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Kinematics" style={inputStyle} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: labelColor }}>URL / Link *</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..." type="url" style={inputStyle} required />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: labelColor }}>
              Description <span style={{ color: subColor }}>(optional)</span>
            </label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for students" style={inputStyle} />
          </div>

          {error && (
            <div className="rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: isDark ? "#FCA5A5" : "#DC2626" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : <><Plus className="h-4 w-4" /> Add Resource</>}
            </button>
            <button type="button" onClick={onCancel}
              className="flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-xl transition"
              style={{ background: btnGhostBg, border: `1px solid ${btnGhostBdr}`, color: btnGhostClr }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function ResourceLibraryScreen() {
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === "dark";

  const [resources, setResources]         = useState<Resource[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterType, setFilterType]       = useState("All");
  const [search, setSearch]               = useState("");
  const [showForm, setShowForm]           = useState(false);
  const [toast, setToast]                 = useState("");

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const titleColor  = isDark ? "#FFFFFF"                : "#0F172A";
  const subColor    = isDark ? "#9CA3AF"                : "#475569";
  const filterBg    = isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF";
  const filterBdr   = isDark ? "rgba(255,255,255,0.1)"  : "#CBD5E1";
  const inputBg     = isDark ? "rgba(255,255,255,0.07)" : "#F8FAFC";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1";
  const inputColor  = isDark ? "#FFFFFF"                : "#0F172A";
  const emptyBg     = isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF";
  const emptyBorder = isDark ? "rgba(255,255,255,0.1)"  : "#CBD5E1";
  const iconBg      = isDark ? "rgba(139,92,246,0.2)"   : "#EDE9FE";
  const iconColor   = isDark ? "#A78BFA"                : "#7C3AED";

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.375rem 0.875rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    background: active ? "#8B5CF6" : (isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9"),
    border: `1px solid ${active ? "#8B5CF6" : (isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1")}`,
    color: active ? "#FFFFFF" : (isDark ? "#9CA3AF" : "#334155"),
  });

  function load() {
    setLoading(true);
    apiV2.resources.list({
      subject: filterSubject === "All" ? undefined : filterSubject,
      resource_type: filterType === "All" ? undefined : filterType,
    }).then(setResources).catch(() => setResources([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filterSubject, filterType]);

  function handleAdded(r: Resource) {
    setResources((prev) => [r, ...prev]);
    setShowForm(false);
    setToast("Resource added!");
    setTimeout(() => setToast(""), 3000);
  }

  async function handleDelete(id: string) {
    try {
      await apiV2.resources.delete(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ }
  }

  const displayed = resources.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6" style={{ position: "relative", zIndex: 1 }}>

      {/* ── Page header ── */}
      <motion.div className="flex flex-wrap items-start justify-between gap-4"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: titleColor }}>Resource Library</h1>
          <p className="mt-1 text-sm" style={{ color: subColor }}>
            {resources.length} resource{resources.length !== 1 ? "s" : ""} · visible to your students
          </p>
        </div>
        <motion.button type="button" onClick={() => setShowForm((v) => !v)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}>
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Resource"}
        </motion.button>
      </motion.div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {showForm && <AddResourceForm onAdded={handleAdded} onCancel={() => setShowForm(false)} isDark={isDark} />}
      </AnimatePresence>

      {/* ── Filters + Search ── */}
      <motion.div className="rounded-2xl p-4"
        style={{ background: filterBg, border: `1px solid ${filterBdr}`, backdropFilter: isDark ? "blur(16px)" : "none", boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.04)" }}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources…"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: "0.75rem", color: inputColor, fontSize: "0.875rem", padding: "0.5rem 0.875rem 0.5rem 2.5rem", width: "100%", outline: "none" }} />
          </div>
          {/* Subject pills */}
          <div className="flex flex-wrap gap-2">
            {["All", ...SUBJECTS].map((s) => (
              <button key={s} type="button" onClick={() => setFilterSubject(s)} style={pillStyle(filterSubject === s)}>{s}</button>
            ))}
          </div>
          {/* Type pills */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilterType("All")} style={pillStyle(filterType === "All")}>All Types</button>
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.value} type="button" onClick={() => setFilterType(t.value)}
                  style={pillStyle(filterType === t.value)}
                  className="inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
          style={{ background: emptyBg, border: `1px solid ${emptyBorder}`, boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)" }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6 grid h-20 w-20 place-items-center rounded-3xl"
            style={{ background: iconBg, border: `1px solid ${isDark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.2)"}` }}>
            <BookOpen className="h-9 w-9" style={{ color: iconColor }} />
          </motion.div>
          <h3 className="text-xl font-bold" style={{ color: titleColor }}>No resources yet</h3>
          <p className="mt-2 max-w-xs text-sm" style={{ color: subColor }}>
            Add videos, PDFs, and links for your students.
          </p>
          <button type="button" onClick={() => setShowForm(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 4px 14px rgba(249,115,22,0.3)" }}>
            <Plus className="h-4 w-4" /> Add Your First Resource
          </button>
        </div>
      ) : (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
          initial="hidden" animate="show">
          {displayed.map((r) => (
            <ResourceCard key={r.id} r={r} onDelete={() => handleDelete(r.id)} isDark={isDark} />
          ))}
        </motion.div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold"
            style={{ background: isDark ? "rgba(17,24,39,0.95)" : "#FFFFFF", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#E8E5E0"}`, color: isDark ? "#FFFFFF" : "#111827", backdropFilter: "blur(16px)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            ✅ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
