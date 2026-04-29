import { useEffect, useState } from "react";
import { ClipboardList, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type Assignment, type GeneratedQuestion } from "@/lib/apiV2";

const SUBJECTS = ["Physics", "Chemistry", "Biology"];

export function AssignmentBuilderScreen() {
  const [tab, setTab] = useState<"create" | "list">("list");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Create form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiV2.assignments.list()
      .then(setAssignments)
      .catch(() => setAssignments([]))
      .finally(() => setListLoading(false));
  }, []);

  async function generateQuestions() {
    if (!genTopic.trim()) return;
    setGenLoading(true);
    try {
      const res = await apiV2.ai.generateQuestions({ topic: genTopic.trim(), subject, count: 5 });
      setQuestions((prev) => [...prev, ...res.questions]);
    } catch { /* ignore */ }
    finally { setGenLoading(false); }
  }

  async function saveAssignment() {
    if (!title.trim() || questions.length === 0) { setError("Add a title and at least one question."); return; }
    setError(null);
    setSaving(true);
    try {
      const a = await apiV2.assignments.create({
        title: title.trim(), subject, description, questions,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setAssignments((prev) => [a, ...prev]);
      setTitle(""); setDescription(""); setDueAt(""); setQuestions([]);
      setSuccess(true);
      setTab("list");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
                <ClipboardList className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-800">Assignment Builder</div>
                <div className="text-sm text-slate-500 ">Create and manage assignments for your students</div>
              </div>
            </div>
            <Button className="h-10 rounded-2xl" onClick={() => setTab(tab === "create" ? "list" : "create")}>
              {tab === "create" ? "View All" : <><Plus className="h-4 w-4" /> New</>}
            </Button>
          </div>
        </Card>
      </Reveal>

      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
          ✓ Assignment created successfully!
        </div>
      )}

      {tab === "create" && (
        <Reveal delay={0.05}>
          <Card className="p-5 space-y-4">
            <div className="text-base font-extrabold text-slate-800">New Assignment</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 3 Practice" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBJECTS.map((s) => (
                    <button key={s} type="button" onClick={() => setSubject(s)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${subject === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Description (optional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instructions for students" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Due Date (optional)</label>
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-extrabold text-slate-800 mb-3">Add Questions via AI</div>
              <div className="flex gap-2">
                <Input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="Topic to generate questions from" className="flex-1" />
                <Button variant="secondary" className="h-10 rounded-2xl shrink-0" onClick={generateQuestions} disabled={genLoading}>
                  {genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Generate</>}
                </Button>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-slate-800">{questions.length} Questions</div>
                  <button type="button" onClick={() => setQuestions([])} className="text-xs text-rose-400 hover:underline">Clear all</button>
                </div>
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs font-extrabold text-brand-400 shrink-0 mt-0.5">{i + 1}.</span>
                    <div className="min-w-0 flex-1 text-xs text-slate-500 truncate">{q.question_text}</div>
                    <button type="button" onClick={() => setQuestions((prev) => prev.filter((_, j) => j !== i))} className="shrink-0 text-slate-500 hover:text-rose-400 transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}

            <Button className="w-full h-11 rounded-2xl" onClick={saveAssignment} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Assignment"}
            </Button>
          </Card>
        </Reveal>
      )}

      {tab === "list" && (
        <Reveal delay={0.05}>
          {listLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
          ) : assignments.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <div className="text-base font-extrabold text-slate-800">No assignments yet</div>
              <div className="mt-2 text-sm text-slate-500 ">Create your first assignment using the button above.</div>
            </Card>
          ) : (
            <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {assignments.map((a) => (
                <motion.div key={a.id} variants={staggerItem}>
                  <Card interactive className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-800">{a.title}</div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <Badge className="bg-brand-50 border-brand-200 text-brand-400 text-[10px]">{a.subject}</Badge>
                          <span className="text-xs text-slate-500">{a.questions.length} questions</span>
                          {a.due_at && <span className="text-xs text-slate-500">Due: {new Date(a.due_at).toLocaleDateString()}</span>}
                        </div>
                        {a.description && <div className="mt-1 text-xs text-slate-500  truncate">{a.description}</div>}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </Reveal>
      )}
    </div>
  );
}
