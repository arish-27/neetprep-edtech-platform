import { cn } from "@/lib/cn";

export function Logo({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div 
        className="h-10 w-10 rounded-xl grid place-items-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)",
          boxShadow: "0 4px 12px rgba(108,92,231,0.3)",
        }}
      >
        <div className="h-4 w-4 rounded-full bg-white/95" />
      </div>
      {compact ? null : (
        <div className="leading-tight">
          <div className="font-extrabold tracking-tight text-lg" style={{ color: "#1A1D2E" }}>
            NEET
          </div>
          <div className="text-[10px] font-semibold -mt-0.5" style={{ color: "#6B7280" }}>
            Learn · Practice · Improve
          </div>
        </div>
      )}
    </div>
  );
}
