import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Image as ImageIcon,
  X,
  ArrowRight,
  Zap,
  Info,
  Calendar,
  FileCheck,
  Award,
  BookOpen,
  GraduationCap,
  Flame,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { UPIQRCode } from "@/components/payment/UPIQRCode";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/cn";

export function PremiumSubscriptionScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("neet_all_access_pro");

  // Form states
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState(1999);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [submittedPayment, setSubmittedPayment] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.payments
      .getConfig()
      .then((res) => {
        setConfig(res);
        setPlans(res.plans || []);
        const defaultPlan = res.plans?.find((p) => p.is_popular) || res.plans?.[0];
        if (defaultPlan) {
          setSelectedPlanId(defaultPlan.id);
          setAmount(defaultPlan.price);
        }
      })
      .catch((err) => {
        console.error("Failed to load payment config:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) ||
    plans[0] || {
      id: "neet_all_access_pro",
      name: "NEET All-Access Pro Plan",
      price: 1999,
      features: [],
    };

  const handleSelectPlan = (plan) => {
    setSelectedPlanId(plan.id);
    setAmount(plan.price);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setSubmitError("Please upload an image file (PNG, JPG, JPEG, WEBP)");
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setSubmitError(null);
    }
  };

  const handleRemoveFile = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!transactionId.trim()) {
      setSubmitError("Please enter your UPI Transaction ID or UTR number");
      return;
    }

    if (transactionId.trim().length < 4) {
      setSubmitError("Transaction ID / UTR must be at least 4 characters long");
      return;
    }

    if (!amount || amount <= 0) {
      setSubmitError("Please enter a valid payment amount");
      return;
    }

    setSubmitting(true);
    let screenshotUrl = null;

    try {
      // Step 1: Upload screenshot if present
      if (screenshotFile) {
        setUploadProgress("Uploading payment screenshot proof...");
        const formData = new FormData();
        formData.append("file", screenshotFile);
        const uploadRes = await api.payments.uploadScreenshot(formData);
        screenshotUrl = uploadRes?.screenshot_url || null;
      }

      // Step 2: Submit payment details
      setUploadProgress("Submitting payment request for admin verification...");
      const payload = {
        transaction_id: transactionId.trim(),
        amount: Number(amount),
        payment_date: new Date(paymentDate).toISOString(),
        screenshot_url: screenshotUrl,
        plan_name: selectedPlan.name,
        notes: notes.trim() || undefined,
      };

      const result = await api.payments.submit(payload);
      setSubmittedPayment(result);
    } catch (err) {
      setSubmitError(
        err?.message || "Failed to submit payment. Please try again."
      );
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Demo Notice Banner ──────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-4 md:p-5 text-ink-50 shadow-soft">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/20 grid place-items-center shrink-0 border border-amber-500/40 text-amber-400">
            <Info className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">
                DEMO / MANUAL UPI PAYMENT SYSTEM
              </span>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] py-0.5">
                No Auto-Debit
              </Badge>
            </div>
            <p className="mt-1 text-xs md:text-sm text-ink-200 font-medium leading-relaxed">
              This is a demo verification system without automatic gateway charges. Scan the UPI QR code using any UPI application (GPay, PhonePe, Paytm), complete the transfer, and submit your UTR / Transaction ID below. The administrator will review and activate your premium account.
            </p>
          </div>
        </div>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Reveal>
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-extrabold">
            <Sparkles className="h-4 w-4" />
            <span>UNLIMITED NEET CRACKER ACCESS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-ink-900 dark:text-ink-50 tracking-tight">
            Choose Your Premium Preparation Plan
          </h1>
          <p className="text-sm md:text-base text-ink-600 dark:text-ink-300 max-w-2xl mx-auto font-medium">
            Unlock all full-length mock tests, 24/7 AI tutor, high-yield revision vault, and recorded lecture archives.
          </p>
        </div>
      </Reveal>

      {/* ── Plan Selection Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleSelectPlan(plan)}
              className={cn(
                "relative rounded-3xl p-5 md:p-6 cursor-pointer border transition-all flex flex-col justify-between",
                isSelected
                  ? "border-violet-500 bg-gradient-to-b from-violet-600/15 to-fuchsia-600/10 shadow-[0_0_30px_rgba(139,92,246,0.25)] ring-2 ring-violet-500/50"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              )}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold text-[10px] px-3 py-1 shadow-md uppercase tracking-wider border-0">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
                    {plan.name}
                  </h3>
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full border flex items-center justify-center transition",
                      isSelected
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "border-white/20"
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>

                <div className="text-xs text-ink-500 dark:text-ink-400 font-semibold mb-4">
                  {plan.duration}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-black text-ink-900 dark:text-ink-50">
                    ₹{plan.price}
                  </span>
                  {plan.original_price && (
                    <span className="text-sm font-semibold text-ink-400 line-through">
                      ₹{plan.original_price}
                    </span>
                  )}
                  {plan.discount_percentage > 0 && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px] font-bold">
                      {plan.discount_percentage}% OFF
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-ink-600 dark:text-ink-300 mb-5 leading-relaxed font-medium">
                  {plan.description}
                </p>

                <div className="space-y-2 pt-3 border-t border-white/10">
                  {plan.features?.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-medium text-ink-700 dark:text-ink-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3">
                <Button
                  variant={isSelected ? "primary" : "secondary"}
                  className="w-full h-10 rounded-2xl text-xs font-extrabold"
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isSelected ? "Selected Plan" : "Select Plan"}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Submission Completed Banner ───────────────────────────────────────── */}
      <AnimatePresence>
        {submittedPayment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 p-6 md:p-8 text-center space-y-4 shadow-xl"
          >
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 grid place-items-center mx-auto text-emerald-400 shadow-glow">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-ink-900 dark:text-ink-50">
                Payment Request Submitted!
              </h2>
              <p className="text-sm font-semibold text-ink-600 dark:text-ink-200 max-w-xl mx-auto">
                Your payment of <strong className="text-emerald-300">₹{submittedPayment.amount}</strong> for{" "}
                <strong className="text-ink-50">{submittedPayment.plan_name}</strong> (UTR:{" "}
                <span className="font-mono text-ink-50">{submittedPayment.transaction_id}</span>) is currently{" "}
                <Badge className="bg-amber-500/20 text-amber-300 border-0 font-extrabold">PENDING VERIFICATION</Badge>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/20 border border-white/10 max-w-md mx-auto text-xs text-ink-300 font-medium text-left space-y-1.5">
              <div>• Our administrative team will verify your transaction details.</div>
              <div>• Upon approval, your full premium access will be unlocked automatically.</div>
              <div>• You can track the status anytime in your Payment History.</div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => navigate("/app/payments")}
                className="h-11 px-6 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
              >
                <Clock className="h-4 w-4 mr-2" />
                View Payment History
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmittedPayment(null);
                  setTransactionId("");
                  handleRemoveFile();
                }}
                className="h-11 px-6 rounded-2xl font-bold"
              >
                Submit Another Payment
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Payment & Form Section ─────────────────────────────────────────── */}
      {!submittedPayment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Dynamic UPI QR Code & Instructions */}
          <div className="lg:col-span-5 space-y-4">
            <UPIQRCode
              upiId={config?.upi_id || "neetlearning@upi"}
              payeeName={config?.payee_name || "NEET Learning Platform"}
              amount={amount}
              planName={selectedPlan.name}
            />

            {/* Step-by-Step Guide Card */}
            <Card className="p-5 space-y-3">
              <div className="text-sm font-extrabold text-ink-900 dark:text-ink-50 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-violet-400" />
                4 Easy Steps to Complete Payment
              </div>
              <ol className="space-y-2.5 text-xs text-ink-600 dark:text-ink-300 font-medium">
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-violet-500/20 text-violet-300 font-bold grid place-items-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span>Scan the QR code using GPay, PhonePe, Paytm, or any UPI app.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-violet-500/20 text-violet-300 font-bold grid place-items-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span>
                    Pay exactly <strong>₹{amount}</strong> to complete the transaction.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-violet-500/20 text-violet-300 font-bold grid place-items-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span>Copy or note the 12-digit UPI Reference / UTR Number from your payment receipt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-violet-500/20 text-violet-300 font-bold grid place-items-center shrink-0 text-[11px]">
                    4
                  </span>
                  <span>Fill out the form on the right and submit for admin approval.</span>
                </li>
              </ol>
            </Card>
          </div>

          {/* Right Column: Submission Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 md:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-violet-400" />
                  <h2 className="text-xl font-extrabold text-ink-900 dark:text-ink-50">
                    Submit Payment Details
                  </h2>
                </div>
                <p className="text-xs font-semibold text-ink-500 dark:text-ink-400 mt-1">
                  Enter your UPI transaction details so our team can verify your payment.
                </p>
              </div>

              {submitError && (
                <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selected Plan Display */}
                <div>
                  <label className="block text-xs font-extrabold text-ink-700 dark:text-ink-200 mb-1.5">
                    Selected Plan
                  </label>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-white">
                        {selectedPlan.name}
                      </div>
                      <div className="text-xs text-ink-400 font-medium">
                        {selectedPlan.duration} Access
                      </div>
                    </div>
                    <div className="text-lg font-black text-violet-300">
                      ₹{amount}
                    </div>
                  </div>
                </div>

                {/* Transaction ID / UTR Input */}
                <div>
                  <label className="block text-xs font-extrabold text-ink-700 dark:text-ink-200 mb-1.5">
                    UPI Transaction ID / UTR Number <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. 423589123456 or UPI Reference No."
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-11 rounded-2xl font-mono text-sm"
                  />
                  <div className="text-[11px] text-ink-400 mt-1">
                    Found in your UPI app payment receipt (usually 12 digits).
                  </div>
                </div>

                {/* Amount and Payment Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-ink-700 dark:text-ink-200 mb-1.5">
                      Payment Amount (₹) <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-11 rounded-2xl text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-ink-700 dark:text-ink-200 mb-1.5">
                      Payment Date <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="h-11 rounded-2xl text-sm"
                    />
                  </div>
                </div>

                {/* Optional Screenshot Upload */}
                <div>
                  <label className="block text-xs font-extrabold text-ink-700 dark:text-ink-200 mb-1.5">
                    Payment Screenshot (Optional, helps faster verification)
                  </label>

                  {screenshotPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-2 flex items-center gap-3">
                      <img
                        src={screenshotPreview}
                        alt="Payment Proof Preview"
                        className="h-20 w-20 object-cover rounded-xl border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-ink-100 truncate">
                          {screenshotFile?.name || "screenshot.png"}
                        </div>
                        <div className="text-[11px] text-ink-400">
                          {Math.round((screenshotFile?.size || 0) / 1024)} KB • Image ready
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-ink-300 hover:text-red-300 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-white/15 hover:border-violet-500/40 rounded-2xl p-4 text-center bg-white/[0.02] hover:bg-white/[0.04] transition group"
                    >
                      <Upload className="h-6 w-6 mx-auto text-ink-400 group-hover:text-violet-400 transition mb-1" />
                      <div className="text-xs font-bold text-ink-200">
                        Click or drag screenshot here
                      </div>
                      <div className="text-[10px] text-ink-400 mt-0.5">
                        PNG, JPG, JPEG up to 10MB
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-extrabold text-ink-700 dark:text-ink-200 mb-1.5">
                    Additional Remark / Note (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Paid via Google Pay from mobile +91..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-11 rounded-2xl text-xs"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>{uploadProgress || "Submitting Payment..."}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Submit Payment for Verification</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
