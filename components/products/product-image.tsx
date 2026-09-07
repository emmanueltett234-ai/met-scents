import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the product photo, or — until the owner uploads one from
 * /admin/products — an elegant monogram placeholder so the catalogue never
 * looks broken.
 */
export function ProductImage({
  src,
  brand,
  name,
  className,
  sizes,
  priority,
}: {
  src: string | null;
  brand: string;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-secondary", className)}>
        <Image
          src={src}
          alt={`${brand} ${name}`}
          fill
          sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
    );
  }

  const initial = (brand || name || "M").trim().charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-parchment via-cream to-secondary",
        className
      )}
    >
      <span className="font-serif text-5xl text-gold/70">{initial}</span>
      <div className="absolute inset-0 border border-gold/10" />
    </div>
  );
}
