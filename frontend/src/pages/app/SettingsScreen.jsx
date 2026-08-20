import { useMemo, useState } from "react";
import { LogOut, Shield, Smartphone, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/auth/AuthContext";
import { useAppStore } from "@/state/useAppStore";
import { cn } from "@/lib/cn";
import { getDeviceId } from "@/lib/device";
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
function ToggleRow({ label, desc, value, disabled, onChange, }) {
    return (<div className="flex items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
      <div>
        <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">{label}</div>
        <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">{desc}</div>
      </div>
      <button type="button" className={cn("relative h-8 w-14 rounded-full border shadow-soft transition focus-ring", value ? "bg-byjus-600 border-byjus-600" : "bg-white/10 border-white/10", disabled ? "opacity-60 pointer-events-none" : null)} onClick={() => onChange(!value)} aria-label={label} disabled={disabled}>
        <motion.div className="absolute top-0.5 h-7 w-7 rounded-full bg-white shadow-soft" initial={false} animate={{ x: value ? 24 : 0 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}/>
      </button>
    </div>);
}
export function SettingsScreen() {
    const { signOut, user } = useAuth();
    const defaultPlaybackRate = useAppStore((s) => s.defaultPlaybackRate);
    const setDefaultPlaybackRate = useAppStore((s) => s.setDefaultPlaybackRate);
    const theme = useAppStore((s) => s.theme);
    const toggleTheme = useAppStore((s) => s.toggleTheme);
    const deviceId = useMemo(() => getDeviceId(), []);
    const [notifications, setNotifications] = useState(true);
    const [sound, setSound] = useState(false);
    const [mobileData, setMobileData] = useState(true);
    return (<div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Settings</div>
            <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Customize your experience.</div>
          </div>
          <Badge className="bg-white/10 border-white/10 text-ink-200">{user?.role ?? "student"}</Badge>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-extrabold text-ink-900 dark:text-ink-50">
            <Shield className="h-5 w-5 text-byjus-400"/>
            Preferences
          </div>
          <div className="mt-4 space-y-3">
            <ToggleRow label="Dark mode" desc="Reduce glare and study comfortably at night." value={theme === "dark"} onChange={() => toggleTheme()}/>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Device session</div>
              <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
                One-device policy: logging in elsewhere expires this session.
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-extrabold text-ink-200 shadow-soft">
                Device ID: <span className="font-mono text-[11px]">{deviceId}</span>
              </div>
            </div>
            <ToggleRow label="Notifications" desc="Get reminders for live classes and daily goals." value={notifications} onChange={setNotifications}/>
            <ToggleRow label="Sound effects" desc="Play subtle sounds for interactions (demo toggle)." value={sound} onChange={setSound}/>
            <ToggleRow label="Mobile data mode" desc="Prefer lower bandwidth video quality (demo toggle)." value={mobileData} onChange={setMobileData}/>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-extrabold text-ink-900 dark:text-ink-50">
            <Smartphone className="h-5 w-5 text-byjus-400"/>
            Playback
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Default speed</div>
                  <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
                    Choose playback speed for videos.
                  </div>
                </div>
                <Badge className="bg-white/10 border-white/10 text-ink-200">{defaultPlaybackRate}x</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SPEEDS.map((s) => {
            const active = s === defaultPlaybackRate;
            return (<button key={s} type="button" onClick={() => setDefaultPlaybackRate(s)} className={cn("h-9 rounded-2xl border px-3 text-xs font-extrabold shadow-soft transition focus-ring", active
                    ? "border-byjus-300 bg-byjus-600 text-white"
                    : "border-white/10 bg-white/10 text-ink-200 hover:bg-white/15")}>
                      {s}x
                    </button>);
        })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-extrabold text-ink-900 dark:text-ink-50">
                <Volume2 className="h-5 w-5 text-byjus-400"/>
                Sound
              </div>
              <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
                Toggle above to enable/disable (demo).
              </div>
            </div>

            <Button variant="danger" className="h-11 w-full rounded-2xl" onClick={signOut}>
              <LogOut className="h-4 w-4"/>
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </div>);
}
