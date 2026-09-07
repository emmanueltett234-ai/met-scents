import { cn } from "@/lib/utils";

/**
 * Four small crosshair marks pinned to the corners of a relatively-
 * positioned parent — like the registration marks etched into a graduated
 * cylinder or a specimen slide. Purely decorative; sized and coloured via
 * `className` (expects a `text-*` colour utility).
 */
export function CornerTicks({ className }: { className?: string }) {
  const tick = "absolute h-3 w-3 border-current";
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span className={cn(tick, "left-0 top-0 border-l border-t")} />
      <span className={cn(tick, "right-0 top-0 border-r border-t")} />
      <span className={cn(tick, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(tick, "bottom-0 right-0 border-b border-r")} />
    </div>
  );
}
