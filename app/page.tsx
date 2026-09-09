import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle, ShieldCheck, Beaker, Truck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowBadge } from "@/components/ui/arrow-badge";
import { ProductGrid } from "@/components/products/product-grid";
import { getFeaturedProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

const GENDER_TILES = [
  { label: "Women", sub: "Florals, orientals & gourmands", href: "/catalogue?gender=women", tone: "cream" as const },
  { label: "Men", sub: "Woods, spice & fresh signatures", href: "/catalogue?gender=men", tone: "ink" as const },
  { label: "Unisex", sub: "Fragrances beyond category", href: "/catalogue?gender=unisex", tone: "parchment" as const },
];

// Ordered by how much it actually differentiates the shop — the WhatsApp
// line is the real product mechanism, so it leads and reads larger, not an
// equal fourth of an icon-tile grid.
const REASONS = [
  {
    icon: MessageCircle,
    title: "A Real Person, On WhatsApp",
    body: "No call centres, no ticket queue. Message the shop directly and a real person replies, usually within the hour.",
    lead: true,
  },
  {
    icon: Beaker,
    title: "Decant Before You Commit",
    body: "Try a fragrance in 10ml before deciding on a full bottle.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Authentic",
    body: "Every fragrance is sourced from trusted suppliers. No imitations, ever.",
  },
  {
    icon: Truck,
    title: "Honest Pricing, GHS",
    body: "Transparent Cedi pricing on every size, with no hidden markups.",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);
  const heroProduct = featured[0];

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero — the product is the protagonist, not a watermark behind    */}
      {/* the copy: a single bottle staged large against a warm gold glow  */}
      {/* on a noir ground, the sage frame visible at the very edge.       */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative -mt-20 overflow-hidden bg-ink text-cream lg:-mt-24">
        <div
          className="pointer-events-none absolute -right-20 top-1/2 h-[720px] w-[720px] -translate-y-1/2 opacity-[0.22] blur-3xl"
          style={{ background: "radial-gradient(circle, #8A9B6D 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, #D9E2C6 0%, transparent 70%)" }}
        />

        <div className="container-luxe relative grid min-h-[92vh] grid-cols-1 items-center gap-12 py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-32">
          <div className="relative max-w-xl">
            <h1 className="font-serif text-[3rem] font-medium leading-[0.98] text-balance text-cream sm:text-6xl lg:text-[5.4rem] animate-fade-up">
              Find a Scent
              <br />
              That Becomes <span className="font-semibold italic text-accent-light">Yours.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-cream/70 animate-fade-up [animation-delay:140ms]">
              A curated fragrance house in Accra: authentic decants and full bottles, hand-selected
              and personally followed up on, one enquiry at a time.
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-4 animate-fade-up [animation-delay:260ms]">
              <Link
                href="/catalogue"
                className="group flex items-center gap-3"
              >
                <span className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full border-cream/40 text-cream group-hover:bg-cream group-hover:text-ink")}>
                  Explore Fragrances
                </span>
                <ArrowBadge />
              </Link>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-cream/30 text-cream hover:bg-cream hover:text-ink"
              >
                <Link href="/catalogue?view=decants">Shop Decants</Link>
              </Button>
            </div>
          </div>

          {heroProduct?.image_url && (
            <div className="relative mx-auto w-full max-w-sm animate-fade-in [animation-delay:200ms] lg:max-w-md lg:justify-self-end">
              <div
                className="pointer-events-none absolute inset-0 scale-125 opacity-70 blur-3xl"
                style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(101,121,80,0.35) 0%, transparent 65%)" }}
              />
              {/* The product photo's own studio-white background is real,
                  not an accident to hide: it's staged as a deliberate plate
                  — a soft-rounded card floating on the noir ground, the same
                  "product on a mounted card" device the reference uses for
                  its own bottle shots. */}
              <div className="relative rounded-2xl bg-cream p-8 shadow-[0_50px_80px_-20px_rgba(0,0,0,0.6)] sm:p-10">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                  <Image
                    src={heroProduct.image_url}
                    alt={`${heroProduct.brand} ${heroProduct.name}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, 80vw"
                    className="object-contain"
                  />
                </div>
                <div className="mt-6 flex items-baseline justify-between border-t border-black/10 pt-4">
                  <p className="text-xs uppercase tracking-widest2 text-muted-foreground">{heroProduct.brand}</p>
                  <p className="font-accent text-sm italic text-ink">{heroProduct.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Brand strip                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-border bg-parchment">
        <div className="container-luxe flex flex-col items-center gap-3 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="max-w-lg font-serif text-xl italic leading-snug text-ink/90 sm:text-2xl">
            &ldquo;Scent is personal. We help you find the one that&apos;s actually yours.&rdquo;
          </p>
          <Link href="/#about" className="link-underline shrink-0 text-xs font-medium uppercase tracking-widest2 text-stone-500">
            Our approach →
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured                                                          */}
      {/* ---------------------------------------------------------------- */}
      {featured.length > 0 && (
        <section className="container-luxe py-24 sm:py-28">
          <div className="mb-14 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="font-serif text-3xl sm:text-4xl">Featured Fragrances</h2>
            <Link
              href="/catalogue"
              className="group hidden shrink-0 items-center gap-3 sm:flex"
            >
              <span className="link-underline text-xs font-medium uppercase tracking-widest2 text-ink/70">
                View Full Catalogue
              </span>
              <ArrowBadge className="h-8 w-8" />
            </Link>
          </div>
          <ProductGrid products={featured} />
          <div className="mt-14 flex justify-center sm:hidden">
            <Link href="/catalogue" className="group flex items-center gap-3">
              <span className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>View Full Catalogue</span>
              <ArrowBadge />
            </Link>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Decant / Full bottle diptych                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="grid sm:grid-cols-2">
        <Link
          href="/catalogue?view=decants"
          className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden bg-ink p-10 text-cream sm:p-14"
        >
          <h3 className="font-serif text-4xl leading-tight sm:text-5xl">Decants</h3>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            Try the scent before committing to the bottle: full-strength fragrance, portioned for
            discovery.
          </p>
          <span className="link-underline mt-6 inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest2">
            Shop Decants <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/catalogue?view=full-bottles"
          className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden bg-parchment p-10 text-ink sm:p-14"
        >
          <h3 className="font-serif text-4xl leading-tight sm:text-5xl">Full Bottles</h3>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/70">
            Your signature scent, in its full expression, for the fragrance you already know you
            love.
          </p>
          <span className="link-underline mt-6 inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest2">
            Shop Full Bottles <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Shop by gender                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-luxe py-24 sm:py-28">
        <div className="mb-14 flex flex-col items-center text-center">
          <h2 className="font-serif text-3xl sm:text-4xl">Fragrance, By Category</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {GENDER_TILES.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className={`group flex h-56 flex-col justify-end p-8 transition-colors ${
                tile.tone === "ink"
                  ? "bg-ink text-cream hover:bg-stone-800"
                  : tile.tone === "parchment"
                    ? "bg-parchment text-ink hover:bg-ink hover:text-cream"
                    : "border border-border bg-cream text-ink hover:border-ink"
              }`}
            >
              <span className="font-serif text-3xl">{tile.label}</span>
              <span className="mt-2 text-sm opacity-70">{tile.sub}</span>
              <span className="mt-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest2 opacity-0 transition-opacity group-hover:opacity-100">
                Shop Now <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Brand story                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section id="about" className="border-y border-border bg-parchment/50">
        <div className="container-luxe py-28">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl sm:text-4xl">
              We&apos;re not chasing trends:<br />
              <span className="italic text-ink/80">we&apos;re chasing the right scent for you.</span>
            </h2>
            <div className="my-7 h-px w-16 bg-ink/15" />
            <p className="text-base leading-relaxed text-ink/75">
              Met Scents started because fragrance shopping in Ghana was either guesswork or
              overpriced. We decant and sell what we&apos;d wear ourselves: real houses, real
              batches, no imitations dressed up as designer. If a scent isn&apos;t right for you,
              we&apos;d rather tell you before you buy the full bottle than after.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink/75">
              Every enquiry gets a real reply from a real person, usually within the hour, on
              WhatsApp.
            </p>
          </div>

          {/* A plain data strip, not a grid of matching stat cards — the
              numbers sit inside the same rule language as the rest of the
              page instead of their own boxed template. */}
          <div className="mt-16 flex flex-wrap gap-x-12 gap-y-8 border-t border-ink/10 pt-10">
            {[
              ["100%", "Authentic Stock"],
              ["8+", "Curated Houses"],
              ["10ml", "Decants From"],
              ["1:1", "Personal Service"],
            ].map(([stat, label]) => (
              <div key={label}>
                <p className="font-accent text-3xl italic text-ink sm:text-4xl">{stat}</p>
                <p className="mt-1.5 text-xs uppercase tracking-widest2 text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why shop with us                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-luxe py-24 sm:py-28">
        <h2 className="mb-14 max-w-lg font-serif text-3xl sm:text-4xl">
          Built On Trust, Not Just Transactions
        </h2>
        <div className="divide-y divide-ink/10 border-t border-ink/10">
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className={`flex flex-col gap-3 py-8 sm:flex-row sm:items-baseline sm:gap-10 ${
                reason.lead ? "sm:py-10" : ""
              }`}
            >
              <div className={`flex shrink-0 items-center gap-3 sm:w-[19rem] ${reason.lead ? "text-accent-dark" : "text-ink/70"}`}>
                <reason.icon className={reason.lead ? "h-5 w-5" : "h-4 w-4"} strokeWidth={1.5} />
                <h3 className={`font-serif ${reason.lead ? "text-2xl text-ink sm:text-3xl" : "text-lg text-ink"}`}>
                  {reason.title}
                </h3>
              </div>
              <p className={`leading-relaxed text-muted-foreground ${reason.lead ? "max-w-md text-base" : "max-w-sm text-sm"}`}>
                {reason.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink py-28 text-cream">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)" }}
        />
        <div className="container-luxe relative flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl font-serif text-3xl sm:text-4xl">
            Ready to find your next signature scent?
          </h2>
          <p className="max-w-md text-cream/70">
            Browse the full collection, add your favourites to My Selection, and send us your
            request. We&apos;ll take it from there.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/catalogue" className="group flex items-center gap-3">
              <span className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full border-cream/40 text-cream group-hover:bg-cream group-hover:text-ink")}>
                Browse Collection
              </span>
              <ArrowBadge />
            </Link>
            <Button asChild variant="outline" size="lg" className="border-cream/30 text-cream hover:bg-cream hover:text-ink">
              <Link href="/selection">View My Selection</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
