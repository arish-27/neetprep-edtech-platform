import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthFrame } from "@/pages/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/auth/AuthContext";
export function ForgotPasswordScreen() {
    const navigate = useNavigate();
    const { requestOtp } = useAuth();
    const [target, setTarget] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    return (<AuthFrame title="Reset password" subtitle="Enter your email or phone number to receive an OTP.">
      <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
                await requestOtp({ target });
                navigate("/otp", { replace: true });
            }
            catch (err) {
                setError(err?.message ?? "Failed to send OTP.");
            }
            finally {
                setLoading(false);
            }
        }}>
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">Email / Phone</label>
          <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="student@example.com or +91..." required/>
        </div>

        {error ? (<div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
            {error}
          </div>) : null}

        <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </Button>

        <div className="text-center text-sm font-semibold text-ink-600 dark:text-ink-200">
          Remembered your password?{" "}
          <Link to="/login" className="text-byjus-300 hover:underline">
            Back to login
          </Link>
        </div>
      </form>
    </AuthFrame>);
}
