import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  currency,
  changePercent,
  helpText,
  icon: Icon,
  hero,
}: {
  label: string;
  value: number;
  currency?: boolean;
  changePercent?: number | null;
  helpText?: string;
  icon?: LucideIcon;
  /** The one number the admin should see first — larger type, brass rule, spans more space. */
  hero?: boolean;
}) {
  const display = currency ? formatGHS(value) : value.toLocaleString("en-GH");

  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden bg-card",
        hero ? "border border-ink/15 p-6 sm:p-7" : "border border-border p-4"
      )}
    >
      {/* A fine brass rule along the top — the "engraved plate" mark used
          elsewhere in the brand, standing in for a card shadow/icon-badge
          without introducing the generic SaaS-dashboard look. */}
      <span className={cn("absolute inset-x-0 top-0", hero ? "h-[3px] bg-accent" : "h-px bg-accent/40")} />

      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "font-medium uppercase tracking-widest2 text-muted-foreground",
            hero ? "text-[11px]" : "text-[10px]"
          )}
        >
          {label}
        </p>
        {Icon && <Icon className={cn("shrink-0 text-ink/25", hero ? "h-4 w-4" : "h-3.5 w-3.5")} strokeWidth={1.5} />}
      </div>

      <p
        className={cn(
          "mt-2 truncate text-ink",
          currency ? "font-accent italic" : "font-serif",
          hero ? "text-4xl sm:text-5xl" : "text-xl"
        )}
      >
        {display}
      </p>

      <div className="mt-2 flex min-h-[1.1rem] items-center gap-2">
        {changePercent !== undefined && changePercent !== null && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              changePercent >= 0 ? "text-emerald-700" : "text-destructive"
            )}
          >
            {changePercent >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(Math.round(changePercent))}%
          </span>
        )}
        {helpText && <span className="truncate text-xs text-muted-foreground">{helpText}</span>}
      </div>
    </div>
  );
}
