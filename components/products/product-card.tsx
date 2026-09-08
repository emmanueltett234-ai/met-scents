"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { AvailabilityBadge } from "@/components/products/availability-badge";
import { formatGHS } from "@/lib/currency";
import { useSelectionStore } from "@/lib/store/selection";
import { GENDER_LABELS, type Product } from "@/types";
import { useState, useEffect } from "react";

export function ProductCard({ product, index }: { product: Product; index?: number }) {
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
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden border border-transparent transition-colors group-hover:border-border">
        <ProductImage
          src={product.image_url}
          brand={product.brand}
          name={product.name}
          className="aspect-[4/5] w-full"
        />
        {product.availability !== "available" && (
          <div className="absolute left-3 top-3">
            <AvailabilityBadge status={product.availability} />
          </div>
        )}
        {(product.new_arrival || product.best_seller) && product.availability === "available" && (
          <div className="absolute right-3 top-3">
            <span className="border border-ink/70 bg-cream/95 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-ink">
              {product.new_arrival ? "New Arrival" : "Best Seller"}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        {typeof index === "number" && (
          <p className="index-tag mb-1 text-[10px] text-muted-foreground/70">
            N°{String(index).padStart(3, "0")}
          </p>
        )}
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{product.brand}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-0.5 font-serif text-lg leading-tight text-ink transition-colors group-hover:text-accent-dark">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{GENDER_LABELS[product.gender]}</span>
          {defaultVariant && (
            <>
              <span aria-hidden>·</span>
              <span>{defaultVariant.size}</span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <p className="font-accent text-base italic text-ink">
            {cheapest ? (
              <>
                {variants.length > 1 && <span className="text-xs text-muted-foreground">from </span>}
                {formatGHS(cheapest.price)}
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Price on request</span>
            )}
          </p>

          <button
            type="button"
            aria-label={alreadyAdded ? "Added to selection" : "Add to selection"}
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
            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-ink text-ink transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink"
          >
            {alreadyAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
