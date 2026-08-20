import { useEffect, useState } from "react";
import { AlertTriangle, Brain, CheckCircle2, Loader2, RefreshCw, Sparkles, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GeminiMarkdown } from "@/components/ui/GeminiMarkdown";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { api } from "@/lib/api";
import { analyzePerformance } from "@/lib/gemini";
function accuracyColor(p) {
    return p >= 75 ? "text-emerald-400" : p >= 50 ? "text-amber-400" : "text-rose-400";
}
function accuracyBg(p) {
    return p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500";
}
function generateInsights(data) {
    const insights = [];
    const { total_students, avg_class_score_pct, weak_students, top_students, all_students } = data;
    if (avg_class_score_pct >= 70) {
        insights.push({ type: "positive", title: "Strong class performance", detail: `Average accuracy is ${avg_class_score_pct.toFixed(0)}% — above the 70% benchmark.` });
    }
    else if (avg_class_score_pct < 50) {
        insights.push({ type: "warning", title: "Class needs attention", detail: `Average accuracy is only ${avg_class_score_pct.toFixed(0)}%. Consider revisiting core concepts.` });
    }
    if (weak_students.length > 0) {
        const pct = Math.round((weak_students.length / total_students) * 100);
        insights.push({ type: "warning", title: `${weak_students.length} students struggling`, detail: `${pct}% of your class has accuracy below 40%. Early intervention recommended.` });
    }
    else {
        insights.push({ type: "positive", title: "No weak students detected", detail: "All students are performing above the 40% threshold." });
    }
    const noActivity = all_students.filter((s) => s.quiz_attempts === 0);
    if (noActivity.length > 0) {
        insights.push({ type: "warning", title: `${noActivity.length} inactive students`, detail: "These students haven't submitted any quizzes yet." });
    }
    const highEngagement = all_students.filter((s) => s.quiz_attempts >= 3);
    if (highEngagement.length > 0) {
        insights.push({ type: "positive", title: `${highEngagement.length} highly engaged students`, detail: "These students have completed 3+ quizzes — great engagement!" });
    }
    if (top_students.length > 0) {
        insights.push({ type: "info", title: "Top performer", detail: `${top_students[0].username} leads with ${top_students[0].accuracy_pct.toFixed(0)}% accuracy.` });
    }
    return insights;
}
export function AIInsightsDashboardScreen() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [geminiInsight, setGeminiInsight] = useState("");
    const [geminiLoading, setGeminiLoading] = useState(false);
    useEffect(() => {
        api.teacher.dashboard()
            .then(setData)
            .catch((err) => setError(err?.message ?? "Failed to load"))
            .finally(() => setLoading(false));
    }, []);
    async function fetchGeminiInsight(d) {
        setGeminiLoading(true);
        try {
            const weakTopics = d.weak_students.slice(0, 3).map((s) => s.username);
            const insight = await analyzePerformance(Math.round(d.avg_class_score_pct), weakTopics, d.subject);
            setGeminiInsight(insight);
        }
        catch {
            setGeminiInsight("Unable to fetch AI insight. Check your connection.");
        }
        finally {
            setGeminiLoading(false);
        }
    }
    useEffect(() => {
        if (data)
            fetchGeminiInsight(data);
    }, [data]);
    if (loading)
        return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-500"/></div>;
    if (error || !data)
        return (<Card className="p-8 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-rose-400 mb-3"/>
      <div className="text-base font-extrabold text-slate-800">{error ?? "No data"}</div>
      <div className="mt-2 text-sm text-slate-500">Make sure a subject is assigned to your account.</div>
    </Card>);
    const insights = generateInsights(data);
    const buckets = [
        { label: "0–25%", count: data.all_students.filter((s) => s.accuracy_pct <= 25).length, color: "bg-rose-500" },
        { label: "26–50%", count: data.all_students.filter((s) => s.accuracy_pct > 25 && s.accuracy_pct <= 50).length, color: "bg-amber-500" },
        { label: "51–75%", count: data.all_students.filter((s) => s.accuracy_pct > 50 && s.accuracy_pct <= 75).length, color: "bg-sky-500" },
        { label: "76–100%", count: data.all_students.filter((s) => s.accuracy_pct > 75).length, color: "bg-emerald-500" },
    ];
    const maxBucket = Math.max(1, ...buckets.map((b) => b.count));
    return (<div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
              <Brain className="h-5 w-5 text-brand-500"/>
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-800">AI Insights Dashboard</div>
              <div className="text-sm text-slate-500">Smart analysis of your {data.subject} class</div>
            </div>
            <Badge className="ml-auto bg-brand-50 border-brand-200 text-brand-400">{data.subject}</Badge>
          </div>
        </Card>
      </Reveal>

      {/* Gemini AI Insight — live from Google Gemini API */}
      <Reveal delay={0.04}>
        <Card className="p-5" style={{ background: "linear-gradient(135deg, rgba(0,200,83,0.08) 0%, rgba(0,200,83,0.03) 100%)", border: "1px solid rgba(0,200,83,0.2)" }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <motion.div className="h-8 w-8 rounded-xl byjus-gradient grid place-items-center" animate={{ boxShadow: ["0 0 0px rgba(0,200,83,0)", "0 0 14px rgba(0,200,83,0.5)", "0 0 0px rgba(0,200,83,0)"] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Sparkles className="h-4 w-4 text-white"/>
              </motion.div>
              <div>
                <div className="text-sm font-extrabold text-slate-800">Gemini AI Recommendation</div>
                <div className="text-[10px] text-slate-500">Powered by Google Gemini</div>
              </div>
            </div>
            <motion.button type="button" onClick={() => data && fetchGeminiInsight(data)} disabled={geminiLoading} whileHover={{ scale: 1.08, rotate: 180 }} whileTap={{ scale: 0.92 }} transition={{ duration: 0.3 }} className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 hover:text-slate-700 disabled:opacity-40 focus-ring">
              <RefreshCw className={`h-3.5 w-3.5 ${geminiLoading ? "animate-spin" : ""}`}/>
            </motion.button>
          </div>
          {geminiLoading ? (<div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-brand-500"/>
              Analyzing class performance with Gemini…
            </div>) : geminiInsight ? (<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <GeminiMarkdown content={geminiInsight}/>
            </motion.div>) : null}
        </Card>
      </Reveal>

      {/* Key metrics */}
      <Reveal delay={0.05}>
        <motion.div className="grid grid-cols-2 gap-3 sm:grid-cols-4" variants={staggerContainer} initial="hidden" animate="show">
          {[
            { label: "Total Students", value: data.total_students, icon: Users, color: "text-brand-500" },
            { label: "Avg Score", value: `${data.avg_class_score_pct.toFixed(0)}%`, icon: TrendingUp, color: accuracyColor(data.avg_class_score_pct) },
            { label: "Top Performers", value: data.top_students.length, icon: Sparkles, color: "text-amber-400" },
            { label: "Need Help", value: data.weak_students.length, icon: TrendingDown, color: data.weak_students.length > 0 ? "text-rose-400" : "text-emerald-400" },
        ].map((m) => {
            const Icon = m.icon;
            return (<motion.div key={m.label} variants={staggerItem}>
                <Card className="p-4 text-center">
                  <Icon className={`mx-auto h-5 w-5 mb-2 ${m.color}`}/>
                  <div className={`text-2xl font-extrabold ${m.color}`}>{m.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{m.label}</div>
                </Card>
              </motion.div>);
        })}
        </motion.div>
      </Reveal>

      {/* AI Insights */}
      <Reveal delay={0.08}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-brand-500"/>
            <div className="text-base font-extrabold text-slate-800">AI-Generated Insights</div>
          </div>
          <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
            {insights.map((ins, i) => (<motion.div key={i} variants={staggerItem} className={`flex items-start gap-3 rounded-2xl border p-3 ${ins.type === "positive" ? "border-emerald-500/30 bg-emerald-500/10" :
                ins.type === "warning" ? "border-amber-500/30 bg-amber-500/10" :
                    "border-brand-200 bg-byjus-600/10"}`}>
                {ins.type === "positive" ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"/> :
                ins.type === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5"/> :
                    <Zap className="h-4 w-4 text-brand-500 shrink-0 mt-0.5"/>}
                <div>
                  <div className={`text-sm font-extrabold ${ins.type === "positive" ? "text-emerald-300" : ins.type === "warning" ? "text-amber-300" : "text-brand-400"}`}>
                    {ins.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{ins.detail}</div>
                </div>
              </motion.div>))}
          </motion.div>
        </Card>
      </Reveal>

      {/* Score distribution */}
      <Reveal delay={0.11}>
        <Card className="p-5">
          <div className="text-base font-extrabold text-slate-800 mb-5">Score Distribution</div>
          <div className="flex items-end gap-4 h-32">
            {buckets.map((b) => {
            const h = (b.count / maxBucket) * 100;
            return (<div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-extrabold text-slate-500">{b.count}</div>
                  <div className="w-full flex items-end" style={{ height: "80px" }}>
                    <motion.div className={`w-full rounded-t-xl ${b.color}`} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}/>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center">{b.label}</div>
                </div>);
        })}
          </div>
        </Card>
      </Reveal>

      {/* Per-student accuracy */}
      {data.all_students.length > 0 && (<Reveal delay={0.14}>
          <Card className="p-5">
            <div className="text-base font-extrabold text-slate-800 mb-4">Individual Accuracy</div>
            <div className="space-y-3">
              {data.all_students.slice(0, 10).map((s) => (<div key={String(s.user_id)} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 truncate max-w-[160px]">{s.username}</span>
                    <span className={accuracyColor(s.accuracy_pct)}>{s.accuracy_pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div className={`h-full rounded-full ${accuracyBg(s.accuracy_pct)}`} initial={{ width: 0 }} animate={{ width: `${s.accuracy_pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }}/>
                  </div>
                </div>))}
            </div>
          </Card>
        </Reveal>)}
    </div>);
}
