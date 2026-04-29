import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthFrame } from "@/pages/auth/AuthFrame";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/auth/AuthContext";

export function OTPVerificationScreen() {
  const navigate = useNavigate();
  const { verifyOtp, pendingOtpTarget, requestOtp } = useAuth();

  const masked = useMemo(() => {
    if (!pendingOtpTarget) return "";
    if (pendingOtpTarget.includes("@")) {
      const [u, d] = pendingOtpTarget.split("@");
      return `${u.slice(0, 2)}***@${d}`;
    }
    return pendingOtpTarget.slice(0, 3) + "****" + pendingOtpTarget.slice(-2);
  }, [pendingOtpTarget]);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthFrame
      title="Verify OTP"
      subtitle={pendingOtpTarget ? `Enter the OTP sent to ${masked}` : "Enter the OTP to continue."}
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            await verifyOtp({ code });
            navigate("/app", { replace: true });
          } catch (err: any) {
            setError(err?.message ?? "Verification failed.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-ink-700 dark:text-ink-200">OTP Code</label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            required
          />
          <div className="text-xs font-semibold text-ink-500 dark:text-ink-300">Demo: any 4-6 digits works.</div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-100">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full h-11 rounded-2xl" disabled={loading}>
          {loading ? "Verifying..." : "Verify & Continue"}
        </Button>

        <div className="flex items-center justify-between gap-3 text-sm font-semibold">
          <Link to="/forgot-password" className="text-ink-200 hover:underline">
            Change target
          </Link>
          <button
            type="button"
            className="text-byjus-300 hover:underline"
            onClick={async () => {
              if (!pendingOtpTarget) return;
              await requestOtp({ target: pendingOtpTarget });
            }}
          >
            Resend OTP
          </button>
        </div>
      </form>
    </AuthFrame>
  );
}
