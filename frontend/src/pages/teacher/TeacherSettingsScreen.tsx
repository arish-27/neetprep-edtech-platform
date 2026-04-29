import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Settings } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Reveal } from "@/components/motion/Reveal";
import { apiV2, type TeacherSettings } from "@/lib/apiV2";

const DIFF_LABELS = ["", "Easy", "Easy+", "Medium", "Hard", "Expert"];

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer py-3 border-b border-white/5 last:border-0">
      <div>
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring ${checked ? "bg-byjus-500" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export function TeacherSettingsScreen() {
  const [settings, setSettings] = useState<TeacherSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local editable state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [notifDoubts, setNotifDoubts] = useState(true);
  const [notifSubmissions, setNotifSubmissions] = useState(true);
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);
  const [defaultDiff, setDefaultDiff] = useState(3);
  const [autoPublish, setAutoPublish] = useState(false);

  useEffect(() => {
    apiV2.teacherSettings.get()
      .then((s) => {
        setSettings(s);
        setDisplayName(s.display_name);
        setBio(s.bio);
        setNotifDoubts(s.notification_doubts);
        setNotifSubmissions(s.notification_submissions);
        setNotifAnnouncements(s.notification_announcements);
        setDefaultDiff(s.default_difficulty);
        setAutoPublish(s.auto_publish_ai_questions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const updated = await apiV2.teacherSettings.update({
        display_name: displayName, bio,
        notification_doubts: notifDoubts,
        notification_submissions: notifSubmissions,
        notification_announcements: notifAnnouncements,
        default_difficulty: defaultDiff,
        auto_publish_ai_questions: autoPublish,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-100 grid place-items-center">
              <Settings className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-800">Settings</div>
              <div className="text-sm text-slate-500">Manage your teacher portal preferences</div>
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="p-5 space-y-4">
          <div className="text-base font-extrabold text-slate-800">Profile</div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400">Display Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How students see your name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief introduction for students..."
                className="w-full min-h-[80px] rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-ink-100 focus-ring placeholder:text-slate-400" />
            </div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.08}>
        <Card className="p-5">
          <div className="text-base font-extrabold text-slate-800 mb-3">Notifications</div>
          <Toggle label="New Doubts" desc="Alert when a student asks a doubt" checked={notifDoubts} onChange={setNotifDoubts} />
          <Toggle label="Assignment Submissions" desc="Alert when a student submits an assignment" checked={notifSubmissions} onChange={setNotifSubmissions} />
          <Toggle label="Announcements" desc="Notify when you post an announcement" checked={notifAnnouncements} onChange={setNotifAnnouncements} />
        </Card>
      </Reveal>

      <Reveal delay={0.11}>
        <Card className="p-5 space-y-4">
          <div className="text-base font-extrabold text-slate-800">AI Preferences</div>
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-400">Default Question Difficulty</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <button key={d} type="button" onClick={() => setDefaultDiff(d)}
                  className={`flex-1 rounded-2xl border py-2 text-xs font-extrabold transition focus-ring ${defaultDiff === d ? "border-brand-400 bg-brand-50 text-brand-400" : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>
                  {DIFF_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
          <Toggle label="Auto-publish AI Questions" desc="Automatically add AI-generated questions to your bank without review" checked={autoPublish} onChange={setAutoPublish} />
        </Card>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="flex items-center gap-3">
          <Button className="h-11 rounded-2xl flex-1" onClick={save} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save Settings"}
          </Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
