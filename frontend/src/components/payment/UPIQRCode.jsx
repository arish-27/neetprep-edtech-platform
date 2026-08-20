import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, QrCode, Smartphone, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function UPIQRCode({
  upiId = "neetlearning@upi",
  payeeName = "NEET Learning Platform",
  amount = 1999,
  planName = "NEET All-Access Pro",
  note = "NEET Premium Subscription",
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  // Standard UPI URI standard format
  const encodedPayee = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(`${note} - ${planName}`);
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const appList = [
    { name: "Google Pay", color: "from-blue-500 to-emerald-500" },
    { name: "PhonePe", color: "from-purple-600 to-indigo-600" },
    { name: "Paytm", color: "from-sky-500 to-blue-600" },
    { name: "BHIM UPI", color: "from-amber-500 to-orange-600" },
    { name: "Any UPI App", color: "from-violet-500 to-fuchsia-500" },
  ];

  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 relative overflow-hidden ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Header Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-bold mb-4">
          <QrCode className="h-3.5 w-3.5" />
          <span>Scan to Pay via Any UPI App</span>
        </div>

        {/* QR Code Container with sleek border & gradient ring */}
        <div className="relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-violet-500/20 group transition-all duration-300 hover:scale-[1.02]">
          <QRCodeSVG
            value={upiUrl}
            size={200}
            level="H"
            includeMargin={false}
            fgColor="#0F172A"
            bgColor="#FFFFFF"
            imageSettings={{
              src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%237C3AED' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2v20'/><path d='m17 5-5-3-5 3'/><path d='m17 19-5 3-5-3'/></svg>",
              x: undefined,
              y: undefined,
              height: 28,
              width: 28,
              excavate: true,
            }}
          />
          <div className="mt-2 text-[11px] font-extrabold text-slate-800 tracking-wider">
            UPI QR CODE
          </div>
        </div>

        {/* Amount & Plan Pill */}
        <div className="mt-5 w-full max-w-sm">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-left">
            <div>
              <div className="text-[11px] font-medium text-ink-400">Total Payable Amount</div>
              <div className="text-xl font-extrabold text-white">₹{amount}</div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-0 font-bold text-xs py-1 px-2.5">
              Verified Merchant
            </Badge>
          </div>
        </div>

        {/* UPI ID Row with Copy */}
        <div className="mt-3 w-full max-w-sm">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-violet-950/40 border border-violet-500/30">
            <div className="text-left min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-violet-300">
                Official UPI ID
              </div>
              <div className="text-sm font-mono font-bold text-white truncate select-all">
                {upiId}
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="h-9 px-3 shrink-0 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-400/30 transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
                  <span className="text-xs font-bold text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-bold">Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Deep Link (for mobile browsers) */}
        <div className="mt-3 w-full max-w-sm">
          <a
            href={upiUrl}
            className="md:hidden flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm shadow-lg shadow-violet-600/30 active:scale-95 transition"
          >
            <Smartphone className="h-4 w-4" />
            Tap to Pay with UPI App
          </a>
        </div>

        {/* Supported Apps List */}
        <div className="mt-5 w-full pt-4 border-t border-white/10">
          <div className="text-[11px] font-semibold text-ink-400 mb-2">
            Scan & Pay using any of these apps:
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {appList.map((app) => (
              <span
                key={app.name}
                className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-ink-300 text-[11px] font-medium"
              >
                {app.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
