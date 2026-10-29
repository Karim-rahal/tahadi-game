import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#070B16",
          800: "#0A0F1E",
          700: "#0F1527",
          600: "#151C32",
          500: "#1C2540",
          400: "#2A3454",
        },
        gold: {
          300: "#F7D77A",
          400: "#F5C451",
          500: "#E7B13A",
          600: "#C9962A",
        },
        teamA: {
          400: "#4FC3F7",
          500: "#2BA8E8",
          600: "#1E86C0",
        },
        teamB: {
          400: "#FB7FA0",
          500: "#F2567F",
          600: "#D23A64",
        },
        good: "#34D399",
        bad: "#F87171",
        muted: "#93A0BD",
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
        display: ["var(--font-tajawal)", "var(--font-cairo)", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,196,81,0.15), 0 20px 60px -20px rgba(0,0,0,0.7)",
        card: "0 10px 40px -15px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
