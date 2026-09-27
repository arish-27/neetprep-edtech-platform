// ── Framer Motion variants ────────────────────────────────────────────────────
export const fadeSlideUp = {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0 },
};
export const fadeSlideDown = {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0 },
};
export const fadeIn = {
    hidden: { opacity: 1 },
    show: { opacity: 1 },
};
export const scaleIn = {
    hidden: { opacity: 1, scale: 1 },
    show: { opacity: 1, scale: 1 },
};
export const slideInLeft = {
    hidden: { opacity: 1, x: 0 },
    show: { opacity: 1, x: 0 },
};
export const slideInRight = {
    hidden: { opacity: 1, x: 0 },
    show: { opacity: 1, x: 0 },
};
// Stagger containers
export const staggerContainer = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0,
            delayChildren: 0,
        },
    },
};
export const staggerFast = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0,
            delayChildren: 0,
        },
    },
};
export const staggerSlow = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0,
            delayChildren: 0,
        },
    },
};
// Stagger items — NO filter:blur (causes negative blur errors in browsers)
export const staggerItem = {
    hidden: { opacity: 1, y: 0 },
    show: {
        opacity: 1, y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
};
export const staggerItemFast = {
    hidden: { opacity: 1, y: 0 },
    show: {
        opacity: 1, y: 0,
        transition: { type: "spring", stiffness: 400, damping: 28 },
    },
};
export const staggerItemScale = {
    hidden: { opacity: 1, scale: 1, y: 0 },
    show: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: "spring", stiffness: 350, damping: 26 },
    },
};
// Page transitions — NO filter:blur
export const pageTransition = {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 1 },
    transition: { duration: 0, ease: [0.16, 1, 0.3, 1] },
};
// Modal
export const modalOverlay = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.2 } },
};
export const modalContent = {
    hidden: { opacity: 0, scale: 0.94, y: 16 },
    show: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: "spring", stiffness: 380, damping: 28 },
    },
};
// Spring presets
export const springFast = { type: "spring", stiffness: 500, damping: 28 };
export const springMedium = { type: "spring", stiffness: 300, damping: 24 };
export const springSlow = { type: "spring", stiffness: 150, damping: 20 };
