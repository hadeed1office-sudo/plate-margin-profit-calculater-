import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#07100C",
        cream: "#F2EBDD",
        soft: "#101C16",
        card: "#0D1812",
        ink: "#F6F3E9",
        "ink-soft": "#AEB8AF",
        muted: "#8E9A91",
        line: "rgba(221,232,223,0.15)",
        "line-soft": "rgba(221,232,223,0.08)",
        brand: "#718C78",
        "brand-dark": "#4F6857",
        "brand-soft": "#DDE8DF",
        mist: "#16261C",
        sage: "#5F8A68",
        "sage-soft": "rgba(95,138,104,0.18)",
        brass: "#C6954B",
        "brass-soft": "rgba(198,149,75,0.18)",
        chili: "#C66B62",
        "chili-soft": "rgba(198,107,98,0.18)",
        info: "#6D8D91",
        "info-soft": "rgba(109,141,145,0.18)",
        copper: "#718C78",
        "copper-bright": "#DDE8DF",
        butter: "#16261C",
        paper: "#07100C",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        sora: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(221,232,223,0.04), 0 18px 40px rgba(0,0,0,0.28)",
        lift: "0 18px 48px rgba(0,0,0,0.45)",
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
