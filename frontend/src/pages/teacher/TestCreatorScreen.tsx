import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, Eye, EyeOff, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type MockTestV2, type BankQuestion } from "@/lib/apiV2";

const SUBJECTS = ["Physics", "Chemistry", "Biology"];

export function TestCreatorScreen() {
  const [tests, setTests] = useState<MockTestV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "create">("list");

  // Create form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [totalMarks, setTotalMarks] = useState(180);
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<BankQuestion[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI generate
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    apiV2.mockTestsV2.list().then(setTests).catch(() => setTests([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "create") return;
    setBankLoading(true);
    apiV2.questionBank.list({ subject }).then(setBankQuestions).catch(() => setBankQuestions([])).finally(() => setBankLoading(false));
  }, [tab, subject]);

  async function generateAndAdd() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiV2.ai.generateQuestions({ topic: aiTopic.trim(), subject, count: 5 });
      const asBank: BankQuestion[] = res.questions.map((q) => ({
        id: q.id, teacher_id: "", subject, topic: q.topic,
        question_text: q.question_text,
        options: q.options.map((o) => o.text),
        correct_index: q.options.findIndex((o) => o.is_correct),
        explanation: q.explanation, difficulty: q.difficulty, tags: "", source: "ai", created_at: "",
      }));
      setSelectedQuestions((prev) => [...prev, ...asBank]);
      setAiTopic("");
    } catch { /* ignore */ } finally { setAiLoading(false); }
  }

  function toggleQuestion(q: BankQuestion) {
    setSelectedQuestions((prev) =>
      prev.find((x) => x.id === q.id) ? prev.filter((x) => x.id !== q.id) : [...prev, q]
    );
  }

  async function saveTest() {
    if (!title.trim() || selectedQuestions.length === 0) return;
    setSaving(true);
    try {
      const t = await apiV2.mockTestsV2.create({
        title: title.trim(), subject, description, duration_min: durationMin,
        total_marks: totalMarks, negative_marking: negativeMarking,
        questions: selectedQuestions.map((q) => ({
          id: q.id, question_text: q.question_text, options: q.options,
          correct_index: q.correct_index, explanation: q.explanation, difficulty: q.difficulty,
        })),
      });
      setTests((prev) => [t, ...prev]);
      setTitle(""); setDescription(""); setSelectedQuestions([]); setTab("list");
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  async function togglePublish(id: string) {
    try {
      const updated = await apiV2.mockTestsV2.togglePublish(id);
      setTests((prev) => prev.map((t) => t.id === id ? updated : t));
    } catch { /* ignore */ }
  }

  async function deleteTest(id: string) {
    try {
      await apiV2.mockTestsV2.delete(id);
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
                <ClipboardCheck className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-800">Test Creator</div>
                <div className="text-sm text-slate-500">Build full mock tests from your question bank</div>
              </div>
            </div>
            <Button className="h-10 rounded-2xl" onClick={() => setTab(tab === "create" ? "list" : "create")}>
              {tab === "create" ? "View Tests" : <><Plus className="h-4 w-4" /> New Test</>}
            </Button>
          </div>
        </Card>
      </Reveal>

      {tab === "create" && (
        <Reveal delay={0.05}>
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            {/* Config panel */}
            <Card className="p-5 space-y-4">
              <div className="text-sm font-extrabold text-slate-800">Test Configuration</div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Physics Full Mock #1" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBJECTS.map((s) => (
                    <button key={s} type="button" onClick={() => setSubject(s)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${subject === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-400">Duration (min)</label>
                  <Input type="number" min={10} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-400">Total Marks</label>
                  <Input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={negativeMarking} onChange={(e) => setNegativeMarking(e.target.checked)} className="rounded" />
                <span className="text-xs font-semibold text-slate-500">Negative marking (−1 per wrong)</span>
              </label>

              {/* AI generate */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="text-xs font-extrabold text-brand-400 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Add via AI</div>
                <div className="flex gap-2">
                  <Input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Topic..." className="flex-1 text-xs" />
                  <Button variant="secondary" className="h-9 rounded-xl shrink-0 text-xs" onClick={generateAndAdd} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add 5"}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Selected: <span className="font-extrabold text-slate-400">{selectedQuestions.length} questions</span></div>
                {selectedQuestions.length > 0 && (
                  <button type="button" onClick={() => setSelectedQuestions([])} className="text-[10px] text-rose-400 hover:underline">Clear all</button>
                )}
              </div>

              <Button className="w-full h-11 rounded-2xl" onClick={saveTest} disabled={saving || !title.trim() || selectedQuestions.length === 0}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Test"}
              </Button>
            </Card>

            {/* Question picker */}
            <Card className="p-5">
              <div className="text-sm font-extrabold text-slate-800 mb-3">Pick from Question Bank</div>
              {bankLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-brand-500" /></div>
              ) : bankQuestions.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-6">No questions in bank for {subject}. Add some first.</div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {bankQuestions.map((q) => {
                    const selected = Boolean(selectedQuestions.find((x) => x.id === q.id));
                    return (
                      <button key={q.id} type="button" onClick={() => toggleQuestion(q)}
                        className={`w-full flex items-start gap-2.5 rounded-xl border p-3 text-left transition focus-ring ${selected ? "border-byjus-500/50 bg-brand-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                        <div className={`h-5 w-5 shrink-0 rounded-lg border grid place-items-center mt-0.5 ${selected ? "border-brand-500 bg-byjus-500" : "border-slate-300"}`}>
                          {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-400 truncate">{q.question_text}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{q.topic} · D{q.difficulty}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </Reveal>
      )}

      {tab === "list" && (
        <Reveal delay={0.05}>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
          ) : tests.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <div className="text-base font-extrabold text-slate-800">No tests yet</div>
              <div className="mt-2 text-sm text-slate-500">Create your first mock test above.</div>
            </Card>
          ) : (
            <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {tests.map((t) => (
                <motion.div key={t.id} variants={staggerItem}>
                  <Card interactive className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`text-[10px] ${t.is_published ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                            {t.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge className="bg-brand-50 border-brand-200 text-brand-400 text-[10px]">{t.subject}</Badge>
                        </div>
                        <div className="text-sm font-extrabold text-slate-800">{t.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{t.questions.length} questions · {t.duration_min} min · {t.total_marks} marks{t.negative_marking ? " · −1 negative" : ""}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => togglePublish(t.id)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 hover:text-brand-500 transition focus-ring" title={t.is_published ? "Unpublish" : "Publish"}>
                          {t.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => deleteTest(t.id)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 hover:text-rose-400 transition focus-ring">
                          <Trash2 className="h-4 w-4" />
                        </button>
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
