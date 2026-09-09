---
name: Met Scents
description: A curated fragrance boutique in Accra — the after-hours atelier, not the generic luxury template
colors:
  ink: "#17140F"
  cream: "#F6F3EC"
  parchment: "#E6E2D8"
  sage: "#7E886A"
  sage-light: "#C7CBAE"
  sage-dark: "#454A34"
  accent-brass: "#8C7752"
  accent-light: "#B9A97E"
  accent-dark: "#5E4E33"
typography:
  display:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "clamp(3rem, 9vw, 5.4rem)"
    fontWeight: 500
    lineHeight: 0.98
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.1em"
rounded:
  DEFAULT: "0.125rem"
spacing:
  section-y: "6rem"
  frame: "10px"
components:
  button-primary:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.DEFAULT}"
    padding: "12px 24px"
---

# Design System: Met Scents

## Overview

**Creative North Star: "The After-Hours Atelier"**

Met Scents is not a generic minimalist luxury template — the "cream, hairline serif, tracked-caps kicker" register that AI-generated boutique sites default to. The site is staged as an atelier after closing: deep noir rooms lit by a single warm gold source, the whole page held inside a saturated sage-olive mat — like a print set behind glass — pulled directly from the one direct style reference on file (`Inspo/original-77553b9cffbaac025edabc5b256ce677.webp`, a Chanel Coco Noir-style layout). The reference's Chanel-specific content and its assumption of editorial lifestyle photography were both discarded; its noir/sage/gold register and theatrical scale were kept and translated to what Met Scents actually has: flat product-on-white studio photography, staged deliberately as framed plates rather than disguised.

Two confirmed visual rejections drove this system, verified against the built code before this file was written: no kicker/eyebrow label ever sits above a heading (every instance was removed, including the admin dashboard's `SectionHeading` component); no same-size icon+heading+text card grid and no bordered hero-metric stat grid appear anywhere (the homepage's trust-reasons grid and stat block were both rebuilt as asymmetric lists/strips).

**Key Characteristics:**
- A fixed sage-olive frame borders the entire public storefront viewport at every scroll position — the system's one recurring signature device.
- Product photography's real white studio background is staged as an intentional gold-edged "plate," never disguised or cropped around.
- Headings carry their own weight; no small-caps label ever precedes one.
- The admin dashboard borrows the palette and the plate device at low volume (Operate mode: scanability over expression) but never the sage frame or theatrical scale — it stays a tool.

## Colors

Two identity colors carry the system at committed, page-scale weight — not accents scattered over a neutral ground.

### Primary
- **Ink** (`#17140F`): the noir stage. Full-bleed dark sections (hero, CTA, footer, decant tile, product-card hover) and all primary text on light grounds.
- **Sage** (`#7E886A`, dark `#454A34`, light `#C7CBAE`): the site's second identity color, translated from the reference's wrapping mat. Used at page scale — the fixed viewport frame — never as a small decorative accent. `sage-dark` doubles as the admin dashboard's "positive/revenue" semantic color, replacing a stock `emerald-500`.

### Neutral
- **Cream** (`#F6F3EC`): primary light background and text-on-ink color.
- **Parchment** (`#E6E2D8`): secondary light surface (brand-strip, story section, full-bottle tile).
- **Accent / Brass-Gold** (`#8C7752`, light `#B9A97E`, dark `#5E4E33`): CTAs, rules, italic price treatment, hero glow. Warmed slightly toward the reference's jewelry-gold from the original muted brass.

### Named Rules
**The Committed Frame Rule.** Sage never appears as a small swatch or button accent — only as the fixed page-edge frame and full-bleed sections. A color used at page scale reads as identity; the same hue used as a 2px accent reads as decoration.

## Typography

**Display Font:** Source Serif 4 (with ui-serif, Georgia, serif)
**Label/Body Font:** Archivo (with ui-sans-serif, system-ui, sans-serif) — replaces the previous Instrument Sans, which is a listed AI-default typeface; Archivo carries more weight-contrast character for tracked labels and nav.

**Character:** A transitional book serif (headlines, product names, italic price/quote accents) paired with a confident, slightly industrial grotesque (nav, labels, buttons) — closer to a printed gallery label than a SaaS interface font.

