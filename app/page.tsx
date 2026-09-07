import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle, ShieldCheck, Beaker, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CornerTicks } from "@/components/ui/corner-ticks";
import { ProductGrid } from "@/components/products/product-grid";
import { getFeaturedProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

const GENDER_TILES = [
  { label: "Women", sub: "Florals, orientals & gourmands", href: "/catalogue?gender=women", tone: "cream" as const },
  { label: "Men", sub: "Woods, spice & fresh signatures", href: "/catalogue?gender=men", tone: "ink" as const },
  { label: "Unisex", sub: "Fragrances beyond category", href: "/catalogue?gender=unisex", tone: "parchment" as const },
];

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Verified Authentic",
    body: "Every fragrance is sourced from trusted suppliers — no imitations, ever.",
  },
  {
    icon: MessageCircle,
    title: "A Real Person, On WhatsApp",
    body: "No call centres. Message the shop directly and get a real answer.",
  },
  {
    icon: Beaker,
    title: "Decant Before You Commit",
    body: "Try a fragrance in 10ml before deciding on a full bottle.",
  },
  {
    icon: Truck,
    title: "Honest Pricing, GHS",
    body: "Transparent Cedi pricing on every size — no hidden mark-ups.",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="lab-grid pointer-events-none absolute inset-0 text-cream/[0.05]" aria-hidden />
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-[0.2] blur-3xl"
          style={{ background: "radial-gradient(circle, #B8672A 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #D99456 0%, transparent 70%)" }}
        />
        <Image
          src="/logo.png"
          alt=""
          width={900}
          height={900}
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-1/2 hidden w-[560px] -translate-y-1/2 opacity-[0.05] invert md:block"
        />

        <div className="container-luxe relative flex min-h-[88vh] flex-col justify-center py-32">
          <div className="relative max-w-3xl py-8 pl-8 sm:pl-10">
            <CornerTicks className="text-accent-light/60" />
            <p className="kicker mb-7 flex items-center gap-2 text-accent-light animate-fade-up">
              <span className="h-px w-8 bg-accent-light" /> Met Scents · Specimen Catalogue Vol. I
            </p>
            <h1 className="font-serif text-[13vw] font-medium leading-[0.98] text-balance sm:text-6xl lg:text-[6.2rem] animate-fade-up [animation-delay:100ms]">
              Find a Scent
              <br />
              That Becomes <span className="italic text-accent-light">Yours.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-cream/70 animate-fade-up [animation-delay:220ms]">
              Discover carefully selected fragrances and premium decants, curated for people who
              take scent seriously.
            </p>

            <div className="mt-11 flex flex-wrap gap-4 animate-fade-up [animation-delay:340ms]">
              <Button asChild variant="gold" size="lg">
                <Link href="/catalogue">
                  Explore Fragrances <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
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
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Brand strip                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-border bg-parchment">
        <div className="container-luxe flex flex-col items-center gap-3 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="max-w-lg font-serif text-xl italic leading-snug text-ink/90 sm:text-2xl">
            &ldquo;Scent is personal — we help you find the one that&apos;s actually yours.&rdquo;
          </p>
          <Link href="/#about" className="link-underline shrink-0 text-xs font-medium uppercase tracking-widest2 text-accent-dark">
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
            <div>
              <p className="kicker mb-3">Entry No. 01 — Curated Selection</p>
              <h2 className="font-serif text-3xl sm:text-4xl">Featured Fragrances</h2>
            </div>
            <Link
              href="/catalogue"
              className="link-underline hidden shrink-0 text-xs font-medium uppercase tracking-widest2 text-ink/70 sm:block"
            >
              View Full Catalogue →
            </Link>
          </div>
          <ProductGrid products={featured} />
          <div className="mt-14 flex justify-center sm:hidden">
            <Button asChild variant="outline" size="lg">
              <Link href="/catalogue">
                View Full Catalogue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
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
          <span className="kicker mb-4 text-accent-light">Try First</span>
          <h3 className="font-serif text-4xl leading-tight sm:text-5xl">Decants</h3>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            Try the scent before committing to the bottle — full-strength fragrance, portioned for
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
          <span className="kicker mb-4">Commit</span>
          <h3 className="font-serif text-4xl leading-tight sm:text-5xl">Full Bottles</h3>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/70">
            Your signature scent, in its full expression — for the fragrance you already know you
            love.
          </p>
          <span className="link-underline mt-6 inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-widest2 text-accent-dark">
            Shop Full Bottles <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Shop by gender                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-luxe py-24 sm:py-28">
        <div className="mb-14 flex flex-col items-center text-center">
          <p className="kicker mb-3">Shop By</p>
          <h2 className="font-serif text-3xl sm:text-4xl">Fragrance, By Category</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {GENDER_TILES.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className={`group flex h-56 flex-col justify-end p-8 transition-colors ${
                tile.tone === "ink"
                  ? "bg-ink text-cream hover:bg-accent-dark"
                  : tile.tone === "parchment"
                    ? "bg-parchment text-ink hover:bg-accent hover:text-cream"
                    : "border border-border bg-cream text-ink hover:border-accent"
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
        <div className="container-luxe grid gap-14 py-28 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="kicker mb-3">Our Approach</p>
            <h2 className="font-serif text-3xl sm:text-4xl">
              We&apos;re not chasing trends —<br />
              <span className="italic text-accent-dark">we&apos;re chasing the right scent for you.</span>
            </h2>
            <div className="divider-gold my-7" />
            <p className="text-base leading-relaxed text-ink/75">
              Met Scents started because fragrance shopping in Ghana was either guesswork or
              overpriced. We decant and sell what we&apos;d wear ourselves — real houses, real
              batches, no imitations dressed up as designer. If a scent isn&apos;t right for you,
              we&apos;d rather tell you before you buy the full bottle than after.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink/75">
              Every enquiry gets a real reply from a real person — usually within the hour, on
              WhatsApp.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["100%", "Authentic Stock"],
              ["8+", "Curated Houses"],
              ["10ml", "Decants From"],
              ["1:1", "Personal Service"],
            ].map(([stat, label]) => (
              <div key={label} className="relative border border-border bg-cream p-8 text-center">
                <CornerTicks className="text-border" />
                <p className="specimen-index text-4xl text-accent-dark">{stat}</p>
                <p className="mt-2 text-xs uppercase tracking-widest2 text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Why shop with us                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-luxe py-24 sm:py-28">
        <div className="mb-14 flex flex-col items-center text-center">
          <p className="kicker mb-3">Why Met Scents</p>
          <h2 className="font-serif text-3xl sm:text-4xl">Built On Trust, Not Just Transactions</h2>
        </div>
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <div key={reason.title} className="flex flex-col items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center border border-accent/30 text-accent-dark">
                <reason.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg">{reason.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink py-28 text-cream">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 opacity-[0.16] blur-3xl"
          style={{ background: "radial-gradient(circle, #8A3A29 0%, transparent 70%)" }}
        />
        <div className="container-luxe relative flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl font-serif text-3xl sm:text-4xl">
            Ready to find your next signature scent?
          </h2>
          <p className="max-w-md text-cream/70">
            Browse the full collection, add your favourites to My Selection, and send us your
            request — we&apos;ll take it from there.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <Button asChild variant="gold" size="lg">
              <Link href="/catalogue">
                Browse Collection <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-cream/30 text-cream hover:bg-cream hover:text-ink">
              <Link href="/selection">View My Selection</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
