import { cn } from "@/lib/cn";
const variantClasses = {
    default: "badge-gray",
    brand: "badge-purple",
    success: "badge-green",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-600 border border-red-200",
    info: "badge-blue",
    outline: "bg-transparent border border-slate-300 text-slate-600",
    orange: "badge-orange",
};
export function Badge({ className, variant = "default", ...props }) {
    return (<span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", variantClasses[variant], className)} {...props}/>);
}
