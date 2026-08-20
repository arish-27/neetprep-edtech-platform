import { useState } from "react";
import { Brain, CheckCircle2, Copy, Loader2, Sparkles, Trash2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TopicAutocomplete } from "@/components/ui/TopicAutocomplete";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { generateNEETQuestions } from "@/lib/gemini";
const SUBJECTS = ["Physics", "Chemistry", "Biology"];
const DIFFICULTIES = [
    { value: 1, label: "Easy" },
    { value: 3, label: "Medium" },
    { value: 5, label: "Hard" },
];
// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ q, index, onRemove, }) {
    const [copied, setCopied] = useState(false);
    const correctOpt = q.options.find((o) => o.is_correct);
    function copy() {
        const text = [
            `Q${index + 1}. ${q.question_text}`,
            ...q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o.text}`),
            `Answer: ${correctOpt?.text ?? ""}`,
            `Explanation: ${q.explanation}`,
        ].join("\n");
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    const diffColor = q.difficulty <= 2 ? "text-emerald-400" :
        q.difficulty <= 3 ? "text-amber-400" : "text-rose-400";
    return (<motion.div variants={staggerItem}>
      <Card className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-xl bg-brand-100 text-xs font-extrabold text-brand-400">
              {index + 1}
            </div>
            {q.topic && (<Badge className="border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                {q.topic}
              </Badge>)}
            <span className={`text-[10px] font-extrabold ${diffColor}`}>
              D{q.difficulty}/5
            </span>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button type="button" onClick={copy} title="Copy" className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition hover:text-slate-800 focus-ring">
              {copied
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400"/>
            : <Copy className="h-3.5 w-3.5"/>}
            </button>
            <button type="button" onClick={onRemove} title="Remove" className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 transition hover:text-rose-400 focus-ring">
              <Trash2 className="h-3.5 w-3.5"/>
            </button>
          </div>
        </div>

        {/* Question text */}
        <p className="text-sm font-extrabold leading-relaxed text-slate-800">
          {q.question_text}
        </p>

        {/* Options */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options.map((opt, i) => (<div key={i} className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${opt.is_correct
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-slate-200 bg-slate-50 text-slate-500"}`}>
              <span className="shrink-0 font-extrabold">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{opt.text}</span>
              {opt.is_correct && (<CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400"/>)}
            </div>))}
        </div>

        {/* Explanation */}
        {q.explanation && (<div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            <span className="shrink-0 text-amber-400">💡</span>
            <span className="text-xs font-semibold text-amber-300">{q.explanation}</span>
          </div>)}
      </Card>
    </motion.div>);
}
// ── Main Screen ───────────────────────────────────────────────────────────────
export function AIQuestionGeneratorScreen() {
    const [topic, setTopic] = useState("");
    const [subject, setSubject] = useState("Physics");
    const [difficulty, setDifficulty] = useState(3);
    const [count, setCount] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [questions, setQuestions] = useState([]);
    async function generate() {
        const trimmed = topic.trim();
        if (!trimmed) {
            setError("Please select or type a topic first.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const diffLabel = difficulty <= 2 ? "Easy" : difficulty <= 3 ? "Medium" : "Hard";
            // Call Gemini directly using the exact API format from the curl command
            const raw = await generateNEETQuestions(trimmed, subject, count, diffLabel);
            const mapped = raw.map((q, i) => ({
                id: `gemini_${Date.now()}_${i}`,
                question_text: q.question,
                options: q.options.map((o, idx) => ({ text: o, is_correct: idx === q.answer })),
                explanation: q.explanation,
                difficulty,
                topic: trimmed,
                subject,
            }));
            if (mapped.length === 0)
                throw new Error("Gemini returned no questions. Try a different topic.");
            setQuestions(mapped);
        }
        catch (err) {
            setError(err?.message ?? "Generation failed. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100">
              <Brain className="h-5 w-5 text-brand-500"/>
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                AI Question Generator
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  <Zap className="h-2.5 w-2.5"/> Gemini
                </span>
              </div>
              <div className="text-sm text-slate-500">
                Type a topic → generate NEET MCQs instantly with Google Gemini
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Topic autocomplete — full width */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-extrabold text-ink-700 ">
                Topic
                <span className="ml-1.5 font-normal text-slate-500">
                  — type anything, suggestions appear automatically
                </span>
              </label>
              <TopicAutocomplete value={topic} subject={subject} placeholder="e.g. Electrostatics, Genetics, Kinematics…" onChange={setTopic} onSelect={setTopic}/>
              {topic.trim() && (<p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3"/>
                  Selected: <strong>{topic}</strong>
                </p>)}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-ink-700 ">Subject</label>
              <div className="grid grid-cols-3 gap-2">
                {SUBJECTS.map((s) => (<button key={s} type="button" onClick={() => { setSubject(s); setTopic(""); }} className={`rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition focus-ring ${subject === s
                ? "border-brand-400 bg-brand-50 text-brand-400 shadow-card"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                    {s}
                  </button>))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-ink-700 ">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (<button key={d.value} type="button" onClick={() => setDifficulty(d.value)} className={`rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition focus-ring ${difficulty === d.value
                ? "border-brand-400 bg-brand-50 text-brand-400 shadow-card"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                    {d.label}
                  </button>))}
              </div>
            </div>

            {/* Count */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-extrabold text-ink-700 ">
                Number of Questions
              </label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map((n) => (<button key={n} type="button" onClick={() => setCount(n)} className={`flex-1 rounded-2xl border py-2.5 text-sm font-extrabold transition focus-ring ${count === n
                ? "border-brand-400 bg-brand-50 text-brand-400 shadow-card"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                    {n}
                  </button>))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (<div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
              {error}
            </div>)}

          {/* Generate button */}
          <Button className="mt-5 h-12 w-full rounded-2xl text-base" onClick={generate} disabled={loading || !topic.trim()}>
            {loading
            ? <><Loader2 className="h-5 w-5 animate-spin"/> Generating {count} questions…</>
            : <><Sparkles className="h-5 w-5"/> Generate {count} Questions</>}
          </Button>

          {!topic.trim() && (<p className="mt-2 text-center text-xs text-slate-500">
              ↑ Select a topic above to enable generation
            </p>)}
        </Card>
      </Reveal>

      {/* Results */}
      <AnimatePresence>
        {questions.length > 0 && (<motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-extrabold text-slate-800">Generated Questions</span>
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-[10px] text-emerald-600">
                  <Zap className="h-2.5 w-2.5 mr-0.5"/> Gemini AI
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="border-slate-200 bg-slate-100 text-slate-400">
                  {questions.length} questions
                </Badge>
                <button type="button" onClick={() => setQuestions([])} className="text-xs text-slate-500 transition hover:text-rose-400">
                  Clear all
                </button>
              </div>
            </div>

            <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {questions.map((q, i) => (<QuestionCard key={q.id} q={q} index={i} onRemove={() => setQuestions((prev) => prev.filter((_, j) => j !== i))}/>))}
            </motion.div>
          </motion.div>)}
      </AnimatePresence>
    </div>);
}
