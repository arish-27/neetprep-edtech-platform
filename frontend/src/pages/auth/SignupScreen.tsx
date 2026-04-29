import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthFrame } from "@/pages/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/auth/AuthContext";
import { hasAuthRole, saveAuthRole } from "@/auth/roleStorage";

export function SignupScreen() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { signUp } = useAuth();

  useEffect(() => {
    if (!hasAuthRole()) {
      const from = typeof location?.state?.from === "string" ? location.state.from : undefined;
      navigate("/role", { replace: true, state: from ? { from } : undefined });
      return;
    }
    saveAuthRole("student");
  }, [location?.state?.from, navigate]);

  const from = typeof location?.state?.from === "string" ? location.state.from : "/app";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthFrame title="Create account" subtitle="Start your NEET prep journey with structured learning and practice.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            await signUp({ name, email, password });
            navigate(from, { replace: true });
          } catch (err: any) {
            setError(err?.message ?? "Signup failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            type="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Password</label>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            type="password"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </Button>

        <div className="text-center text-sm font-semibold text-ink-600 dark:text-ink-200">
          Already have an account?{" "}
          <Link to="/login" className="text-byjus-300 hover:underline">
            Login
          </Link>
        </div>
      </form>
    </AuthFrame>
  );
}
