import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The olive circular arrow accent from the direct style reference — a
 * separate round badge sitting beside a CTA, not an icon glued inside the
 * button. This exact olive (#657950) is pixel-identical across the
 * reference's header pill, its hero circle badge, and its footer — its one
 * interactive color, sampled, not approximated.
 */
export function ArrowBadge({
  icon: Icon = ArrowRight,
  className,
}: {
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-cream transition-colors group-hover:bg-accent-dark",
        className
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </span>
  );
}
