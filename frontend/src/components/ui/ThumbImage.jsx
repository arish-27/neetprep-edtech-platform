/**
 * A thumbnail <img> that silently falls back to a gradient placeholder
 * when the image fails to load (e.g. YouTube hqdefault 404).
 */
import { useState } from "react";
import { cn } from "@/lib/cn";
export function ThumbImage({ src, alt = "", className, fallbackClassName }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (<div className={cn("h-full w-full bg-gradient-to-br from-byjus-800/40 to-ink-950/40", fallbackClassName)}/>);
    }
    return (<img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} loading="lazy" onError={() => setFailed(true)}/>);
}
