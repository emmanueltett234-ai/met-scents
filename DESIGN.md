---
name: Met Scents
description: A curated fragrance boutique in Accra — rebuilt 1:1 from a pixel-sampled reference, not a loose inspiration pass
colors:
  ink: "#0A0A0A"
  cream: "#FFFFFF"
  parchment: "#EAEFDD"
  sage: "#D9E2C6"
  sage-dark: "#B9C6A0"
  accent: "#657950"
  accent-light: "#8A9B6D"
  accent-dark: "#4A5A3A"
typography:
  display:
    fontFamily: "Bodoni Moda, ui-serif, Georgia, serif"
    fontSize: "clamp(3rem, 9vw, 5.4rem)"
    fontWeight: 500
    lineHeight: 0.98
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.1em"
rounded:
  DEFAULT: "0.75rem"
  pill: "9999px"
spacing:
  section-y: "6rem"
  frame: "clamp(14px, 4vw, 64px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
---

# Design System: Met Scents

## Overview

**Creative North Star: "The Reference, Not a Mood Board"**

This is the second design pass on Met Scents. The first pass treated the direct style reference (`Inspo/original-77553b9cffbaac025edabc5b256ce677.webp`, a Chanel Coco Noir-style layout) as loose inspiration and kept the site's original warm ink/cream/parchment/brass identity underneath. That system is gone. This version was built by pixel-sampling the reference image directly (converted webp→PNG, extracted with Pillow) rather than eyeballing colors, and every token below is a measured value, not an approximation.

The real palette is much colder and tighter than guesswork would suggest: a true near-black, true white, and exactly **two** sage tones doing two different, non-overlapping jobs — a pale sage (`#D9E2C6`) that only ever appears as the page's outer frame/mat, and one saturated olive (`#657950`) that is pixel-identical across the reference's header pill button, its hero circle-arrow badge, and its entire footer. There is no gold or brass anywhere in the reference's UI chrome — any warm/gold tone visible on the site now comes only from actual product photography (bottle caps), never from styled elements.

**Key Characteristics:**
- Four colors total: near-black, true white, pale sage (frame only), olive (the one interactive color, used everywhere something is clickable).
- Pill-shaped buttons and circular icon badges throughout — a real shape-language change from the prior sharp-cornered "engraved plate" system.
- A high-contrast Didone serif (Bodoni Moda) for display type, replacing a quieter transitional serif — matches the reference's actual dramatic headline character.
- The pale-sage frame is proportionally generous (measured at ~5% of canvas width on every edge in the source), not a thin decorative hairline.
- The admin dashboard inherits the same token values (so `bg-accent`, `bg-ink` etc. are identical) but stays functionally restrained — no sage frame, no theatrical scale. It's the same system at low volume, not a different system.

## Colors

Four colors, sampled, not invented.

### Primary
- **Ink** (`#0A0A0A`): near-true black, cold not warm. Noir sections, primary text on light grounds, primary button fill.
- **Olive / Accent** (`#657950`, light `#8A9B6D`, dark `#4A5A3A`): the reference's *only* interactive color — verified pixel-identical on its header pill, hero circle badge, and footer. Every button badge, hover state, link accent, and the entire site footer.

### Secondary
- **Pale Sage** (`#D9E2C6`, dark `#B9C6A0`): the outer frame/mat color exclusively. Never used for anything clickable — that boundary is deliberate and load-bearing; conflating the two colors was the first pass's core mistake.

### Neutral
- **Cream / White** (`#FFFFFF`): light section backgrounds and text-on-dark. True white/paper, not a warm ivory.
- **Parchment** (`#EAEFDD`): secondary light surface — a pale tint of the sage frame color, not an invented separate warm tone.

### Named Rules
**The Two-Sage Rule.** Pale sage (`#D9E2C6`) is the frame/mat; olive (`#657950`) is the accent. They read as a family but never substitute for each other — pale sage on a button or olive as a page frame are both violations of what the reference actually does.

**The No-Gold Rule.** No gold/brass/champagne UI color exists in this system. Warm tones on the page come only from real product photography, never from styled chrome, badges, or rules.

## Typography

**Display Font:** Bodoni Moda (with ui-serif, Georgia, serif) — a genuine high-contrast Didone, matched to the reference's actual headline character (thin hairlines against bold vertical stems).
**Label/Body Font:** Archivo (with ui-sans-serif, system-ui, sans-serif).

