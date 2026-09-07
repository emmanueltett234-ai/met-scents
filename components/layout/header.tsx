"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useSelectionStore } from "@/lib/store/selection";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "Men", href: "/catalogue?gender=men" },
  { label: "Women", href: "/catalogue?gender=women" },
  { label: "Unisex", href: "/catalogue?gender=unisex" },
  { label: "New Arrivals", href: "/catalogue?view=new-arrivals" },
  { label: "Best Sellers", href: "/catalogue?view=best-sellers" },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useSelectionStore((s) => s.items.length);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b transition-colors duration-300",
        scrolled ? "border-border bg-cream/95 backdrop-blur-sm" : "border-transparent bg-cream"
      )}
    >
      <div className="container-luxe flex h-20 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] font-medium uppercase tracking-widest2 text-ink/80 transition-colors hover:text-gold-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/selection"
            aria-label="My Selection"
            className="relative flex h-11 w-11 items-center justify-center text-ink hover:text-gold-dark"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {mounted && count > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-medium text-ink">
                {count}
              </span>
            )}
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="flex h-11 w-11 items-center justify-center text-ink lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent className="max-w-xs">
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
                  <Link href="/selection" className="py-4 text-sm uppercase tracking-widest2 text-gold-dark">
                    My Selection {mounted && count > 0 ? `(${count})` : ""}
                  </Link>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
