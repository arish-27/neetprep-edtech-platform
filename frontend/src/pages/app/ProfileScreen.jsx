import { useMemo, useState } from "react";
import { Award, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { useAuth } from "@/auth/AuthContext";
import { staggerContainer, staggerItem } from "@/lib/motion";
export function ProfileScreen() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name ?? "Student");
    const [saving, setSaving] = useState(false);
    const badges = useMemo(() => [
        { label: "9-day streak", icon: Award },
        { label: "Quiz finisher", icon: Award },
        { label: "Notes keeper", icon: Award },
    ], []);
    return (<div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Profile</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">Your account details.</div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-ink-200/70 bg-white/70 grid place-items-center dark:border-white/10 dark:bg-white/10">
              <User className="h-5 w-5 text-byjus-500 dark:text-byjus-400"/>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-3xl border border-ink-200/70 bg-white/70 p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Email</div>
              <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-100">
                <Mail className="h-4 w-4 text-ink-500 dark:text-ink-300"/>
                {user?.email ?? "student@example.com"}
              </div>
            </div>
            <div className="rounded-3xl border border-ink-200/70 bg-white/70 p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Role</div>
              <div className="mt-1">
                <Badge>{user?.role ?? "student"}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Badges</div>
            <motion.div className="mt-3 flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
              {badges.map((b) => {
            const Icon = b.icon;
            return (<motion.span key={b.label} variants={staggerItem}>
                    <Badge>
                      <Icon className="h-3.5 w-3.5 text-byjus-500 dark:text-byjus-400"/>
                      {b.label}
                    </Badge>
                  </motion.span>);
        })}
            </motion.div>
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="p-5">
          <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Edit profile</div>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)}/>
            </div>
            <Button className="h-11 w-full rounded-2xl" disabled={saving} onClick={async () => {
            setSaving(true);
            try {
                await updateProfile({ name });
            }
            finally {
                setSaving(false);
            }
        }}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <div className="rounded-3xl border border-ink-200/70 bg-white/70 p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Next steps</div>
              <div className="mt-1 text-sm font-semibold text-ink-700 dark:text-ink-200">
                Connect this to your backend profile API when ready.
              </div>
            </div>
          </div>
        </Card>
      </Reveal>
    </div>);
}
