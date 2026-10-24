import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        heading: ["var(--font-sora)", "Sora", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        secondary: {
          950: "#09111f",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "card-sm": "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-md": "0 4px 16px -2px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "card-lg": "0 10px 40px -4px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.04)",
        "card-glow": "0 0 0 1px rgba(99,102,241,0.12), 0 8px 32px -4px rgba(99,102,241,0.12)",
        "glow-primary": "0 0 20px -4px rgba(99,102,241,0.35)",
        "glow-accent": "0 0 20px -4px rgba(168,85,247,0.35)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
      animation: {
        "shimmer": "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px -4px rgba(99,102,241,0.2)" },
          "50%": { boxShadow: "0 0 30px -2px rgba(99,102,241,0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "radial-gradient(at 40% 20%, rgba(99,102,241,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168,85,247,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(99,102,241,0.08) 0px, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
