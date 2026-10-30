import type { Config } from "tailwindcss";

/**
 * تحدي الدروندي — "arena" design system.
 *
 * Identity: a two-team duel on a bright, warm-neutral stage. The two teams are
 * the heroes — Team A in cyan, Team B in magenta — a duotone chosen so the team
 * colours never collide with good=green / bad=red. Primary actions are ink
 * (near-black) so the team colours stay the loudest thing on screen.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F2EF", // warm-neutral stage
        surface: "#FFFFFF",
        surface2: "#FAF9F7",
        line: "#E7E4DE",
        ink: {
          DEFAULT: "#191522",
          soft: "#55505F",
          muted: "#8C8796",
        },
        muted: "#8C8796",
        teamA: {
          50: "#E3F6FA",
          100: "#C5ECF3",
          400: "#1FB6D0",
          500: "#0E9CB8",
          600: "#0C7D95",
          700: "#0A6174",
        },
        teamB: {
          50: "#FBE7F3",
          100: "#F6CFE6",
          400: "#DC4FAC",
          500: "#C32E91",
          600: "#A31F76",
          700: "#81175D",
        },
        good: { 50: "#E8F6ED", 500: "#15A34A", 600: "#12823B" },
        bad: { 50: "#FBEAEA", 500: "#DC2626", 600: "#B91C1C" },
      },
      fontFamily: {
        sans: ["var(--font-plex-ar)", "system-ui", "sans-serif"],
        display: ["var(--font-readex)", "var(--font-plex-ar)", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(25,21,34,0.04), 0 6px 20px -12px rgba(25,21,34,0.18)",
        card: "0 2px 4px rgba(25,21,34,0.04), 0 18px 40px -24px rgba(25,21,34,0.28)",
        pop: "0 10px 30px -10px rgba(25,21,34,0.35)",
        teamA: "0 14px 36px -16px rgba(14,156,184,0.55)",
        teamB: "0 14px 36px -16px rgba(195,46,145,0.5)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "60%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "flash-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both",
        pop: "pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        "flash-in": "flash-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
