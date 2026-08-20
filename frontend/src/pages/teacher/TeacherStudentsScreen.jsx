import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2, Search, TrendingDown, TrendingUp, Users, } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { api } from "@/lib/api";
function formatSeconds(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0)
        return `${h}h ${m}m`;
    return `${m}m`;
}
function formatDate(iso) {
    if (!iso)
        return "Never";
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    catch {
        return "—";
    }
}
function accuracyColor(pct) {
    if (pct >= 75)
        return "text-emerald-400";
    if (pct >= 50)
        return "text-amber-400";
    return "text-rose-400";
}
function accuracyBg(pct) {
    if (pct >= 75)
        return "bg-emerald-500";
    if (pct >= 50)
        return "bg-amber-500";
    return "bg-rose-500";
}
// ── Individual student card ───────────────────────────────────────────────────
function StudentCard({ student }) {
    const [expanded, setExpanded] = useState(false);
    return (<motion.div variants={staggerItem}>
      <Card interactive className="p-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {/* Summary row */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`h-10 w-10 shrink-0 rounded-2xl grid place-items-center text-sm font-extrabold text-white ${student.is_weak ? "bg-rose-600/60" : "bg-byjus-600/60"}`}>
            {student.username.charAt(0).toUpperCase()}
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-800 truncate">
                {student.username}
              </span>
              {student.is_weak && (<Badge className="bg-rose-500/20 border-rose-500/30 text-rose-300 text-[10px]">
                  Needs Help
                </Badge>)}
            </div>
            <div className="text-xs text-slate-500  truncate">{student.email}</div>
          </div>

          {/* Accuracy */}
          <div className="shrink-0 text-right">
            <div className={`text-lg font-extrabold ${accuracyColor(student.accuracy_pct)}`}>
              {student.accuracy_pct.toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-500">accuracy</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
            <span>Course progress</span>
            <span>{student.progress_pct.toFixed(0)}%</span>
          </div>
          <ProgressBar value={student.progress_pct}/>
        </div>

        {/* Expanded details */}
        {expanded && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Activity className="h-3 w-3 text-brand-500"/> Quizzes
                </div>
                <div className="text-sm font-extrabold text-slate-800">
                  {student.quiz_attempts}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400"/> Lessons
                </div>
                <div className="text-sm font-extrabold text-slate-800">
                  {student.completed_lessons}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Clock className="h-3 w-3 text-sky-400"/> Watch time
                </div>
                <div className="text-sm font-extrabold text-slate-800">
                  {formatSeconds(student.watched_seconds)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Activity className="h-3 w-3 text-amber-400"/> Last active
                </div>
                <div className="text-sm font-extrabold text-slate-800">
                  {formatDate(student.last_active)}
                </div>
              </div>
            </div>

            {/* Accuracy bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Quiz accuracy</span>
                <span className={accuracyColor(student.accuracy_pct)}>
                  {student.accuracy_pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div className={`h-full rounded-full ${accuracyBg(student.accuracy_pct)}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, student.accuracy_pct)}%` }} transition={{ duration: 0.6, ease: "easeOut" }}/>
              </div>
            </div>

            {student.is_weak && (<div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5"/>
                <div className="text-xs font-semibold text-rose-300">
                  This student's accuracy is below 40%. Consider reaching out or providing extra practice material.
                </div>
              </div>)}
          </motion.div>)}
      </Card>
    </motion.div>);
}
export function TeacherStudentsScreen() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    useEffect(() => {
        setLoading(true);
        api.teacher.dashboard()
            .then((d) => setData(d))
            .catch((err) => setError(err?.message ?? "Failed to load"))
            .finally(() => setLoading(false));
    }, []);
    const students = useMemo(() => {
        if (!data)
            return [];
        let list = data.all_students;
        if (filter === "top")
            list = data.top_students;
        if (filter === "weak")
            list = data.weak_students;
        if (q.trim()) {
            const lq = q.trim().toLowerCase();
            list = list.filter((s) => s.username.toLowerCase().includes(lq) || s.email.toLowerCase().includes(lq));
        }
        return list;
    }, [data, filter, q]);
    if (loading) {
        return (<div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500"/>
      </div>);
    }
    if (error || !data) {
        return (<Card className="p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-400"/>
        <div className="mt-3 text-base font-extrabold text-slate-800">
          {error ?? "No data available"}
        </div>
        <div className="mt-2 text-sm text-slate-500 ">
          Make sure a subject is assigned to your account.
        </div>
      </Card>);
    }
    const filters = [
        { id: "all", label: "All Students", count: data.total_students, icon: Users },
        { id: "top", label: "Top Performers", count: data.top_students.length, icon: TrendingUp },
        { id: "weak", label: "Needs Help", count: data.weak_students.length, icon: TrendingDown },
    ];
    return (<div className="space-y-5">
      {/* Header */}
      <Reveal>
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-slate-800">
                Students — {data.subject}
              </div>
              <div className="text-sm text-slate-500 ">
                {data.total_students} student{data.total_students !== 1 ? "s" : ""} · Avg score{" "}
                <span className={accuracyColor(data.avg_class_score_pct)}>
                  {data.avg_class_score_pct.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="pl-9"/>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((f) => {
            const Icon = f.icon;
            return (<button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${filter === f.id
                    ? "border-byjus-500/50 bg-brand-50 text-brand-400 shadow-card"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  <Icon className="h-3.5 w-3.5"/>
                  {f.label}
                  <span className={`rounded-lg px-1.5 py-0.5 text-[10px] ${filter === f.id ? "bg-byjus-500/30 text-byjus-200" : "bg-slate-100 text-slate-400"}`}>
                    {f.count}
                  </span>
                </button>);
        })}
          </div>
        </Card>
      </Reveal>

      {/* Student list */}
      {students.length === 0 ? (<Card className="p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-400 mb-3"/>
          <div className="text-base font-extrabold text-slate-800">
            {q ? "No students match your search" : "No students in this category"}
          </div>
          <div className="mt-2 text-sm text-slate-500 ">
            {q ? "Try a different name or email." : "Students appear here once they submit quizzes for your subject."}
          </div>
        </Card>) : (<motion.div className="grid gap-3 lg:grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
          {students.map((s) => (<StudentCard key={String(s.user_id)} student={s}/>))}
        </motion.div>)}
    </div>);
}
