import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-ink text-cream">
      <div className="container-luxe grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo dark className="mb-4" />
          <p className="max-w-xs text-sm leading-relaxed text-cream/70">
            A curated boutique of authentic, premium fragrances — decants and full bottles,
            hand-selected and personally delivered.
          </p>
        </div>

        <div>
          <h4 className="kicker mb-4 text-cream/50">Shop</h4>
          <ul className="space-y-3 text-sm text-cream/80">
            <li><Link href="/catalogue" className="hover:text-gold">All Fragrances</Link></li>
            <li><Link href="/catalogue?gender=men" className="hover:text-gold">Men&apos;s Fragrances</Link></li>
            <li><Link href="/catalogue?gender=women" className="hover:text-gold">Women&apos;s Fragrances</Link></li>
            <li><Link href="/catalogue?view=decants" className="hover:text-gold">Decants</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="kicker mb-4 text-cream/50">Discover</h4>
          <ul className="space-y-3 text-sm text-cream/80">
            <li><Link href="/catalogue?view=new-arrivals" className="hover:text-gold">New Arrivals</Link></li>
            <li><Link href="/catalogue?view=best-sellers" className="hover:text-gold">Best Sellers</Link></li>
            <li><Link href="/selection" className="hover:text-gold">My Selection</Link></li>
            <li><Link href="/#about" className="hover:text-gold">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="kicker mb-4 text-cream/50">Get In Touch</h4>
          <p className="text-sm text-cream/80">
            Browse the catalogue, add your favourites to My Selection, and send us your request —
            we&apos;ll confirm availability and arrange delivery personally.
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10 py-6">
        <p className="container-luxe text-center text-xs text-cream/50">
          © {year} Met Scents. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
