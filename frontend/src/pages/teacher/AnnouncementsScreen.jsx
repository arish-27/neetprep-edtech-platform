import { useEffect, useState } from "react";
import { Bell, Loader2, Pin, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { apiV2 } from "@/lib/apiV2";
const SUBJECTS = ["Physics", "Chemistry", "Biology"];
const PRIORITIES = [
    { value: "low", label: "Low", cls: "bg-slate-100 border-slate-200 text-slate-400" },
    { value: "normal", label: "Normal", cls: "bg-sky-500/20 border-sky-500/30 text-sky-300" },
    { value: "high", label: "High", cls: "bg-amber-500/20 border-amber-500/30 text-amber-300" },
    { value: "urgent", label: "Urgent", cls: "bg-rose-500/20 border-rose-500/30 text-rose-300" },
];
function priorityCls(p) {
    return PRIORITIES.find((x) => x.value === p)?.cls ?? PRIORITIES[1].cls;
}
function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    catch {
        return "";
    }
}
export function AnnouncementsScreen() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [subject, setSubject] = useState("Physics");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [priority, setPriority] = useState("normal");
    const [pinned, setPinned] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        apiV2.announcements.list().then(setAnnouncements).catch(() => setAnnouncements([])).finally(() => setLoading(false));
    }, []);
    async function post() {
        if (!title.trim() || !body.trim())
            return;
        setSaving(true);
        try {
            const a = await apiV2.announcements.create({ subject, title: title.trim(), body: body.trim(), priority, pinned });
            setAnnouncements((prev) => [a, ...prev]);
            setTitle("");
            setBody("");
            setPriority("normal");
            setPinned(false);
            setShowForm(false);
        }
        catch { /* ignore */ }
        finally {
            setSaving(false);
        }
    }
    async function del(id) {
        try {
            await apiV2.announcements.delete(id);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        }
        catch { /* ignore */ }
    }
    return (<div className="space-y-5">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
                <Bell className="h-5 w-5 text-brand-500"/>
              </div>
              <div>
                <div className="text-lg font-extrabold text-slate-800">Announcements</div>
                <div className="text-sm text-slate-500">Broadcast messages to your students</div>
              </div>
            </div>
            <Button className="h-10 rounded-2xl" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cancel" : <><Plus className="h-4 w-4"/> Post</>}
            </Button>
          </div>
        </Card>
      </Reveal>

      {showForm && (<Reveal delay={0.05}>
          <Card className="p-5 space-y-4">
            <div className="text-base font-extrabold text-slate-800">New Announcement</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400">Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBJECTS.map((s) => (<button key={s} type="button" onClick={() => setSubject(s)} className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition focus-ring ${subject === s ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                      {s}
                    </button>))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400">Priority</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITIES.map((p) => (<button key={p.value} type="button" onClick={() => setPriority(p.value)} className={`rounded-xl border px-2 py-1.5 text-[10px] font-extrabold transition focus-ring ${priority === p.value ? p.cls : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>
                      {p.label}
                    </button>))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Test postponed to Friday"/>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement..." className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-ink-100 focus-ring placeholder:text-slate-400"/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded"/>
              <span className="text-xs font-semibold text-slate-500">Pin this announcement</span>
            </label>
            <Button className="w-full h-11 rounded-2xl" onClick={post} disabled={saving || !title.trim() || !body.trim()}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin"/> Posting...</> : "Post Announcement"}
            </Button>
          </Card>
        </Reveal>)}

      {loading ? (<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-500"/></div>) : announcements.length === 0 ? (<Card className="p-8 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-400 mb-3"/>
          <div className="text-base font-extrabold text-slate-800">No announcements yet</div>
          <div className="mt-2 text-sm text-slate-500">Post your first announcement above.</div>
        </Card>) : (<motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
          {announcements.map((a) => (<motion.div key={a.id} variants={staggerItem}>
              <Card className={`p-5 ${a.pinned ? "border-brand-200" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-brand-500 shrink-0"/>}
                      <Badge className={`text-[10px] ${priorityCls(a.priority)}`}>{a.priority}</Badge>
                      <Badge className="bg-brand-50 border-brand-200 text-brand-400 text-[10px]">{a.subject}</Badge>
                      <span className="text-[10px] text-slate-500">{formatDate(a.created_at)}</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-800">{a.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{a.body}</div>
                    <div className="mt-1 text-[10px] text-slate-500">by {a.teacher_name}</div>
                  </div>
                  <button type="button" onClick={() => del(a.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400 hover:text-rose-400 transition focus-ring">
                    <Trash2 className="h-3.5 w-3.5"/>
                  </button>
                </div>
              </Card>
            </motion.div>))}
        </motion.div>)}
    </div>);
}
