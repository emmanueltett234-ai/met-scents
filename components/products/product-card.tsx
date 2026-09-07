"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { Button } from "@/components/ui/button";
import { formatGHS } from "@/lib/currency";
import { useSelectionStore } from "@/lib/store/selection";
import { GENDER_LABELS, type Product } from "@/types";
import { useState, useEffect } from "react";

export function ProductCard({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const variants = product.product_variants ?? [];
  const availableVariants = variants.filter((v) => v.availability !== "out_of_stock");
  const cheapest = [...variants].sort((a, b) => a.price - b.price)[0];
  const defaultVariant = availableVariants.length > 0 ? [...availableVariants].sort((a, b) => a.price - b.price)[0] : cheapest;

  const add = useSelectionStore((s) => s.add);
  const has = useSelectionStore((s) => s.has);
  const alreadyAdded = mounted && defaultVariant ? has(defaultVariant.id) : false;

  const isOrderable = product.availability !== "out_of_stock" && defaultVariant && defaultVariant.availability !== "out_of_stock";

  return (
    <div className="group flex flex-col">
      <Link href={`/products/${product.slug}`} className="block">
        <ProductImage
          src={product.image_url}
          brand={product.brand}
          name={product.name}
          className="aspect-[4/5] w-full"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-widest2 text-muted-foreground">
              {product.brand}
            </p>
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-serif text-lg leading-tight text-ink hover:text-gold-dark">
                {product.name}
              </h3>
            </Link>
          </div>
          <AvailabilityBadge status={product.availability} />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{GENDER_LABELS[product.gender]}</span>
          {defaultVariant && (
            <>
              <span aria-hidden>·</span>
              <span>{defaultVariant.size}</span>
            </>
          )}
        </div>

        <p className="font-serif text-base text-ink">
          {cheapest ? (
            <>
              {variants.length > 1 && <span className="text-xs text-muted-foreground">from </span>}
              {formatGHS(cheapest.price)}
            </>
          ) : (
            "Price on request"
          )}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/products/${product.slug}`}>View Details</Link>
          </Button>
          <Button
            variant={alreadyAdded ? "ghost" : "gold"}
            size="sm"
            className="flex-1"
            disabled={!isOrderable || alreadyAdded}
            onClick={() => {
              if (!defaultVariant) return;
              add({
                productId: product.id,
                variantId: defaultVariant.id,
                slug: product.slug,
                brand: product.brand,
                name: product.name,
                size: defaultVariant.size,
                price: defaultVariant.price,
                imageUrl: product.image_url,
              });
            }}
          >
            {alreadyAdded ? (
              <>
                <Check className="h-3.5 w-3.5" /> Added
              </>
            ) : isOrderable ? (
              <>
                <Plus className="h-3.5 w-3.5" /> Enquire
              </>
            ) : (
              "Unavailable"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
