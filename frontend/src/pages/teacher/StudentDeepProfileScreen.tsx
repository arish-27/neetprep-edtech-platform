import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Clock, Loader2, TrendingUp, User } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { api, type ApiTeacherDashboard, type ApiStudentSummaryForTeacher } from "@/lib/api";

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function formatDate(iso: string | null) {
  if (!iso) return "Never";
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return "—"; }
}
function accuracyColor(p: number) {
  return p >= 75 ? "text-emerald-400" : p >= 50 ? "text-amber-400" : "text-rose-400";
}

// This page reads from the existing teacher dashboard API — no new API needed
export function StudentDeepProfileScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<ApiStudentSummaryForTeacher | null>(null);
  const [subject, setSubject] = useState("");

  useEffect(() => {
    api.teacher.dashboard()
      .then((d: ApiTeacherDashboard) => {
        const found = d.all_students.find((s) => String(s.user_id) === studentId);
        setStudent(found ?? null);
        setSubject(d.subject);
      })
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>;

  if (!student) return (
    <Card className="p-8 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
      <div className="text-base font-extrabold text-slate-800">Student not found</div>
      <Button variant="secondary" className="mt-4 h-10 rounded-2xl" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
    </Card>
  );

  const stats = [
    { label: "Accuracy", value: `${student.accuracy_pct.toFixed(0)}%`, icon: TrendingUp, color: accuracyColor(student.accuracy_pct) },
    { label: "Quizzes", value: student.quiz_attempts, icon: Activity, color: "text-brand-500" },
    { label: "Lessons", value: student.completed_lessons, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Watch Time", value: formatSeconds(student.watched_seconds), icon: Clock, color: "text-sky-400" },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <Reveal>
        <Card className="p-5">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition mb-4 focus-ring rounded-xl">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
          </button>
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 shrink-0 rounded-2xl grid place-items-center text-xl font-extrabold text-white ${student.is_weak ? "bg-rose-600/60" : "bg-byjus-600/60"}`}>
              {student.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xl font-extrabold text-slate-800">{student.username}</div>
                {student.is_weak && <Badge className="bg-rose-500/20 border-rose-500/30 text-rose-300 text-xs">Needs Help</Badge>}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">{student.email}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-brand-50 border-brand-200 text-brand-400 text-xs">{subject}</Badge>
                <span className="text-xs text-slate-500">Last active: {formatDate(student.last_active)}</span>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        <motion.div className="grid grid-cols-2 gap-3 sm:grid-cols-4" variants={staggerContainer} initial="hidden" animate="show">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} variants={staggerItem}>
                <Card className="p-4 text-center">
                  <Icon className={`mx-auto h-5 w-5 mb-2 ${s.color}`} />
                  <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </Reveal>

      <Reveal delay={0.08}>
        <Card className="p-5">
          <div className="text-base font-extrabold text-slate-800 mb-4">Course Progress</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Overall progress</span>
                <span>{student.progress_pct.toFixed(0)}%</span>
              </div>
              <ProgressBar value={student.progress_pct} />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Quiz accuracy</span>
                <span className={accuracyColor(student.accuracy_pct)}>{student.accuracy_pct.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${student.accuracy_pct >= 75 ? "bg-emerald-500" : student.accuracy_pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                  initial={{ width: 0 }} animate={{ width: `${student.accuracy_pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }} />
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      {student.is_weak && (
        <Reveal delay={0.11}>
          <Card className="p-5 border border-rose-500/30 bg-rose-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-extrabold text-rose-300">Intervention Recommended</div>
                <div className="mt-1 text-xs text-rose-300/70">
                  This student's accuracy is below 40%. Consider:
                </div>
                <ul className="mt-2 space-y-1 text-xs text-rose-300/70 list-disc list-inside">
                  <li>Sending a personal message via the Doubts section</li>
                  <li>Assigning easier practice questions</li>
                  <li>Scheduling a one-on-one session</li>
                  <li>Sharing targeted resources from the Resource Library</li>
                </ul>
              </div>
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
