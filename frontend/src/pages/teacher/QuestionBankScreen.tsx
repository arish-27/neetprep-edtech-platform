import { useEffect, useState } from "react";
import { BookOpen, Loader2, Search, Sparkles, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TopicAutocomplete } from "@/components/ui/TopicAutocomplete";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2, type BankQuestion, type GeneratedQuestion } from "@/lib/apiV2";

const SUBJECTS = ["Physics", "Chemistry", "Biology"];
const DIFF_LABELS = ["", "Easy", "Easy+", "Medium", "Hard", "Expert"];
const DIFF_COLORS = ["", "text-emerald-400", "text-sky-400", "text-amber-400", "text-orange-400", "text-rose-400"];

export function QuestionBankScreen() {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterDiff, setFilterDiff] = useState(0);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"bank" | "add" | "import">("bank");

  // Add form
  const [qText, setQText] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [saving, setSaving] = useState(false);

  // Import from AI
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<GeneratedQuestion[]>([]);
  const [importing, setImporting] = useState(false);

  function load() {
    setLoading(true);
    apiV2.questionBank.list({
      subject: filterSubject === "All" ? undefined : filterSubject,
      difficulty: filterDiff || undefined,
    }).then(setQuestions).catch(() => setQuestions([])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filterSubject, filterDiff]);

  const filtered = questions.filter((q) =>
    !search || q.question_text.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase())
  );

  async function addQuestion() {
    if (!qText.trim() || opts.some((o) => !o.trim())) return;
    setSaving(true);
    try {
      const q = await apiV2.questionBank.add({ subject, topic, question_text: qText.trim(), options: opts, correct_index: correctIdx, explanation, difficulty, tags: "", source: "manual" });
      setQuestions((prev) => [q, ...prev]);
      setQText(""); setOpts(["", "", "", ""]); setExplanation(""); setTopic(""); setTab("bank");
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  async function generateAI() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiV2.ai.generateQuestions({ topic: aiTopic.trim(), subject, count: 5 });
      setAiQuestions(res.questions);
    } catch { /* ignore */ } finally { setAiLoading(false); }
  }

  async function importAI() {
    if (aiQuestions.length === 0) return;
    setImporting(true);
    try {
      const toAdd = aiQuestions.map((q) => ({
        subject, topic: q.topic, question_text: q.question_text,
        options: q.options.map((o) => o.text),
        correct_index: q.options.findIndex((o) => o.is_correct),
        explanation: q.explanation, difficulty: q.difficulty, tags: "", source: "ai" as const,
      }));
      const added = await apiV2.questionBank.bulkAdd(toAdd);
      setQuestions((prev) => [...added, ...prev]);
      setAiQuestions([]); setAiTopic(""); setTab("bank");
    } catch { /* ignore */ } finally { setImporting(false); }
  }

  async function deleteQ(id: string) {
    try {
      await apiV2.questionBank.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
                <BookOpen className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-800">Question Bank</div>
                <div className="text-sm text-slate-500">{questions.length} questions saved</div>
              </div>
            </div>
            <div className="flex gap-2">
              {(["bank", "add", "import"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`rounded-2xl border px-3 py-1.5 text-xs font-extrabold transition focus-ring capitalize ${tab === t ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  {t === "import" ? "AI Import" : t === "add" ? "+ Add" : "Bank"}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </Reveal>

      {tab === "bank" && (
        <>
          <Reveal delay={0.05}>
            <Card className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="pl-9" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["All", ...SUBJECTS].map((s) => (
                    <button key={s} type="button" onClick={() => setFilterSubject(s)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${filterSubject === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </Reveal>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <div className="text-base font-extrabold text-slate-800">No questions yet</div>
              <div className="mt-2 text-sm text-slate-500">Add manually or import from AI.</div>
            </Card>
          ) : (
            <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="show">
              {filtered.map((q) => (
                <motion.div key={q.id} variants={staggerItem}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className="bg-brand-50 border-brand-200 text-brand-400 text-[10px]">{q.subject}</Badge>
                          {q.topic && <span className="text-[10px] text-slate-500">{q.topic}</span>}
                          <span className={`text-[10px] font-extrabold ${DIFF_COLORS[q.difficulty]}`}>{DIFF_LABELS[q.difficulty]}</span>
                          <Badge className={`text-[10px] ${q.source === "ai" ? "bg-purple-500/20 border-purple-500/30 text-purple-300" : "bg-slate-100 border-slate-200 text-slate-400"}`}>{q.source}</Badge>
                        </div>
                        <div className="text-sm font-semibold text-slate-800">{q.question_text}</div>
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          {q.options.map((o, i) => (
                            <div key={i} className={`text-xs px-2 py-1 rounded-lg ${i === q.correct_index ? "text-emerald-300 bg-emerald-500/10" : "text-slate-400"}`}>
                              {String.fromCharCode(65 + i)}. {o}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={() => deleteQ(q.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400 hover:text-rose-400 transition focus-ring">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {tab === "add" && (
        <Reveal delay={0.05}>
          <Card className="p-5 space-y-4">
            <div className="text-base font-extrabold text-slate-800">Add Question Manually</div>
            <div className="grid gap-3 md:grid-cols-2">
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
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400">Topic</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Newton's Laws" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400">Question</label>
              <textarea value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Enter question text..."
                className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-ink-100 focus-ring placeholder:text-slate-400" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-400">Options (click to mark correct)</label>
              {opts.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <button type="button" onClick={() => setCorrectIdx(i)}
                    className={`h-9 w-9 shrink-0 rounded-xl border text-xs font-extrabold transition focus-ring ${correctIdx === i ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300" : "border-slate-200 bg-slate-100 text-slate-400"}`}>
                    {String.fromCharCode(65 + i)}
                  </button>
                  <Input value={o} onChange={(e) => setOpts((prev) => prev.map((x, j) => j === i ? e.target.value : x))} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400">Explanation</label>
              <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Why is this the correct answer?" />
            </div>
            <Button className="w-full h-11 rounded-2xl" onClick={addQuestion} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Add to Bank"}
            </Button>
          </Card>
        </Reveal>
      )}

      {tab === "import" && (
        <Reveal delay={0.05}>
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-500" />
              <div className="text-base font-extrabold text-slate-800">Import from AI</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBJECTS.map((s) => (
                    <button key={s} type="button" onClick={() => { setSubject(s); setAiTopic(""); }}
                      className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${subject === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400">
                  Topic
                  <span className="ml-1 font-normal text-slate-500">— type to see suggestions</span>
                </label>
                <TopicAutocomplete
                  value={aiTopic}
                  subject={subject}
                  placeholder="e.g. Electrostatics, Genetics…"
                  onChange={setAiTopic}
                  onSelect={setAiTopic}
                />
              </div>
            </div>

            <Button
              className="w-full h-11 rounded-2xl"
              onClick={generateAI}
              disabled={aiLoading || !aiTopic.trim()}
            >
              {aiLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                : <><Sparkles className="h-4 w-4" /> Generate Questions for "{aiTopic || "…"}"</>}
            </Button>

            {!aiTopic.trim() && (
              <p className="text-center text-xs text-slate-500">
                Select a topic above to enable generation
              </p>
            )}

            {aiQuestions.length > 0 && (
              <>
                <div className="space-y-2">
                  {aiQuestions.map((q, i) => (
                    <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-extrabold text-slate-800">{i + 1}. {q.question_text}</div>
                      <div className="mt-1 grid grid-cols-2 gap-1">
                        {q.options.map((o, j) => (
                          <div key={j} className={`text-[10px] px-2 py-0.5 rounded ${o.is_correct ? "text-emerald-300" : "text-slate-500"}`}>
                            {String.fromCharCode(65 + j)}. {o.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full h-11 rounded-2xl" onClick={importAI} disabled={importing}>
                  {importing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                    : `Import ${aiQuestions.length} Questions to Bank`}
                </Button>
              </>
            )}
          </Card>
        </Reveal>
      )}
    </div>
  );
}
