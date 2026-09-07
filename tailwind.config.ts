import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // ---------------------------------------------------------------
        // Brand palette — "Apothecary Laboratory". Deliberately not another
        // black-and-gold perfume boutique: this reads like a fragrance
        // chemist's specimen room. `ink` is bottle-glass green-black,
        // `cream`/`parchment` are aged label paper, and the accent is an
        // amber tincture drawn straight from a dropper bottle. A small
        // `lab` (bench-glass green) and `stamp` (rubber-stamp red) round
        // out the two colours that only ever appear as accents, never as
        // a base.
        // ---------------------------------------------------------------
        ink: "#0F1C15",
        cream: "#F3EEDF",
        parchment: "#E8DCC0",
        accent: {
          DEFAULT: "#B8672A",
          light: "#D99456",
          dark: "#7A3F16",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Kept as an alias so nothing that already references `gold-*`
        // breaks — it now resolves to the amber tincture accent above.
        gold: {
          DEFAULT: "#B8672A",
          light: "#D99456",
          dark: "#7A3F16",
        },
        lab: {
          DEFAULT: "#2F4A3C",
          light: "#4C6B57",
          dark: "#182B21",
        },
        stamp: "#9C3B2E",
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "lab-grid": "radial-gradient(currentColor 1px, transparent 1px)",
      },
      backgroundSize: {
        "lab-grid": "18px 18px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
