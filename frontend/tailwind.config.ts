import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        basin: {
          darkest: "#050a0f",
          midnight: "#081018",
          deep: "#0d1822",
          surface: "#132230",
          card: "#17293a",
          border: "#1f374d",
          borderLight: "#2e4e6b",
          teal: "#0f4c5c",
          mutedTeal: "#1f6270",
          cyan: "#0ea5e9",
          cyanAccent: "#38bdf8",
          slate: "#64748b",
          lightSlate: "#94a3b8",
          mineral: "#f1f5f9",
          mineralMuted: "#cbd5e1",
          amber: "#d97706",
          amberLight: "#f59e0b",
          emerald: "#10b981",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        editorial: "0.08em",
        wideEditorial: "0.15em",
      },
    },
  },
  plugins: [],
};

export default config;
