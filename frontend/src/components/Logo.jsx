import { cn } from "@/lib/cn";

export function Logo({ className, compact }) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div
        className="h-10 w-10 rounded-2xl grid place-items-center relative shrink-0 overflow-hidden shadow-sm"
        style={{
          background: "linear-gradient(135deg, #5A3828 0%, #3B2318 100%)",
          border: "1px solid rgba(234, 216, 202, 0.4)",
          boxShadow: "0 4px 12px rgba(59, 35, 24, 0.18)",
        }}
      >
        {/* Subtle inner radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FBF7F2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 relative z-10"
        >
          {/* Medical Stethoscope / Cross Emblem */}
          <path d="M4.5 3h15" />
          <path d="M6 3v6a6 6 0 0 0 12 0V3" />
          <path d="M12 15v3a3 3 0 0 0 6 0v-1" />
          <circle cx="18" cy="17" r="1.5" fill="#FAD5D8" stroke="none" />
        </svg>
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className="font-serif font-black tracking-tight text-lg"
              style={{ color: "#3B2318" }}
            >
              NEET Prep
            </span>
          </div>
          <div
            className="text-[10px] font-bold tracking-wider uppercase text-[#8C6F5E]"
          >
            Medical Academy
          </div>
        </div>
      )}
    </div>
  );
}

