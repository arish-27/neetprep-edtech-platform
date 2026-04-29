// ── Framer Motion variants ────────────────────────────────────────────────────

export const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

export const fadeSlideDown = {
  hidden: { opacity: 0, y: -16 },
  show:   { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1 },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  show:   { opacity: 1, x: 0 },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0 },
};

// Stagger containers
export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const staggerFast = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerSlow = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// Stagger items — NO filter:blur (causes negative blur errors in browsers)
export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show:   {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export const staggerItemFast = {
  hidden: { opacity: 0, y: 10 },
  show:   {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 400, damping: 28 },
  },
};

export const staggerItemScale = {
  hidden: { opacity: 0, scale: 0.92, y: 10 },
  show:   {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 350, damping: 26 },
  },
};

// Page transitions — NO filter:blur
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
};

// Modal
export const modalOverlay = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
};

export const modalContent = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  show:   {
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
};

// Spring presets
export const springFast   = { type: "spring" as const, stiffness: 500, damping: 28 };
export const springMedium = { type: "spring" as const, stiffness: 300, damping: 24 };
export const springSlow   = { type: "spring" as const, stiffness: 150, damping: 20 };
