import animate from "tailwindcss-animate";
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { 0: "var(--bg-0)", 1: "var(--bg-1)", 2: "var(--bg-2)" },
        line: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },
        tx: { 1: "var(--tx-1)", 2: "var(--tx-2)", 3: "var(--tx-3)" },
        or: { DEFAULT: "var(--or)", hover: "var(--or-hover)" },
        laiton: { DEFAULT: "var(--laiton)" },
        ok: "var(--ok)",
        warn: "var(--warn)",
        err: "var(--err)",
        info: "var(--info)"
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"]
      },
      borderRadius: { card: "6px", ctl: "4px" }
    }
  },
  plugins: [animate]
};
