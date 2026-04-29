import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthFrame } from "@/pages/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/auth/AuthContext";
import { hasAuthRole, saveAuthRole } from "@/auth/roleStorage";

export function AdminLoginScreen() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { signInAdmin } = useAuth();
  const demoEmail = "admin@demo.com";
  const demoPassword = "admin123";
  const from = typeof location?.state?.from === "string" ? location.state.from : "/admin";

  useEffect(() => {
    if (!hasAuthRole()) {
      const nextFrom = typeof location?.state?.from === "string" ? location.state.from : undefined;
      navigate("/role", { replace: true, state: nextFrom ? { from: nextFrom } : undefined });
      return;
    }
    saveAuthRole("teacher");
  }, [location?.state?.from, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthFrame title="Teacher sign in" subtitle="Upload content and review student progress.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            await signInAdmin({ email, password });
            navigate(from, { replace: true });
          } catch (err: any) {
            setError(err?.message ?? "Login failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Teacher Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Password</label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
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
              await signInAdmin({ email: demoEmail, password: demoPassword });
              navigate(from, { replace: true });
            } catch (err: any) {
              setError(err?.message ?? "Login failed.");
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "Signing in..." : "Demo login"}
        </Button>

        <div className="text-center text-sm font-semibold text-ink-600 dark:text-ink-200">
          Are you a student?{" "}
          <Link to="/login" className="text-byjus-300 hover:underline">
            Student login
          </Link>
        </div>

      </form>
    </AuthFrame>
  );
}
