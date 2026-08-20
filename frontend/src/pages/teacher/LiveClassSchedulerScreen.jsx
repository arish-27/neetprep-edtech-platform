import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Loader2, Plus, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2 } from "@/lib/apiV2";
const SUBJECTS = ["Physics", "Chemistry", "Biology"];
function statusColor(s) {
    if (s === "live")
        return "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
    if (s === "ended")
        return "bg-slate-100 border-slate-200 text-slate-400";
    return "bg-amber-500/20 border-amber-500/30 text-amber-300";
}
function formatDT(iso) {
    try {
        return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    catch {
        return iso;
    }
}
export function LiveClassSchedulerScreen() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("Physics");
    const [description, setDescription] = useState("");
    const [meetLink, setMeetLink] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [durationMin, setDurationMin] = useState(60);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        apiV2.liveClasses.list()
            .then(setClasses)
            .catch(() => setClasses([]))
            .finally(() => setLoading(false));
    }, []);
    async function schedule() {
        if (!title.trim() || !startsAt) {
            setError("Title and start time are required.");
            return;
        }
        setError(null);
        setSaving(true);
        try {
            const lc = await apiV2.liveClasses.schedule({
                title: title.trim(), subject, description, meet_link: meetLink,
                starts_at: new Date(startsAt).toISOString(), duration_min: durationMin,
            });
            setClasses((prev) => [lc, ...prev]);
            setTitle("");
            setDescription("");
            setMeetLink("");
            setStartsAt("");
            setDurationMin(60);
            setShowForm(false);
        }
        catch (err) {
            setError(err?.message ?? "Failed to schedule.");
        }
        finally {
            setSaving(false);
        }
    }
    async function updateStatus(id, status) {
        try {
            const updated = await apiV2.liveClasses.updateStatus(id, status);
            setClasses((prev) => prev.map((c) => c.id === id ? updated : c));
        }
        catch { /* ignore */ }
    }
    return (<div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
                <Radio className="h-5 w-5 text-brand-500"/>
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-800">Live Class Scheduler</div>
                <div className="text-sm text-slate-500 ">Schedule and manage your live sessions</div>
              </div>
            </div>
            <Button className="h-10 rounded-2xl" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : <><Plus className="h-4 w-4"/> Schedule</>}
            </Button>
          </div>
        </Card>
      </Reveal>

      {showForm && (<Reveal delay={0.05}>
          <Card className="p-5 space-y-4">
            <div className="text-base font-extrabold text-slate-800">New Live Class</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Electrostatics Marathon"/>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBJECTS.map((s) => (<button key={s} type="button" onClick={() => setSubject(s)} className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${subject === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                      {s}
                    </button>))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Start Time</label>
                <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}/>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-ink-700 ">Duration (minutes)</label>
                <Input type="number" min={15} max={240} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}/>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-extrabold text-ink-700 ">Meet Link (Google Meet / Zoom)</label>
                <Input value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..."/>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-extrabold text-ink-700 ">Description (optional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Topics to be covered..."/>
              </div>
            </div>
            {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}
            <Button className="w-full h-11 rounded-2xl" onClick={schedule} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin"/> Scheduling...</> : <><Calendar className="h-4 w-4"/> Schedule Class</>}
            </Button>
          </Card>
        </Reveal>)}

      <Reveal delay={0.1}>
        {loading ? (<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500"/></div>) : classes.length === 0 ? (<Card className="p-8 text-center">
            <Calendar className="mx-auto h-10 w-10 text-slate-400 mb-3"/>
            <div className="text-base font-extrabold text-slate-800">No classes scheduled</div>
            <div className="mt-2 text-sm text-slate-500 ">Schedule your first live class above.</div>
          </Card>) : (<motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
            {classes.map((lc) => (<motion.div key={lc.id} variants={staggerItem}>
                <Card interactive className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-[10px] ${statusColor(lc.status)}`}>{lc.status}</Badge>
                        <Badge className="bg-brand-50 border-brand-200 text-brand-400 text-[10px]">{lc.subject}</Badge>
                      </div>
                      <div className="text-sm font-extrabold text-slate-800">{lc.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDT(lc.starts_at)} · {lc.duration_min} min</div>
                      {lc.description && <div className="mt-1 text-xs text-slate-500 truncate">{lc.description}</div>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {lc.meet_link && (<a href={lc.meet_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-400 hover:text-slate-800 transition focus-ring">
                          <ExternalLink className="h-3.5 w-3.5"/> Join
                        </a>)}
                      {lc.status === "scheduled" && (<button type="button" onClick={() => updateStatus(lc.id, "live")} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/20 transition focus-ring">
                          Go Live
                        </button>)}
                      {lc.status === "live" && (<button type="button" onClick={() => updateStatus(lc.id, "ended")} className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-500 hover:bg-slate-100 transition focus-ring">
                          End
                        </button>)}
                    </div>
                  </div>
                </Card>
              </motion.div>))}
          </motion.div>)}
      </Reveal>
    </div>);
}
