import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
export function AnimatedNumber({ value, duration = 1200, prefix = "", suffix = "", decimals = 0, className, }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });
    const startedRef = useRef(false);
    useEffect(() => {
        if (!inView || startedRef.current)
            return;
        startedRef.current = true;
        const start = 0;
        const end = value;
        const startTime = performance.now();
        function easeOutExpo(t) {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }
        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            setDisplay(start + (end - start) * eased);
            if (progress < 1)
                requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }, [inView, value, duration]);
    return (<span ref={ref} className={className}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>);
}