### Hierarchy
- **Display** (500 weight, `clamp(3rem, 9vw, 5.4rem)`, leading 0.98): the hero headline only.
- **Headline** (Source Serif 4, `text-3xl`–`text-4xl`): section headings, always standing alone — no eyebrow above them.
- **Body** (Archivo, `text-base`, leading relaxed): copy, capped near 60ch.
- **Label** (Archivo 500, 10–11px, `tracking-widest2` = 0.1em, uppercase): functional UI labels only — table headers, form labels, brand-name-above-product-title, nav. Never used as a decorative section intro.

### Named Rules
**The No-Eyebrow Rule.** A tracked small-caps label never sits above a heading as a section intro. Every heading carries its own weight. This rule has no exceptions in this codebase — it was applied even to the recently-built admin dashboard.

## Layout

Public storefront content sits inside `.container-luxe` (max 1320px, responsive px-5/8/12 padding), itself inset from a fixed 10px (16px ≥sm) sage frame that borders the full viewport at every scroll position — `position: fixed; inset: 0`, applied once in `SiteChrome`, `pointer-events-none`, public routes only. The admin dashboard does not get the frame.

Section rhythm is generous vertical whitespace (`py-24`–`py-28`) alternating ink/cream/parchment full-bleed bands, never card-in-card nesting. Grids used for genuine repeated data (product catalogue, gender tiles) stay grids; sections that previously used a card grid for editorial content (trust reasons, brand stats) were rebuilt as single-column lists and inline strips.

## Elevation & Depth

Flat by default — the system uses ink/cream contrast and the sage frame for depth, not shadows. The one deliberate exception: the hero product "plate" and its diptych/CTA equivalents carry a real offset-blur drop shadow (`0 50px 80px -20px rgba(0,0,0,0.6)`) to read as a physical object staged on the dark ground, plus a warm gold radial glow behind it. Shadows are structural (stage a real object), never decorative box-card elevation.

## Shapes

Sharp, engraved-plate geometry throughout: `--radius: 0.125rem`, effectively square corners on every button, input, badge, and card. No `rounded-xl`/`rounded-2xl` soft-card language anywhere in the codebase — this was true before this pass and was preserved deliberately.

## Components

### Buttons
- **Shape:** near-square (0.125rem radius).
- **Primary (`gold` variant):** cream fill, ink text on dark grounds; ink fill, cream text on light grounds.
- **Secondary (`outline`):** 1px border, transparent fill, invert on hover.

### Product Plate (signature component)
The hero and diptych stage a real product photo — including its real white studio background — inside a bordered cream card (`border-accent/40`, `p-8`–`p-10`, drop shadow) with a brand/name caption below a hairline rule. This is the system's direct translation of the reference's "product on a mounted card" device, and the honest answer to having only flat product photography and no lifestyle imagery: the plate is staged as deliberate, not disguised.

### Cards / Containers
- **Corner style:** square (0.125rem).
- **Background:** `bg-card` / `bg-cream`.
- **Border:** 1px `border-border`, plus a fine top rule (`bg-accent/40`, 1px) shared between `MetricCard` and the base `Card` component so a chart tile and a metric tile read as one system, not two.
- **Never nested** — no card placed inside another card's padding.

### Navigation
Sticky header, transparent-over-hero on the homepage only, solid `bg-cream/95` elsewhere. Nav links use Archivo label typography with an underline-reveal hover. Every interactive icon button is a minimum 44×44px hit target (fixed from 40×40px on the product-card add button during this pass).

## Do's and Don'ts

### Do:
- **Do** stage real product photography as a deliberate framed plate (cream card, thin gold border, caption) rather than trying to disguise its white studio background.
- **Do** use sage only at page/frame scale, never as a small accent.
- **Do** let every heading stand alone with no label above it.
- **Do** keep the admin dashboard's palette and component language tied to the storefront's tokens (sage/accent/ink), even though its layout stays restrained (Operate mode).

### Don't:
- **Don't** add a kicker/eyebrow label above any heading, anywhere, for any reason.
- **Don't** build a same-size icon+heading+text card grid, or a bordered hero-metric stat grid — both were removed from the homepage during this pass and should not return.
- **Don't** introduce a stock semantic color (`emerald-500`, `blue-500`, `amber-500`) in the admin dashboard — use `sage`, `accent`, and `destructive` instead.
- **Don't** apply the sage viewport frame to `/admin` routes — it is a public-storefront-only device.
