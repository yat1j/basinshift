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
        google: {
          bg: "#ffffff",
          surface: "#f8f9fa",
          surfaceHover: "#f1f3f4",
          border: "#dadce0",
          borderLight: "#e8eaed",
          text: "#202124",
          textMuted: "#3c4043",
          textSecondary: "#5f6368",
          blue: "#1a73e8",
          blueHover: "#174ea6",
          pill: "#1f1f1f",
          pillHover: "#000000",
          amber: "#e37400",
          green: "#137333",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Google Sans'",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Roboto Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
