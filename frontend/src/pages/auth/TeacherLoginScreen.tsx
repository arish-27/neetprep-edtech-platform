import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthFrame } from "@/pages/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/auth/AuthContext";

export function TeacherLoginScreen() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const nextPath = useMemo(() => {
    const from = location?.state?.from;
    return typeof from === "string" ? from : "/teacher";
  }, [location?.state?.from]);

  const { signInTeacher } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoEmail = "teacher@demo.com";
  const demoPassword = "teacher123";

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInTeacher({ email, password });
      navigate(nextPath, { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      title="Teacher Login"
      subtitle="Access your subject dashboard, student analytics, and quiz results."
    >
      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">
            Email
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@example.com"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">
            Password
          </label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
          {loading ? "Logging in..." : "Login as Teacher"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full h-11 rounded-2xl"
          disabled={loading}
          onClick={async () => {
            setEmail(demoEmail);
            setPassword(demoPassword);
            setError(null);
            setLoading(true);
            try {
              await signInTeacher({ email: demoEmail, password: demoPassword });
              navigate(nextPath, { replace: true });
            } catch (err: any) {
              setError(err?.message ?? "Login failed.");
            } finally {
              setLoading(false);
            }
          }}
        >
          Demo Teacher Login
        </Button>

        <div className="flex flex-col items-center gap-1.5 text-sm font-semibold text-ink-400">
          <span>
            Not a teacher?{" "}
            <Link to="/login" className="text-byjus-300 hover:underline">
              Student login
            </Link>
          </span>
          <span>
            New teacher?{" "}
            <Link to="/teacher/signup" className="text-byjus-300 hover:underline">
              Create account
            </Link>
          </span>
        </div>
      </form>
    </AuthFrame>
  );
}
