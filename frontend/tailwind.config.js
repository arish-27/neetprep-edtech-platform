export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
            },
            colors: {
                // ── Primary purple ────────────────────────────────────────────────────
                brand: {
                    50: "#F5F3FF",
                    100: "#EDE9FE",
                    200: "#DDD6FE",
                    300: "#C4B5FD",
                    400: "#A29BFE",
                    500: "#6C5CE7",
                    600: "#5A4BD1",
                    700: "#4C3BBF",
                    800: "#3730A3",
                    900: "#312E81",
                    950: "#1E1B4B",
                },
                // ── Teal accent ───────────────────────────────────────────────────────
                teal: {
                    50: "#E0F7FA",
                    100: "#B2EBF2",
                    400: "#26C6DA",
                    500: "#00BCD4",
                    600: "#00ACC1",
                },
                // ── Page surfaces ─────────────────────────────────────────────────────
                page: {
                    bg: "#FBF8F3",
                    card: "#FFFFFF",
                },
                // ── Neutral ───────────────────────────────────────────────────────────
                slate: {
                    50: "#F8FAFC",
                    100: "#F1F5F9",
                    200: "#E2E8F0",
                    300: "#CBD5E1",
                    400: "#94A3B8",
                    500: "#64748B",
                    600: "#475569",
                    700: "#334155",
                    800: "#1E293B",
                    900: "#0F172A",
                },
                // ── Backward compat ───────────────────────────────────────────────────
                byjus: {
                    50: "#F5F3FF",
                    100: "#EDE9FE",
                    200: "#DDD6FE",
                    300: "#C4B5FD",
                    400: "#A29BFE",
                    500: "#6C5CE7",
                    600: "#5A4BD1",
                    700: "#4C3BBF",
                    800: "#3730A3",
                    900: "#312E81",
                },
                ink: {
                    50: "#F8FAFC",
                    100: "#F1F5F9",
                    200: "#E2E8F0",
                    300: "#CBD5E1",
                    400: "#64748B",
                    500: "#475569",
                    600: "#334155",
                    700: "#1E293B",
                    800: "#0F172A",
                    900: "#020617",
                    950: "#010409",
                },
            },
            boxShadow: {
                card: "0 4px 20px rgba(108,92,231,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                "card-hover": "0 8px 30px rgba(108,92,231,0.15), 0 2px 8px rgba(0,0,0,0.06)",
                btn: "0 4px 14px rgba(108,92,231,0.4)",
                "btn-hover": "0 6px 20px rgba(108,92,231,0.5)",
                glow: "0 4px 14px rgba(108,92,231,0.3)",
                "glow-sm": "0 2px 8px rgba(108,92,231,0.2)",
                neon: "0 4px 14px rgba(108,92,231,0.35)",
                "neon-cyan": "0 4px 14px rgba(0,188,212,0.35)",
                soft: "0 2px 12px rgba(108,92,231,0.06)",
                float: "0 20px 60px rgba(108,92,231,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            },
            borderRadius: {
                "4xl": "2rem",
                "5xl": "2.5rem",
            },
            keyframes: {
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-8px)" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(16px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideInRight: {
                    "0%": { opacity: "0", transform: "translateX(24px)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
                scaleIn: {
                    "0%": { opacity: "0", transform: "scale(0.94)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                pulseGlow: {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(108,92,231,0.4)" },
                    "50%": { boxShadow: "0 0 0 8px rgba(108,92,231,0)" },
                },
            },
            animation: {
                shimmer: "shimmer 1.6s linear infinite",
                float: "float 4s ease-in-out infinite",
                "float-slow": "float 6s ease-in-out infinite",
                "fade-in-up": "fadeInUp 0.4s cubic-bezier(.16,1,.3,1) both",
                "slide-in-right": "slideInRight 0.3s cubic-bezier(.16,1,.3,1) both",
                "scale-in": "scaleIn 0.3s cubic-bezier(.16,1,.3,1) both",
                "pulse-glow": "pulseGlow 2s ease-in-out infinite",
            },
            transitionTimingFunction: {
                spring: "cubic-bezier(.16,1,.3,1)",
                bounce: "cubic-bezier(.34,1.56,.64,1)",
            },
        },
    },
    plugins: [],
};
