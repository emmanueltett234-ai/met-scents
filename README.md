# Met Scents

A premium fragrance catalogue and enquiry system for a Ghana-based perfume boutique — built with
Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase (Postgres, Auth, Storage).

There is **no checkout and no payment processing**. Customers browse the catalogue, build a
"My Selection" list, and submit an enquiry with their contact details. The shop owner follows up
manually via WhatsApp or email to confirm availability and complete the sale.

---

## 1. What's included

- Public site: homepage, searchable/filterable catalogue, product detail pages, "My Selection"
  (persisted in the browser), enquiry submission with server-side price recalculation.
- Admin dashboard (`/admin`): product management (with multiple sizes/prices per perfume, image
  upload, featured/new/best-seller flags, availability), category management, and an enquiries
  inbox with status tracking (New → Contacted → Pending → Completed/Cancelled).
- Supabase Postgres schema with Row Level Security, so the public can only ever *read* the
  catalogue and the admin dashboard is the only way to write to it.
- WhatsApp deep links (persistent "chat with us" button, "send my selection via WhatsApp", and a
  one-tap customer reply link in the admin enquiry view) and optional email notifications via
  Resend.

## 2. Prerequisites

- [Node.js 18.18+](https://nodejs.org)
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deployment)
- (Optional) A [Resend](https://resend.com) account if you want email notifications too

## 3. Set up Supabase

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and run it.
   This creates every table, the Row Level Security policies, and the `product-images` storage
   bucket.
3. Open a new query, paste the contents of `supabase/seed.sql`, and run it. This adds the 3
   starter categories and the 8 initial fragrances (Vibrato, JPG Le Male Elixir Absolu, Erba
   Pura, Swy, Gucci Intense Oud, Bianco Latte, Gucci Guilty Elixir, YSL Myself Absolu) with their
   listed prices in GHS.
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep this secret — it's only ever used
     server-side, never in the browser)
5. Go to **Authentication → Users → Add user** and create yourself (the shop owner) as a user
   with an email and password. This is the only account that can sign in to `/admin` — customers
   never need an account.

## 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from step 3, plus:

- `NEXT_PUBLIC_OWNER_WHATSAPP` — your WhatsApp number with country code, digits only (e.g.
  `233241234567` for a Ghana number starting `024`). Used for the floating "chat with us" button
  and the pre-filled enquiry messages.
- `OWNER_NOTIFICATION_EMAIL` / `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — optional. Leave
  `RESEND_API_KEY` blank to skip email notifications entirely; every enquiry always appears in
  `/admin/enquiries` regardless.

## 5. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` for the storefront and `http://localhost:3000/admin/login` to sign
in with the account you created in step 3.5.

> This folder already has a `node_modules` and `.next` from verifying the build — safe to delete
> and regenerate with `npm install` if you'd like a clean start.

## 6. Deploy to production (Vercel)

1. Push this project to a GitHub/GitLab repo (or use `vercel` CLI directly).
2. Import it into Vercel and add the same environment variables from `.env.local` under
   **Project Settings → Environment Variables**.
3. Update `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Deploy. Add a custom domain under **Project Settings → Domains** whenever you're ready.

## 7. Running the shop day-to-day (no code required)

- **Add a fragrance**: `/admin/products` → *Add Product*. Fill in brand, name, description,
  notes, gender, category, upload a photo, and add one or more size/price rows (e.g. `10ml
  Decant` → `380`, `100ml Full Bottle` → `3700`). Toggle *Featured* / *New Arrival* / *Best
  Seller* to control where it shows on the homepage and catalogue filters.
- **Change a price**: edit the product, update the price on that size row, save. It updates
  everywhere the product appears immediately — prices are never hard-coded.
- **Mark something out of stock**: edit the product (or just one size) and set its availability.
  Out-of-stock items stay visible but can't be added to an enquiry.
- **Manage categories**: `/admin/categories`.
- **Handle enquiries**: `/admin/enquiries` shows every submission with the customer's contact
  info, selected fragrances, and estimated total. Open one to change its status or tap *Message
  on WhatsApp* to follow up with a pre-filled message.
- **Add a second admin**: Supabase Dashboard → Authentication → Users → Add user. No code or
  redeploy needed.

## 8. Project structure

```
app/
  page.tsx                 Homepage
  catalogue/                Searchable/filterable catalogue
  products/[slug]/          Product detail pages (SEO-friendly URLs)
  selection/                "My Selection" review + enquiry form
  enquiry/thank-you/        Confirmation screen
  api/enquiries/             Public enquiry submission (validates + recalculates prices server-side)
  api/admin/                 Authenticated-only product/category/upload/enquiry-status endpoints
  admin/                     Admin dashboard (protected by middleware.ts)
components/
  layout/, products/, catalogue/, selection/, admin/, ui/
lib/
  supabase/                  Browser, server (session-aware) and admin (service-role) clients
  currency/                  formatGHS() — the one place prices become "GH₵380"
  validation/                Zod schemas for every form/API input
  notifications/             WhatsApp link builders + Resend email
  data/                      Server-side data access (products, categories)
  store/                     Zustand "My Selection" store (persisted to localStorage)
types/                       Shared TypeScript types
supabase/schema.sql          Full database schema + RLS policies
supabase/seed.sql            Starter categories + the 8 initial fragrances
```

## 9. Security notes

- The service-role Supabase key is only used in `lib/supabase/admin.ts`, imported with
  `import "server-only"` so it can never end up in a browser bundle, and only by the public
  enquiry route — which re-validates every field with Zod and re-fetches each product/variant
  price from the database before writing anything (client-submitted prices are never trusted).
- `/admin/*` is protected three times over: `middleware.ts` redirects unauthenticated visitors,
  every `/api/admin/*` route re-checks the session server-side, and Postgres Row Level Security
  blocks writes from anyone who isn't an authenticated Supabase user regardless of what the API
  layer does.
- The enquiry API has a basic in-memory rate limit (5 submissions / 10 minutes / IP) and a
  honeypot field to deter casual bots. For high-traffic production use, swap in Upstash Redis or
  Vercel KV — see the comment in `app/api/enquiries/route.ts`.

## 10. What's intentionally not built (v1 scope)

Per the brief, this version has no checkout, no payment processing, and no customer accounts.
The architecture leaves room to add later without a rewrite: delivery fees and inventory
quantities can extend `product_variants`, the WhatsApp Business API can replace the `wa.me` deep
links in `lib/notifications/whatsapp.ts`, and discount codes, reviews, and sales reports would
each be a new table plus an admin screen following the same pattern as products/enquiries.
