import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3EEE6",
        card: "#FFFCF7",
        ink: "#1C1712",
        "ink-soft": "#6B5E52",
        line: "#E4D8C6",
        walnut: "#2C241C",
        "walnut-2": "#3C3228",
        copper: "#9A4520",
        "copper-bright": "#C4622D",
        sage: "#246246",
        "sage-soft": "#E4F2EA",
        chili: "#9E342C",
        "chili-soft": "#F8E7E3",
        brass: "#8D6E32",
        "brass-soft": "#F8F1DC",
        butter: "#F6E7C1",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,252,247,0.8) inset, 0 10px 28px rgba(44, 36, 28, 0.05)",
        lift: "0 16px 40px rgba(44, 36, 28, 0.12)",
      },
      maxWidth: {
        content: "1240px",
      },
    },
  },
  plugins: [],
};

export default config;
