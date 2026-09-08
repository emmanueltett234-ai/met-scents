"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ShoppingBag, ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/product-image";
import { CornerTicks } from "@/components/ui/corner-ticks";
import { EnquiryForm } from "@/components/selection/enquiry-form";
import { useSelectionStore } from "@/lib/store/selection";
import { formatGHS } from "@/lib/currency";

export function SelectionPageClient({ ownerWhatsappNumber }: { ownerWhatsappNumber: string | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useSelectionStore((s) => s.items);
  const remove = useSelectionStore((s) => s.remove);
  const setQuantity = useSelectionStore((s) => s.setQuantity);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container-luxe flex flex-col items-center gap-3 py-16 text-center">
        <ShoppingBag className="h-8 w-8 text-muted-foreground" strokeWidth={1.2} />
        <h1 className="font-serif text-2xl">Your Selection is Empty</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Browse the catalogue and tap the <span className="font-medium text-ink">+</span> on any
          fragrance to start building your selection.
        </p>
        <Button asChild variant="default" size="lg" className="mt-3">
          <Link href="/catalogue">Explore Fragrances</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-luxe py-16">
      <div className="mb-10 text-center">
        <p className="kicker mb-3">Review &amp; Send</p>
        <h1 className="font-serif text-4xl">Your Fragrance Selection</h1>
        <div className="divider-gold mx-auto mt-5" />
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <div key={item.variantId} className="flex items-center gap-4 py-4">
                <ProductImage
                  src={item.imageUrl}
                  brand={item.brand}
                  name={item.name}
                  className="h-20 w-20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {item.brand}
                  </p>
                  <Link href={`/products/${item.slug}`} className="font-serif text-lg hover:text-accent-dark">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.size}</p>

                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center border border-border text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center border border-border text-ink transition-colors hover:border-ink"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-accent text-lg italic">{formatGHS(item.price * item.quantity)}</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-muted-foreground">{formatGHS(item.price)} each</p>
                  )}
                </div>
                <button
                  aria-label={`Remove ${item.name}`}
                  onClick={() => remove(item.variantId)}
                  className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between py-6">
            <span className="text-sm uppercase tracking-widest2 text-muted-foreground">
              Estimated Total
            </span>
            <span className="font-accent text-2xl italic">{formatGHS(total)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Final pricing is confirmed by the shop owner when they follow up. This total reflects
            current listed prices for your selected sizes.
          </p>

          <Link
            href="/catalogue"
            className="link-underline mt-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest2 text-ink/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Continue Exploring
          </Link>
        </div>

        <div className="lg:col-span-2">
          <div className="relative border border-border bg-white p-6 lg:sticky lg:top-28">
            <CornerTicks className="text-border" />
            <h2 className="mb-1 font-serif text-xl">Your Details</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              We&apos;ll use these to confirm availability and arrange your order.
            </p>
            <EnquiryForm ownerWhatsappNumber={ownerWhatsappNumber} />
          </div>
        </div>
      </div>
    </div>
  );
}
