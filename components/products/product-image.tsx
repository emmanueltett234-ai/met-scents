"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders the product photo, or — until the owner uploads one, or if the
 * stored URL ever fails to load — a deliberate branded placeholder so the
 * catalogue never shows a blank grey box. This is a client component only
 * because of the `onError` fallback below; everything else about it is
 * static.
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

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 overflow-hidden border border-border bg-parchment/40",
        className
      )}
    >
      <span className="font-serif text-sm uppercase tracking-[0.2em] text-ink/50">Met Scents</span>
      <span className="text-[11px] uppercase tracking-widest2 text-muted-foreground">
        Image Coming Soon
      </span>
    </div>
  );
}
