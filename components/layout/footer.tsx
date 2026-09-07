import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buildGeneralWhatsappLink } from "@/lib/notifications/whatsapp";

export function Footer({ ownerWhatsappNumber }: { ownerWhatsappNumber: string | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-cream/10 bg-ink text-cream">
      <div className="lab-grid pointer-events-none absolute inset-0 text-cream/[0.04]" aria-hidden />
      <div className="container-luxe relative grid gap-12 py-20 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo dark className="mb-5" />
          <p className="specimen-index mb-4 text-[10px] uppercase tracking-widest2 text-cream/40">
            Specimen Catalogue · Est. Accra
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-cream/60">
            A curated fragrance boutique in Accra — authentic decants and full bottles,
            hand-selected and personally followed up on, one enquiry at a time.
          </p>
        </div>

        <div>
          <h4 className="kicker mb-5 text-cream/40">Shop</h4>
          <ul className="space-y-3 text-sm text-cream/75">
            <li><Link href="/catalogue" className="link-underline">All Fragrances</Link></li>
            <li><Link href="/catalogue?gender=men" className="link-underline">Men&apos;s Fragrances</Link></li>
            <li><Link href="/catalogue?gender=women" className="link-underline">Women&apos;s Fragrances</Link></li>
            <li><Link href="/catalogue?view=decants" className="link-underline">Decants</Link></li>
            <li><Link href="/catalogue?view=full-bottles" className="link-underline">Full Bottles</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="kicker mb-5 text-cream/40">Discover</h4>
          <ul className="space-y-3 text-sm text-cream/75">
            <li><Link href="/catalogue?view=new-arrivals" className="link-underline">New Arrivals</Link></li>
            <li><Link href="/catalogue?view=best-sellers" className="link-underline">Best Sellers</Link></li>
            <li><Link href="/selection" className="link-underline">My Selection</Link></li>
            <li><Link href="/#about" className="link-underline">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="kicker mb-5 text-cream/40">Get In Touch</h4>
          <p className="text-sm leading-relaxed text-cream/75">
            Browse the collection, build your selection, and send it our way — we&apos;ll confirm
            availability and arrange delivery personally.
          </p>
          {ownerWhatsappNumber && (
            <a
              href={buildGeneralWhatsappLink(ownerWhatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-light link-underline"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-cream/10 py-6">
        <p className="container-luxe flex flex-col items-center justify-between gap-2 text-xs text-cream/40 sm:flex-row">
          <span>© {year} Met Scents. All rights reserved.</span>
          <span>Accra, Ghana</span>
        </p>
      </div>
    </footer>
  );
}
