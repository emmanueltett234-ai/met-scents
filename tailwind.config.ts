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
        // Brand palette — pixel-sampled directly from the direct style
        // reference (Inspo/original-77553b9cffbaac025edabc5b256ce677.webp),
        // not approximated. Four colors, no warm cream/brass family at all:
        // a cold near-true black, true white, a pale sage mat, and one
        // saturated olive that is the reference's ONLY interactive/accent
        // color — verified identical (same hex) on its header pill button,
        // its hero circle-arrow badge, and its full footer.
        // Token NAMES kept from the prior system (ink/cream/parchment/
        // accent/gold) so no call site needed touching — only the VALUES
        // changed, so this is a values-only, no-file-hunt rebuild.
        // ---------------------------------------------------------------
        ink: "#0A0A0A", // was warm brown-black #17140F — now cold near-true-black, sampled from the noir sections
        cream: "#FFFFFF", // was warm ivory #F6F3EC — now true white/paper, sampled from the light sections
        parchment: "#EAEFDD", // secondary light tone: a pale tint of the sage mat, not a warm off-white — ties secondary sections to the frame color instead of inventing a family the reference doesn't have
        // The pale sage mat/frame color — #D9E2C6, sampled from every edge
        // of the reference at ~5% of canvas width. Frame and light "second
        // surface" tint ONLY; never used for anything clickable — that's accent.
        sage: {
          DEFAULT: "#D9E2C6",
          light: "#EAEFDD",
          dark: "#B9C6A0",
        },
        // The reference's one interactive color — #657950, sampled pixel-
        // identical off its header "Login" pill, its hero circle-arrow
        // badge, and its footer. Was a brass/champagne token before; no
        // gold exists anywhere in the reference, so this replaces it wholesale.
        accent: {
          DEFAULT: "#657950",
          light: "#8A9B6D",
          dark: "#4A5A3A",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Kept as an alias so nothing that already references `gold-*`
        // breaks — it now resolves to the same sampled olive as `accent`,
        // not a separate gold value (the reference has no gold UI color).
        gold: {
          DEFAULT: "#657950",
          light: "#8A9B6D",
          dark: "#4A5A3A",
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
