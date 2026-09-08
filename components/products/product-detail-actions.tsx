"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { formatGHS } from "@/lib/currency";
import { useSelectionStore } from "@/lib/store/selection";
import { buildCustomerEnquiryWhatsappLink } from "@/lib/notifications/whatsapp";
import type { Product } from "@/types";

export function ProductDetailActions({
  product,
  ownerWhatsappNumber,
}: {
  product: Product;
  ownerWhatsappNumber: string | null;
}) {
  const variants = product.product_variants ?? [];
  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const add = useSelectionStore((s) => s.add);
  const has = useSelectionStore((s) => s.has);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const alreadyAdded = mounted && selected ? has(selected.id) : false;
  const isOrderable =
    product.availability !== "out_of_stock" && selected && selected.availability !== "out_of_stock";

  if (variants.length === 0) {
    return <p className="text-sm text-muted-foreground">Pricing coming soon — please check back.</p>;
  }

  const whatsappLink =
    selected && ownerWhatsappNumber
      ? buildCustomerEnquiryWhatsappLink(ownerWhatsappNumber, {
          items: [{ product_name: product.name, brand: product.brand, size: selected.size, price: selected.price }],
          estimatedTotal: selected.price,
        })
      : null;

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-widest2 text-muted-foreground">
          Available Sizes
        </p>
        <div className="flex flex-wrap gap-3">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={v.availability === "out_of_stock"}
              onClick={() => setSelectedId(v.id)}
              className={`flex cursor-pointer flex-col items-start border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected?.id === v.id
                  ? "border-ink bg-ink text-cream"
                  : "border-border bg-white hover:border-ink"
              }`}
            >
              <span className="text-sm">{v.size}</span>
              <span className="font-accent text-lg italic">{formatGHS(v.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Availability:</span>
          <AvailabilityBadge status={selected.availability === "out_of_stock" ? "out_of_stock" : product.availability} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          variant={alreadyAdded ? "ghost" : "gold"}
          disabled={!isOrderable || alreadyAdded}
          onClick={() => {
            if (!selected) return;
            add({
              productId: product.id,
              variantId: selected.id,
              slug: product.slug,
              brand: product.brand,
              name: product.name,
              size: selected.size,
              price: selected.price,
              imageUrl: product.image_url,
            });
          }}
          className="flex-1"
        >
          {alreadyAdded ? (
            <>
              <Check className="h-4 w-4" /> Added to Selection
            </>
          ) : isOrderable ? (
            <>
              <Plus className="h-4 w-4" /> Add to My Selection
            </>
          ) : (
            "Currently Unavailable"
          )}
        </Button>

        {isOrderable && whatsappLink && (
          <Button asChild size="lg" variant="outline" className="flex-1">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Enquire via WhatsApp
            </a>
          </Button>
        )}
      </div>

      {alreadyAdded && (
        <Link href="/selection" className="link-underline block text-xs font-medium uppercase tracking-widest2 text-accent-dark">
          View My Selection →
        </Link>
      )}
    </div>
  );
}
