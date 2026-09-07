import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { ProductDetailActions } from "@/components/products/product-detail-actions";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug } from "@/lib/data/products";
import { GENDER_LABELS } from "@/types";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.name}`,
    description: product.description ?? `${product.brand} ${product.name} — available now at Met Scents.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const notes = product.fragrance_notes?.split(",").map((n) => n.trim()).filter(Boolean) ?? [];

  return (
    <div className="container-luxe py-12">
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/catalogue" className="hover:text-ink">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <ProductImage
          src={product.image_url}
          brand={product.brand}
          name={product.name}
          className="aspect-square w-full lg:sticky lg:top-28"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
        />

        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {product.new_arrival && <Badge variant="gold">New Arrival</Badge>}
            {product.best_seller && <Badge variant="gold">Best Seller</Badge>}
            <Badge variant="outline">{GENDER_LABELS[product.gender]}</Badge>
          </div>

          <p className="text-xs uppercase tracking-widest2 text-muted-foreground">{product.brand}</p>
          <h1 className="mt-1 font-serif text-4xl leading-tight">{product.name}</h1>

          {product.fragrance_type && (
            <p className="mt-2 text-sm text-muted-foreground">{product.fragrance_type}</p>
          )}

          {product.description && (
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/80">{product.description}</p>
          )}

          {notes.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-widest2 text-muted-foreground">
                Fragrance Notes
              </p>
              <div className="flex flex-wrap gap-2">
                {notes.map((note) => (
                  <span
                    key={note}
                    className="border border-border bg-secondary/60 px-3 py-1 text-xs text-ink/80"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="my-8 h-px w-full bg-border" />

          <ProductDetailActions product={product} />
        </div>
      </div>
    </div>
  );
}
