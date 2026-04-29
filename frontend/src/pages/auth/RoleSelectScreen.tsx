import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { AuthFrame } from "@/pages/auth/AuthFrame";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { loadAuthRole, saveAuthRole, type AuthRole } from "@/auth/roleStorage";

export function RoleSelectScreen() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [role, setRole] = useState<AuthRole>(() => loadAuthRole());
  const from = typeof location?.state?.from === "string" ? location.state.from : undefined;

  const options = useMemo(
    () => [
      {
        id: "student" as const,
        title: "Student",
        desc: "Watch videos, attempt quizzes, and track performance.",
        icon: GraduationCap,
        accent: "from-[#a78bfa]/25 via-[#c4b5fd]/15 to-[#fb7185]/10",
      },
      {
        id: "teacher" as const,
        title: "Teacher",
        desc: "Upload content and review student progress (admin).",
        icon: ShieldCheck,
        accent: "from-[#38bdf8]/18 via-[#a78bfa]/16 to-[#fb7185]/10",
      },
    ],
    [],
  );

  return (
    <AuthFrame title="Choose your role" subtitle="Select Student or Teacher to continue.">
      <div className="grid gap-4 md:grid-cols-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = role === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => setRole(opt.id)}
              className="text-left focus-ring rounded-3xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <Card
                className={cn(
                  "p-5 relative overflow-hidden",
                  active ? "border-byjus-400/40 shadow-neon" : "hover:border-byjus-400/25",
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br", opt.accent)} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">{opt.title}</div>
                      <div className="mt-1 text-sm font-semibold text-ink-700 dark:text-ink-200">{opt.desc}</div>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-3xl border border-ink-200/70 bg-white/70 shadow-soft dark:border-white/10 dark:bg-white/10">
                      <Icon className="h-5 w-5 text-byjus-600 dark:text-byjus-400" />
                    </div>
                  </div>
                  {active ? (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-byjus-400/30 bg-byjus-500/10 px-3 py-1 text-xs font-extrabold text-byjus-700 dark:text-byjus-200">
                      Selected
                    </div>
                  ) : null}
                </div>
              </Card>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3">
        <Button
          className="h-11 rounded-2xl w-full"
          onClick={() => {
            saveAuthRole(role);
            navigate(role === "teacher" ? "/teacher/login" : "/login", {
              replace: true,
              state: from ? { from } : undefined,
            });
          }}
        >
          Continue
        </Button>

        {role === "student" ? (
          <Button
            variant="secondary"
            className="h-11 rounded-2xl w-full"
            onClick={() => {
              saveAuthRole("student");
              navigate("/signup", { replace: true, state: from ? { from } : undefined });
            }}
          >
            Create student account
          </Button>
        ) : (
          <div className="rounded-2xl border border-ink-200/70 bg-white/70 px-4 py-3 text-sm font-semibold text-ink-700 shadow-soft dark:border-white/10 dark:bg-white/5 dark:text-ink-200">
            Teacher accounts are managed by the organization. Contact your admin to get access.
          </div>
        )}
      </div>
    </AuthFrame>
  );
}
