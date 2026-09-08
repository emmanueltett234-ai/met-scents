import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { ProductDetailActions } from "@/components/products/product-detail-actions";
import { Badge } from "@/components/ui/badge";
import { CornerTicks } from "@/components/ui/corner-ticks";
import { getProductBySlug } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
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
    description: product.description ?? `${product.brand} ${product.name}, available now at Met Scents.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const [product, settings] = await Promise.all([getProductBySlug(params.slug), getSettings()]);
  if (!product) notFound();

  const notes = product.fragrance_notes?.split(",").map((n) => n.trim()).filter(Boolean) ?? [];

  return (
    <div className="container-luxe py-12 sm:py-16">
      <nav className="mb-10 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="link-underline">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/catalogue" className="link-underline">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="relative p-3 lg:sticky lg:top-28 lg:self-start">
          <CornerTicks className="text-border" />
          <ProductImage
            src={product.image_url}
            brand={product.brand}
            name={product.name}
            className="aspect-square w-full sm:aspect-[4/5]"
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>

        <div className="min-w-0 lg:pt-4">
          <div className="mb-5 flex flex-wrap gap-2">
            {product.new_arrival && <Badge variant="outline">New Arrival</Badge>}
            {product.best_seller && <Badge variant="outline">Best Seller</Badge>}
            <Badge variant="outline">{GENDER_LABELS[product.gender]}</Badge>
          </div>

          <p className="text-xs uppercase tracking-widest2 text-muted-foreground">{product.brand}</p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] sm:text-5xl">{product.name}</h1>

          {product.fragrance_type && (
            <p className="mt-3 text-sm italic text-ink/70">{product.fragrance_type}</p>
          )}

          {product.description && (
            <p className="mt-6 max-w-lg pr-14 text-base leading-relaxed text-ink/75 sm:mt-7 sm:pr-0">
              {product.description}
            </p>
          )}

          {notes.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-widest2 text-muted-foreground">
                Fragrance Notes
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {notes.map((note, i) => (
                  <span key={note} className="font-serif text-base italic text-ink/80">
                    {note}
                    {i < notes.length - 1 && <span className="ml-6 not-italic text-border">/</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="my-8 h-px w-full bg-border sm:my-9" />

          <ProductDetailActions product={product} ownerWhatsappNumber={settings.owner_whatsapp_number} />
        </div>
      </div>
    </div>
  );
}
