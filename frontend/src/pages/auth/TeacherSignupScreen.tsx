import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { AuthFrame } from "@/pages/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, type ApiUserPublic } from "@/lib/api";
import { saveAuthSnapshot } from "@/auth/authStorage";
import { getDeviceId } from "@/lib/device";

const SUBJECTS = ["Physics", "Chemistry", "Biology"] as const;
type Subject = (typeof SUBJECTS)[number];

function toAuthUser(user: ApiUserPublic) {
  return {
    id: String(user.id ?? ""),
    name: String(user.username ?? "Teacher"),
    email: String(user.email ?? ""),
    role: "teacher" as const,
    isPaidUser: Boolean((user as any).is_paid ?? false),
    createdAt: String((user as any).created_at ?? ""),
  };
}

export function TeacherSignupScreen() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [subject, setSubject] = useState<Subject>("Physics");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Register as teacher — response already contains tokens + user
      const resp = await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        device_id: getDeviceId(),
        role: "teacher",
      });

      // 2. Save tokens directly — no need to call signIn() which hardcodes role:"student"
      saveAuthSnapshot({
        token: resp.access_token,
        accessToken: resp.access_token,
        refreshToken: resp.refresh_token,
        user: toAuthUser(resp.user),
      });
      // Notify other tabs
      try { globalThis.dispatchEvent(new Event("neet_auth_snapshot")); } catch { /* ignore */ }

      // 3. Assign subject using the teacher's own self-assign endpoint (no admin needed)
      try {
        await api.teacher.selfAssignSubject({ subject: subject as any });
      } catch {
        // Silently skip — teacher can still use the portal
      }

      navigate("/teacher", { replace: true });
    } catch (err: any) {
      // Give a clear message for the most common error
      if (err?.message?.toLowerCase().includes("already registered") || err?.status === 409) {
        setError("This email is already registered. Please log in instead.");
      } else {
        setError(err?.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      title="Teacher Sign Up"
      subtitle="Create your teacher account to manage your subject and track student performance."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">
            Full Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Arjun Verma"
            autoComplete="name"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">
            Email
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@school.com"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">
            Your Subject
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition focus-ring ${
                  subject === s
                    ? "border-byjus-500/60 bg-byjus-600/20 text-byjus-300 shadow-glow"
                    : "border-white/10 bg-white/5 text-ink-300 hover:bg-white/10"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                {s}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-500 dark:text-ink-400">
            You will be assigned to this subject. An admin can change it later.
          </p>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">
            Password
          </label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">
            Confirm Password
          </label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
          {loading ? "Creating account..." : "Create Teacher Account"}
        </Button>

        {/* Links */}
        <div className="flex flex-col items-center gap-1.5 text-sm font-semibold text-ink-400">
          <span>
            Already have an account?{" "}
            <Link to="/teacher/login" className="text-byjus-300 hover:underline">
              Login
            </Link>
          </span>
          <span>
            Not a teacher?{" "}
            <Link to="/signup" className="text-byjus-300 hover:underline">
              Student sign up
            </Link>
          </span>
        </div>
      </form>
    </AuthFrame>
  );
}
