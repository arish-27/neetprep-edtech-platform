import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Calendar,
  CreditCard,
  User,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Maximize2,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Reveal } from "@/components/motion/Reveal";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

export function AdminPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Review action modal / state
  const [reviewModalPayment, setReviewModalPayment] = useState(null);
  const [reviewAction, setReviewAction] = useState("approved"); // "approved" | "rejected"
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Screenshot viewer modal
  const [previewImage, setPreviewImage] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.payments.adminList({
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 100,
          offset: 0,
        }),
        api.payments.adminStats().catch(() => null),
      ]);
      setPayments(listRes?.items || []);
      setTotal(listRes?.total || 0);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      setError(err?.message || "Failed to load payment requests");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleOpenReview = (payment, action) => {
    setReviewModalPayment(payment);
    setReviewAction(action);
    setAdminNotes(action === "rejected" ? "UTR could not be verified with bank records." : "Payment verified and approved.");
    setActionError(null);
  };

  const handleConfirmReview = async () => {
    if (!reviewModalPayment) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const updated = await api.payments.adminReview(reviewModalPayment.id, {
        status: reviewAction,
        admin_notes: adminNotes.trim() || undefined,
      });

      // Update local state list
      setPayments((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );

      // Refresh stats
      api.payments.adminStats().then((s) => setStats(s)).catch(() => {});

      setReviewModalPayment(null);
    } catch (err) {
      setActionError(err?.message || "Failed to update payment status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.transaction_id?.toLowerCase().includes(q) ||
      p.user_name?.toLowerCase().includes(q) ||
      p.user_email?.toLowerCase().includes(q) ||
      p.plan_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center text-white shadow-glow">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-ink-900 dark:text-ink-50">
                  Payment Verification Portal
                </h1>
                <p className="text-xs font-semibold text-ink-500 dark:text-ink-300">
                  Review student manual UPI submissions, inspect UTRs/screenshots, and approve premium access.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchPayments}
              disabled={loading}
              className="h-10 rounded-2xl border-white/10"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh List
            </Button>
          </div>
        </div>
      </Reveal>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              Pending Review
            </div>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats?.pending_count ?? "..."}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-0.5">
            Awaiting admin action
          </div>
        </Card>

        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
              Approved
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats?.approved_count ?? "..."}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-0.5">
            Active premium students
          </div>
        </Card>

        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-red-400 uppercase tracking-wider">
              Rejected
            </div>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats?.rejected_count ?? "..."}
          </div>
          <div className="text-[11px] text-red-300/80 mt-0.5">
            Invalid / failed transfers
          </div>
        </Card>

        <Card className="p-4 bg-violet-500/10 border-violet-500/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-extrabold text-violet-400 uppercase tracking-wider">
              Verified Revenue
            </div>
            <DollarSign className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ₹{(stats?.total_approved_amount ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-violet-300/80 mt-0.5">
            Total approved funds
          </div>
        </Card>
      </div>

      {/* ── Filters & Search ────────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 w-full sm:w-auto">
            {[
              { id: "pending", label: "Pending", count: stats?.pending_count },
              { id: "approved", label: "Approved", count: stats?.approved_count },
              { id: "rejected", label: "Rejected", count: stats?.rejected_count },
              { id: "all", label: "All Records", count: stats?.total_submissions },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5",
                    active
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-ink-400 hover:text-ink-200 hover:bg-white/5"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px]",
                        active ? "bg-white/20 text-white" : "bg-white/10 text-ink-300"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              type="text"
              placeholder="Search UTR, student, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 rounded-2xl text-xs"
            />
          </div>
        </div>
      </Card>

      {/* ── Payments List Table / Cards ───────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center text-red-400">
          <AlertCircle className="h-10 w-10 mx-auto mb-2" />
          <div className="font-bold text-sm">{error}</div>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 text-ink-500 mx-auto mb-3 opacity-50" />
          <div className="text-base font-extrabold text-ink-900 dark:text-ink-50">
            No Payment Requests Found
          </div>
          <div className="text-xs text-ink-500 dark:text-ink-400 mt-1 max-w-sm mx-auto">
            {statusFilter === "pending"
              ? "All submitted UPI payments have been verified! New requests will appear here."
              : "No payment submissions match the selected filter."}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => {
            const isPending = payment.status === "pending";
            const isApproved = payment.status === "approved";
            const isRejected = payment.status === "rejected";

            return (
              <Card
                key={payment.id}
                className={cn(
                  "p-5 transition-all",
                  isPending && "border-amber-500/30 bg-amber-500/[0.02]"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student & Payment Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Status Icon */}
                    <div
                      className={cn(
                        "h-12 w-12 rounded-2xl grid place-items-center shrink-0 text-white shadow-soft",
                        isPending && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                        isApproved && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                        isRejected && "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}
                    >
                      {isPending && <Clock className="h-6 w-6" />}
                      {isApproved && <CheckCircle2 className="h-6 w-6" />}
                      {isRejected && <XCircle className="h-6 w-6" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-ink-900 dark:text-ink-50">
                          {payment.user_name || "Student"}
                        </span>
                        <span className="text-xs text-ink-400">({payment.user_email})</span>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold py-0.5 border-0 uppercase tracking-wider",
                            isPending && "bg-amber-500/20 text-amber-300",
                            isApproved && "bg-emerald-500/20 text-emerald-300",
                            isRejected && "bg-red-500/20 text-red-300"
                          )}
                        >
                          {payment.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400 font-medium">
                        <div>
                          <strong className="text-ink-200">Plan:</strong> {payment.plan_name || "NEET Pro"}
                        </div>
                        <div>
                          <strong className="text-ink-200">UTR:</strong>{" "}
                          <span className="font-mono text-violet-300 font-bold select-all">
                            {payment.transaction_id || "N/A"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-ink-200">Paid on:</strong>{" "}
                          {new Date(payment.payment_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      {payment.notes && (
                        <div className="text-xs text-ink-300 italic pt-0.5">
                          "{payment.notes}"
                        </div>
                      )}

                      {payment.admin_notes && (
                        <div className="text-xs text-amber-300/90 pt-0.5 font-semibold">
                          Admin Remark: {payment.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Screenshot & Amount & Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                    {/* Screenshot thumbnail if available */}
                    {payment.screenshot_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(payment.screenshot_url)}
                        className="group relative h-12 w-12 rounded-xl overflow-hidden border border-white/20 bg-black/40 hover:scale-105 transition shrink-0"
                        title="Click to view full screenshot proof"
                      >
                        <img
                          src={payment.screenshot_url}
                          alt="Screenshot Proof"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Maximize2 className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="text-[10px] text-ink-500 font-semibold px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                        No Screenshot
                      </div>
                    )}

                    {/* Amount */}
                    <div className="text-right">
                      <div className="text-xl font-black text-ink-900 dark:text-ink-50">
                        ₹{payment.amount}
                      </div>
                      <div className="text-[10px] text-ink-400 font-bold uppercase">
                        INR • UPI
                      </div>
                    </div>

                    {/* Verification Actions */}
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleOpenReview(payment, "approved")}
                            className="h-9 px-3.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenReview(payment, "rejected")}
                            className="h-9 px-3.5 rounded-xl font-extrabold text-xs text-red-300 hover:bg-red-500/20 border-red-500/30"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            handleOpenReview(
                              payment,
                              isApproved ? "rejected" : "approved"
                            )
                          }
                          className="h-9 px-3 rounded-xl font-bold text-xs"
                        >
                          Change Status
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Review Confirmation Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {reviewModalPayment && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-white/15 bg-ink-950 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {reviewAction === "approved" ? (
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-2xl bg-red-500/20 text-red-400 grid place-items-center">
                      <XCircle className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-ink-50">
                      {reviewAction === "approved" ? "Approve Payment" : "Reject Payment"}
                    </h3>
                    <p className="text-xs text-ink-300 font-medium">
                      Student: {reviewModalPayment.user_name} ({reviewModalPayment.user_email})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalPayment(null)}
                  className="p-2 rounded-xl text-ink-400 hover:text-ink-100 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {actionError && (
                <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold">
                  {actionError}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-400">Plan:</span>
                  <span className="font-bold text-ink-100">{reviewModalPayment.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Amount:</span>
                  <span className="font-black text-white text-sm">₹{reviewModalPayment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Transaction ID / UTR:</span>
                  <span className="font-mono font-bold text-violet-300">{reviewModalPayment.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Date Paid:</span>
                  <span className="font-medium text-ink-200">
                    {new Date(reviewModalPayment.payment_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-ink-200 mb-1.5">
                  Admin Note / Remarks (Shown to student)
                </label>
                <Input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional remark for student"
                  className="h-10 rounded-2xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setReviewModalPayment(null)}
                  disabled={actionLoading}
                  className="h-10 px-4 rounded-2xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReview}
                  disabled={actionLoading}
                  className={cn(
                    "h-10 px-5 rounded-2xl text-xs font-extrabold text-white shadow-lg",
                    reviewAction === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-red-600 hover:bg-red-500"
                  )}
                >
                  {actionLoading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : reviewAction === "approved" ? (
                    "Confirm Approval (Unlock Pro)"
                  ) : (
                    "Confirm Rejection"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/20 bg-ink-950 p-2 shadow-2xl"
            >
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="text-xs font-bold text-ink-200">
                  Payment Proof Screenshot
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewImage}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-white/10 text-ink-200 hover:text-white"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="p-1.5 rounded-xl bg-white/10 text-ink-200 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
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
