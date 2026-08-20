import { useEffect, memo } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
export const CursorGlow = memo(function CursorGlow() {
    const mouseX = useMotionValue(-200);
    const mouseY = useMotionValue(-200);
    const x = useSpring(mouseX, { stiffness: 120, damping: 20 });
    const y = useSpring(mouseY, { stiffness: 120, damping: 20 });
    useEffect(() => {
        const move = (e) => {
            mouseX.set(e.clientX - 150);
            mouseY.set(e.clientY - 150);
        };
        window.addEventListener("mousemove", move, { passive: true });
        return () => window.removeEventListener("mousemove", move);
    }, [mouseX, mouseY]);
    return (<motion.div className="fixed pointer-events-none z-[9999]" style={{
            x, y,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
            willChange: "transform",
        }}/>);
});
