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
        // Brand palette — taken directly from the Met Scents monogram: a
        // fine-line black-on-neutral-grey crest with a widely tracked
        // small-caps wordmark. The logo itself carries no colour, so the
        // site stays true to that — near-black ink, warm ivory/grey paper —
        // with a single restrained accent: an aged brass/champagne, the
        // tone of an engraved emblem plate, not a bright "perfume gold".
        // ---------------------------------------------------------------
        ink: "#17140F",
        cream: "#F6F3EC",
        parchment: "#E6E2D8",
        accent: {
          DEFAULT: "#8C7752",
          light: "#B9A97E",
          dark: "#5E4E33",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Kept as an alias so nothing that already references `gold-*`
        // breaks — it now resolves to the brass accent above.
        gold: {
          DEFAULT: "#8C7752",
          light: "#B9A97E",
          dark: "#5E4E33",
        },
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
        // Fraunces — moderate-contrast, warm-natured serif carrying every
        // headline, product name and (via italic) price/quote accent.
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        // `accent` is the same family, kept as its own token only so the
        // many existing `font-accent italic` call sites (prices, quotes)
        // don't need touching — both resolve to Fraunces.
        accent: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        // Deliberately restrained — enough to read as a considered editorial
        // choice on nav/labels without tipping into the "everything is
        // spaced-out uppercase" template look.
        widest2: "0.1em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