**Character:** Dramatic fashion-house serif for headlines and product names, paired with a confident neutral grotesque for everything functional (nav, labels, buttons, body copy).

### Hierarchy
- **Display** (500 weight, `clamp(3rem, 9vw, 5.4rem)`, leading 0.98): hero headline only.
- **Headline** (Bodoni Moda, `text-3xl`–`text-4xl`): section headings, standing alone, no eyebrow above them.
- **Body** (Archivo, `text-base`, leading relaxed): copy.
- **Label** (Archivo 500, 9–11px, `tracking-widest2` = 0.1em, uppercase): nav, tags, table headers, badges, brand-name-above-product-title. The 9–13px range covers small functional labels (product badges, index tags, button text) and is a deliberate part of the ramp, not drift.

## Layout

Public storefront content sits inside `.container-luxe` (max 1320px), inset from a fixed pale-sage frame — `clamp(14px, 4vw, 64px)`, `position: fixed; inset: 0`, applied once in `SiteChrome`, public routes only — reproducing the reference's measured ~5%-of-canvas-width mat rather than a thin hairline. Section rhythm stays generous vertical whitespace (`py-24`–`py-28`) alternating ink/white/parchment full-bleed bands.

## Elevation & Depth

Flat by default. The hero and diptych-equivalent product "plates" carry a real offset-blur drop shadow (`0 50px 80px -20px rgba(0,0,0,0.6)`) plus a soft olive-tinted radial glow, staging the product photo as a physical object set down on the dark ground — structural, not decorative box-card elevation.

## Shapes

Soft-rounded, pill-forward — a deliberate reversal of the prior sharp "engraved plate" system: `--radius: 0.75rem` for cards and plates, `rounded-full` for every button, icon button, and badge. Product photography containers stay sharp-edged (matching the reference's own product grid), so the contrast between a soft chrome layer and sharp product imagery is intentional.

## Components

### Buttons
- **Shape:** full pill (`rounded-full`).
- **Primary, on light grounds:** ink fill, cream text.
- **Primary, on dark grounds (hero, CTA sections):** bordered/near-transparent fill, cream text, cream/40 border — matches the reference's actual hero button, which is near-invisible by fill and defined mainly by its border and white text.
- **Arrow Badge (signature component):** a separate circular olive badge (`ArrowBadge`) beside a primary CTA, never an icon glued inside the button — the reference's own device, sampled pixel-identical off three different UI spots.

### Product Plate (signature component)
Hero and diptych stage real product photos — including their real white studio backgrounds — inside a `rounded-2xl` white card with a heavy offset shadow and an olive-tinted glow, caption below a hairline rule. The plate's soft corners now match the reference; only the previous pass's gold border has been dropped (no gold exists in the source).

### Cards / Containers
- **Corner style:** soft (`rounded-lg`/`rounded-2xl` depending on scale).
- **Border:** 1px `border-border` (now a cool neutral, `#E2E5DB`, not the old warm parchment tone).
- **Never nested.**

### Badges
- **Shape:** full pill.
- **Status color:** olive accent tint (`bg-accent/10 text-accent-dark`) for positive/available states, replacing stock `emerald-100`; amber/red kept for warning/destructive as genuine functional semantics, not brand chrome.

### Navigation
Sticky header, transparent-over-hero on the homepage, solid white elsewhere. Every interactive icon button is a minimum 44×44px hit target.

## Do's and Don'ts

### Do:
- **Do** keep pale sage (`#D9E2C6`) and olive (`#657950`) strictly separated by role — frame vs. interactive — never interchange them.
- **Do** stage real product photography as a deliberate rounded plate with its real white background, never disguised.
- **Do** use `rounded-full` for every button, icon button, and badge; keep product-image containers sharp-edged.
- **Do** let every heading stand alone with no label above it (unchanged from the first pass — still a hard rule).

### Don't:
- **Don't** reintroduce gold/brass/champagne as a UI color anywhere — check any new component against the reference before adding a warm accent.
- **Don't** use pale sage (`#D9E2C6`) on anything clickable, or olive (`#657950`) as a background frame — that swap is the single most likely regression back toward the first pass's mistake.
- **Don't** add a kicker/eyebrow label above any heading, or a same-size icon+heading+text card grid, or a bordered hero-metric stat grid (craft-floor bans, unchanged from the first pass).
- **Don't** introduce a stock semantic color (`emerald-500`, `blue-500`, `amber-500`) as brand chrome in the admin dashboard — use `accent`, `ink`, and `destructive`.
