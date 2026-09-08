import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { AttentionItem } from "@/lib/analytics/queries";

// Actionable, not analytical: this is the first thing the shop owner should
// act on today, so it sits directly under the KPIs and above any chart.
// Reflects live state (not the selected date range) — old the enquiry may
// be, if it's still unresolved it belongs here.
export function NeedsAttention({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 border border-border bg-card px-5 py-4">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.75} />
        <p className="text-sm text-ink/80">You&rsquo;re all caught up. Nothing needs attention right now.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className="group flex flex-col justify-between gap-3 border border-ink/15 bg-card p-4 transition-colors hover:border-ink/40"
        >
          <div>
            <p className="font-serif text-2xl text-ink">
              {item.count} <span className="text-base">{item.label}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest2 text-accent-dark">
            View <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}
