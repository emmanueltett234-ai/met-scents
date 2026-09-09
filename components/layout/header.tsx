"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, MessageCircle, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useSelectionStore } from "@/lib/store/selection";
import { buildGeneralWhatsappLink } from "@/lib/notifications/whatsapp";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Fragrances", href: "/catalogue" },
  { label: "Decants", href: "/catalogue?view=decants" },
  { label: "Full Bottles", href: "/catalogue?view=full-bottles" },
  { label: "About", href: "/#about" },
];

export function Header({ ownerWhatsappNumber }: { ownerWhatsappNumber: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const count = useSelectionStore((s) => s.items.length);

  // The hero on the homepage is dark, so the header can start transparent
  // with light text and only become a solid bar once the page scrolls past
  // it. Every other page has a light background from the top, so the
  // header is always solid there.
  const overlaysHero = pathname === "/";

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isTransparent = overlaysHero && !scrolled;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/catalogue?search=${encodeURIComponent(search.trim())}`);
      setSearchOpen(false);
      setSearch("");
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full transition-all duration-500",
        isTransparent
          ? "border-b border-cream/0 bg-transparent"
          : "border-b border-border bg-cream/95 backdrop-blur-sm"
      )}
    >
      <div className="container-luxe relative flex h-20 items-center justify-between lg:h-24">
        <div className="flex flex-1 items-center lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className={cn(
                  "flex h-11 w-11 cursor-pointer items-center justify-center -ml-2",
                  isTransparent ? "text-cream" : "text-ink"
                )}
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent className="max-w-none sm:max-w-sm">
              <div className="flex flex-col gap-1 px-6 py-8">
                <Logo className="mb-8" />
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.label}>
                    <Link
                      href={link.href}
                      className="border-b border-border py-4 text-sm uppercase tracking-widest2 text-ink"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link href="/selection" className="border-b border-border py-4 text-sm uppercase tracking-widest2 text-accent-dark">
                    My Selection {mounted && count > 0 ? `(${count})` : ""}
                  </Link>
                </SheetClose>
                {ownerWhatsappNumber && (
                  <SheetClose asChild>
                    <a
                      href={buildGeneralWhatsappLink(ownerWhatsappNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 border border-ink py-3 text-xs uppercase tracking-widest2"
                    >
                      <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                    </a>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Logo className="lg:flex-1" dark={isTransparent} />

        <nav className="hidden items-center gap-10 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "link-underline text-[12px] font-medium uppercase tracking-widest2 transition-colors",
                isTransparent ? "text-cream/90 hover:text-cream" : "text-ink/80 hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={cn("flex flex-1 items-center justify-end gap-1", isTransparent ? "text-cream" : "text-ink")}>
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="hidden h-11 w-11 cursor-pointer items-center justify-center hover:opacity-70 sm:flex"
          >
            {searchOpen ? <X className="h-[18px] w-[18px]" strokeWidth={1.5} /> : <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />}
          </button>

          {ownerWhatsappNumber && (
            <a
              href={buildGeneralWhatsappLink(ownerWhatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="hidden h-11 w-11 items-center justify-center hover:opacity-70 lg:flex"
            >
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </a>
          )}

          <Link href="/selection" aria-label="My Selection" className="relative flex h-11 w-11 items-center justify-center hover:opacity-70">
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {mounted && count > 0 && (
              <span className="index-tag absolute right-0 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-medium text-cream">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-cream">
          <form onSubmit={handleSearchSubmit} className="container-luxe flex items-center gap-4 py-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fragrances, brands…"
              className="w-full bg-transparent font-serif text-lg text-ink placeholder:text-muted-foreground focus:outline-none"
            />
          </form>
        </div>
      )}
    </header>
  );
}
