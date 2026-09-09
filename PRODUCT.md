# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fragrance buyers in and around Accra, Ghana, browsing a curated perfume catalogue on desktop or
mobile. They are deciding between committing to a full bottle or trying a cheaper decant first,
and they expect to reach a real person (the shop owner) on WhatsApp rather than a support queue.
A second, small audience is the shop owner/admin, who manages the catalogue, categories, and
enquiries from `/admin`.

## Product Purpose

Met Scents is a premium fragrance catalogue and enquiry system for a Ghana-based perfume boutique.
Customers browse fragrances, build a "My Selection" list, and submit an enquiry with their contact
details; the owner follows up manually via WhatsApp or email to confirm availability and close the
sale. Success is a customer finding a fragrance they trust enough to enquire about, and the owner
having everything needed (selection, contact info, recalculated price) to close that conversation
fast.

## Positioning

Real, verified-authentic fragrance houses and decants, sold by a real person who replies on
WhatsApp usually within the hour — not a faceless storefront, not imitation stock dressed up as
designer. Deliberately no checkout or payment processing: the relationship is the sales mechanism,
not a cart.

## Operating Context

- Public storefront: homepage, searchable/filterable catalogue, product detail pages, "My
  Selection" (persisted client-side), enquiry submission with server-side price recalculation.
- Admin dashboard (`/admin`): product management (multiple sizes/prices per perfume, image
  upload, featured/new/best-seller flags, availability), category management, enquiries inbox
  with status tracking, settings (WhatsApp number, notifications), sales/analytics.
- WhatsApp click-to-chat is the primary conversion path throughout: floating chat button,
  per-product enquiry, "Send Enquiry on WhatsApp" from My Selection, and a one-tap customer-reply
  link in the admin enquiry view. It opens WhatsApp pre-addressed and pre-filled; the human still
  presses Send. No WhatsApp Business API, tokens, or webhooks.
- Pricing is always in GHS (Ghanaian Cedi), formatted via a single `formatGHS()` helper — never
  hard-coded.

## Capabilities and Constraints

- No checkout, no payment processing, no customer accounts (deliberate v1 scope, not a gap to
  fill visually or functionally).
- Multiple sizes/prices per product (e.g. "10ml Decant" vs "100ml Full Bottle"); items can be
  out-of-stock at the size level and stay visible but non-enquirable.
- `/admin/*` is auth-protected (middleware + per-route session check + Postgres RLS).
- Redesign scope: the whole site — public storefront **and** the admin dashboard — even though
  the admin was already visually reworked in recent commits.

## Brand Commitments

- Name: Met Scents. Existing monogram/wordmark logo at `public/logo.png` (fine-line crest,
  widely tracked small-caps wordmark, no colour in the mark itself).
- Voice: direct, honest, unpretentious — "we decant and sell what we'd wear ourselves," transparent
  Cedi pricing, no hidden markups, tells a customer before they buy the full bottle if a scent
  isn't right for them.
- Visual system is pinned to the direct style reference (see Evidence on Hand), not to any prior
  build of this site. The first redesign pass treated the reference loosely and kept the site's
  original warm ink/cream/parchment/brass identity underneath; the user rejected that outright
  ("scrap the current color palette completely — it's not staying in any form") and asked for a
  1:1 rebuild from pixel-sampled reference values instead. That rebuilt system — near-true-black,
  true white, pale sage frame, one saturated olive accent, no gold/brass at all, Bodoni Moda
  display serif, pill-shaped soft-rounded components — is now the standing brand system. See
  `DESIGN.md` for the full token set and named rules; do not reintroduce brass/gold or the old
  sharp-cornered system without the user explicitly asking.

## Evidence on Hand

- No lifestyle/editorial photography exists (no models, no hands-holding-bottle shots). Product
  imagery is plain product-on-background photography uploaded per-product through the admin.
  Confirmed direction: the redesign captures mood through color, type, layout, dark sections, and
  negative space rather than assuming lifestyle photography — product shots are treated as
  flat-lay objects.
- One direct style reference on hand: `Inspo/original-77553b9cffbaac025edabc5b256ce677.webp` — a
  Chanel "Coco Noir"-style template. Pixel-sampled (not eyeballed) for the second design pass:
  near-true-black noir sections, true-white light sections, a pale sage frame (`#D9E2C6`, ~5% of
  canvas width on every edge), and one saturated olive accent (`#657950`, verified pixel-identical
  on the header pill, hero circle badge, and footer) — no gold/brass anywhere in the reference's
  UI chrome, only in its product photography. Editorial hand/bottle photography, high-contrast
  Didone display headlines, pill CTAs with a circular arrow badge. Treated as the primary —
  currently only — style reference; the user confirmed no additional reference images are coming
  and, on the second pass, that this reference is the literal target, not loose inspiration.
- 8 real starter fragrances seeded in Supabase (Vibrato, JPG Le Male Elixir Absolu, Erba Pura, Swy,
  Gucci Intense Oud, Bianco Latte, Gucci Guilty Elixir, YSL Myself Absolu) with real GHS pricing —
  not placeholder content.

## Product Principles

1. The WhatsApp reply is the product — every surface should make it obvious and frictionless to
   get from "I like this" to a pre-filled WhatsApp message, not bury it under checkout-style UI
   patterns the site doesn't have.
2. Trust over trend — authenticity, transparent pricing, and a real person on the other end are
   the actual differentiators; the visual language should read as credible and considered, not as
   a generic AI-template storefront.
3. Decant-first decision-making — the site's job is to make trying-before-committing (decant vs
   full bottle) an obvious, low-risk choice, not an afterthought.
4. Mood without lifestyle photography — since only flat product shots exist, atmosphere comes from
   color, type, spacing, and dark/light contrast, not from imagery the shop doesn't have.
5. One system, two audiences — the storefront and the admin dashboard should read as the same
   product, not two different tools stapled together.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility practice.
