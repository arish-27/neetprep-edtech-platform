import { cn } from "@/lib/cn";
export function Spinner({ className }) {
    return (<div className={cn("h-5 w-5 animate-spin rounded-full border-2 border-ink-300 border-t-byjus-600 dark:border-white/20 dark:border-t-byjus-400", className)} aria-label="Loading" role="status"/>);
}
