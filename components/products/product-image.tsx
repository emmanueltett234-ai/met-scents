"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the product photo. There is deliberately no branded "coming
 * soon" placeholder here — if a product has no image yet, or a stored URL
 * ever fails to load, this quietly degrades to a plain neutral fill with
 * no text or graphic, rather than a designed placeholder card. The real
 * fix for a missing photo is uploading one in /admin/products.
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
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <div className={cn("relative overflow-hidden bg-secondary", className)}>
        <Image
          src={src}
          alt={`${brand} ${name}`}
          fill
          sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return <div className={cn("bg-secondary", className)} />;
}
