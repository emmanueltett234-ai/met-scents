import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/product-grid";
import { getFeaturedProducts } from "@/lib/data/products";

export const dynamic = "force-dynamic";

const CATEGORY_TILES = [
  { label: "Men's Fragrances", href: "/catalogue?gender=men" },
  { label: "Women's Fragrances", href: "/catalogue?gender=women" },
  { label: "Unisex Fragrances", href: "/catalogue?gender=unisex" },
  { label: "Decants", href: "/catalogue?view=decants" },
  { label: "Full Bottles", href: "/catalogue?view=full-bottles" },
  { label: "New Arrivals", href: "/catalogue?view=new-arrivals" },
  { label: "Best Sellers", href: "/catalogue?view=best-sellers" },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8935A 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6B98A 0%, transparent 70%)" }}
        />
        <Image
          src="/logo.png"
          alt=""
          width={900}
          height={900}
          aria-hidden
          className="pointer-events-none absolute right-[-8%] top-1/2 hidden w-[520px] -translate-y-1/2 opacity-[0.07] invert md:block"
        />

        <div className="container-luxe relative flex min-h-[86vh] flex-col justify-center py-28">
          <p className="kicker mb-6 flex items-center gap-2 text-gold animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" /> Premium · Authentic · Ghana
          </p>
          <h1 className="max-w-2xl font-serif text-5xl leading-[1.05] text-balance sm:text-6xl lg:text-7xl animate-fade-up [animation-delay:100ms]">
            Discover Your <span className="italic text-gold">Signature Scent</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cream/75 animate-fade-up [animation-delay:200ms]">
            Explore our curated collection of premium fragrances, available in full bottles and decants.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-fade-up [animation-delay:300ms]">
            <Button asChild variant="gold" size="lg">
              <Link href="/catalogue">
                Explore Fragrances <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cream/40 text-cream hover:bg-cream hover:text-ink"
            >
              <Link href="/catalogue?view=decants">Shop Decants</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-luxe py-24">
          <div className="mb-12 flex flex-col items-center text-center">
            <p className="kicker mb-3">Curated Selection</p>
            <h2 className="font-serif text-3xl sm:text-4xl">Featured Fragrances</h2>
            <div className="divider-gold mt-5" />
          </div>
          <ProductGrid products={featured} />
          <div className="mt-14 flex justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/catalogue">
                View Full Catalogue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="bg-secondary/50 py-24">
        <div className="container-luxe">
          <div className="mb-12 flex flex-col items-center text-center">
            <p className="kicker mb-3">Browse By</p>
            <h2 className="font-serif text-3xl sm:text-4xl">Shop the Collection</h2>
            <div className="divider-gold mt-5" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORY_TILES.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
                className="group flex h-32 flex-col items-center justify-center gap-2 border border-border bg-cream text-center transition-colors hover:border-gold hover:bg-ink hover:text-cream"
              >
                <span className="font-serif text-lg">{tile.label}</span>
                <span className="text-[11px] uppercase tracking-widest2 text-gold-dark opacity-0 transition-opacity group-hover:opacity-100">
                  Shop Now
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="container-luxe grid gap-12 py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="kicker mb-3">Our Story</p>
          <h2 className="font-serif text-3xl sm:text-4xl">
            Authentic fragrances, <span className="italic text-gold-dark">personally sourced</span>
          </h2>
          <div className="divider-gold my-6" />
          <p className="text-base leading-relaxed text-muted-foreground">
            Met Scents is a Ghana-based fragrance boutique built on one principle: every bottle we
            offer is authentic. We hand-select niche and designer perfumes from trusted sources,
            hand-decant with care, and personally follow up on every enquiry — so you always know
            exactly what you&apos;re getting and who you&apos;re getting it from.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            No generic checkout, no faceless transactions — just beautiful scents, honest pricing in
            Ghanaian Cedis, and a real person to speak with on WhatsApp.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["100%", "Authentic Fragrances"],
            ["8+", "Curated Brands"],
            ["10ml+", "Decants Available"],
            ["1:1", "Personal Service"],
          ].map(([stat, label]) => (
            <div key={label} className="border border-border bg-cream p-8 text-center">
              <p className="font-serif text-4xl text-gold-dark">{stat}</p>
              <p className="mt-2 text-xs uppercase tracking-widest2 text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink py-24 text-cream">
        <div className="container-luxe flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl font-serif text-3xl sm:text-4xl">
            Ready to find your next signature scent?
          </h2>
          <p className="max-w-md text-cream/70">
            Browse the full collection, add your favourites to My Selection, and send us your request
            — we&apos;ll take it from there.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            <Button asChild variant="gold" size="lg">
              <Link href="/catalogue">
                Browse Collection <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-cream/40 text-cream hover:bg-cream hover:text-ink">
              <Link href="/selection">View My Selection</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
