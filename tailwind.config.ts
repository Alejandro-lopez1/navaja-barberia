import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        surface: "#1E293B",
        line: "#334155",
        bone: "#F8FAFC",
        muted: "#94A3B8",
        brand: "#DC2626",
        "brand-dark": "#B91C1C",
        "tab-active": "#E2E8F0",
        poleblue: "#1D4ED8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-barlow)", "Arial Narrow", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 45px -30px rgba(0,0,0,0.9)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 220ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
