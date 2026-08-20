import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info,
  Maximize2,
  X,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Reveal } from "@/components/motion/Reveal";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/cn";

const STATUS_CONFIG = {
  approved: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    badgeBg: "bg-emerald-500/20 text-emerald-300",
    label: "Approved",
    desc: "Payment verified. All premium features unlocked!",
  },
  pending: {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    badgeBg: "bg-amber-500/20 text-amber-300",
    label: "Pending Verification",
    desc: "Your payment request is being reviewed by the administrator.",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/20",
    badgeBg: "bg-red-500/20 text-red-300",
    label: "Rejected",
    desc: "Payment could not be verified. Please check UTR or submit again.",
  },
};

function PaymentCard({ payment, onPreviewScreenshot }) {
  const statusKey = payment.status?.toLowerCase() || "pending";
  const config =
    STATUS_CONFIG[statusKey] ||
    (statusKey === "success" ? STATUS_CONFIG.approved : STATUS_CONFIG.pending);
  const Icon = config.icon;

  const date = new Date(
    payment.payment_date || payment.created_at
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="p-5 relative overflow-hidden transition-all hover:border-white/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Icon & Details */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div
            className={`h-11 w-11 rounded-2xl ${config.bg} grid place-items-center shrink-0 border border-white/10`}
          >
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold text-ink-900 dark:text-ink-50">
                {payment.plan_name || "NEET Pro Subscription"}
              </span>
              <Badge className={`${config.badgeBg} border-0 text-[10px] font-extrabold uppercase py-0.5`}>
                {config.label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400 font-semibold">
              <div>
                <span>Paid Date: </span>
                <strong className="text-ink-300">{date}</strong>
              </div>
              {payment.transaction_id && (
                <div>
                  <span>Transaction ID / UTR: </span>
                  <span className="font-mono font-bold text-violet-400 select-all">
                    {payment.transaction_id}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-ink-400 font-medium">
              {config.desc}
            </p>

            {payment.admin_notes && (
              <div className="text-xs text-amber-300 font-semibold pt-0.5">
                Admin Remark: {payment.admin_notes}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Screenshot preview & Amount */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
          {payment.screenshot_url && (
            <button
              type="button"
              onClick={() => onPreviewScreenshot(payment.screenshot_url)}
              className="group relative h-12 w-12 rounded-xl overflow-hidden border border-white/20 bg-black/40 hover:scale-105 transition shrink-0"
              title="View uploaded screenshot proof"
            >
              <img
                src={payment.screenshot_url}
                alt="Proof"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Maximize2 className="h-4 w-4 text-white" />
              </div>
            </button>
          )}

          <div className="text-right">
            <div className="text-xl font-black text-ink-900 dark:text-ink-50">
              ₹{payment.amount}
            </div>
            <div className="text-[10px] text-ink-400 font-bold uppercase">
              INR • UPI Transfer
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PaymentHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchPayments = () => {
    setLoading(true);
    api.payments
      .myPayments({ limit: 50, offset: 0 })
      .then((data) => setPayments(data.items ?? []))
      .catch((err) => setError(err?.message ?? "Failed to load payments"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* ── Demo Notice ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between gap-3 text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Demo UPI Payment System:</strong> Payments are verified manually by administrators.
          </span>
        </div>
        <Link
          to="/app/premium"
          className="shrink-0 font-extrabold text-amber-300 hover:text-white underline"
        >
          Subscribe / Upgrade
        </Link>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center shrink-0 shadow-glow text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-ink-900 dark:text-ink-50">
                Payment History
              </div>
              <div className="text-xs font-semibold text-ink-600 dark:text-ink-300">
                Track all your UPI payment requests and verification status.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchPayments}
              disabled={loading}
              className="h-9 rounded-xl border-white/10 text-xs font-bold"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
              Refresh
            </Button>

            <Link to="/app/premium">
              <Button
                size="sm"
                className="h-9 rounded-xl font-extrabold text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Get Premium
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ── Loading Skeleton ────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Error State ─────────────────────────────────────────────────────── */}
      {error && (
        <Card className="p-6 text-center">
          <XCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <div className="text-sm font-semibold text-red-300">{error}</div>
        </Card>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {!loading && !error && payments.length === 0 && (
        <Card className="p-10 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-violet-600/15 border border-violet-500/30 grid place-items-center mx-auto text-violet-400">
            <CreditCard className="h-8 w-8" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
              No Payment Requests Yet
            </div>
            <div className="text-xs font-semibold text-ink-600 dark:text-ink-300 max-w-sm mx-auto mt-1">
              You haven't submitted any payment requests yet. Upgrade to unlock all NEET lectures, test series, and AI tutor.
            </div>
          </div>
          <Link to="/app/premium">
            <Button className="h-10 px-6 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Explore Premium Plans
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </Card>
      )}

      {/* ── Payment Cards List ──────────────────────────────────────────────── */}
      {!loading && !error && payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onPreviewScreenshot={(url) => setPreviewImage(url)}
            />
          ))}
        </div>
      )}

      {/* ── Screenshot Viewer Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/20 bg-ink-950 p-2 shadow-2xl"
            >
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="text-xs font-bold text-ink-200">
                  Payment Proof Screenshot
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl bg-white/10 text-ink-200 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-2 max-h-[70vh] overflow-auto flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Full Screenshot Proof"
                  className="max-h-[68vh] max-w-full rounded-2xl object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
