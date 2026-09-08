import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";

export type MetricAccent = "revenue" | "enquiry" | "whatsapp" | "caution" | "neutral";

// Domain-coded accents so the admin can tell what kind of number a card is
// showing before reading the label: green = confirmed money, blue = demand
// in the pipeline, WhatsApp green = the specific channel, amber = a number
// that looks like money but isn't revenue yet.
const ACCENT_STYLES: Record<MetricAccent, { rule: string; iconWrap: string; iconColor: string }> = {
  revenue: { rule: "bg-emerald-500", iconWrap: "bg-emerald-50", iconColor: "text-emerald-600" },
  enquiry: { rule: "bg-blue-500", iconWrap: "bg-blue-50", iconColor: "text-blue-600" },
  whatsapp: { rule: "bg-[#128C7E]", iconWrap: "bg-[#128C7E]/10", iconColor: "text-[#128C7E]" },
  caution: { rule: "bg-amber-500", iconWrap: "bg-amber-50", iconColor: "text-amber-600" },
  neutral: { rule: "bg-accent", iconWrap: "bg-accent/10", iconColor: "text-ink/50" },
};

export function MetricCard({
  label,
  value,
  currency,
  percent,
  changePercent,
  helpText,
  icon: Icon,
  hero,
  accent = "neutral",
}: {
  label: string;
  value: number;
  currency?: boolean;
  /** Value is already a percentage (0-100) — render with a % suffix instead of a bare number. */
  percent?: boolean;
  changePercent?: number | null;
  helpText?: string;
  icon?: LucideIcon;
  /** The one number the admin should see first — larger type, brass rule, spans more space. */
  hero?: boolean;
  /** Domain color-coding: what kind of number this is, at a glance. */
  accent?: MetricAccent;
}) {
  const display = currency ? formatGHS(value) : percent ? `${Math.round(value)}%` : value.toLocaleString("en-GH");
  const style = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden bg-card",
        hero ? "border border-ink/15 p-6 sm:p-7" : "border border-border p-4"
      )}
    >
      {/* A fine color rule along the top, tinted by domain — stands in for a
          card shadow/icon-badge without introducing a generic SaaS-dashboard
          look, while still giving each number a quick-scan identity. */}
      <span className={cn("absolute inset-x-0 top-0", style.rule, hero ? "h-[3px]" : "h-px")} />

      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "font-medium uppercase tracking-widest2 text-muted-foreground",
            hero ? "text-[11px]" : "text-[10px]"
          )}
        >
          {label}
        </p>
        {Icon && (
          <span className={cn("flex shrink-0 items-center justify-center rounded-full", style.iconWrap, hero ? "h-7 w-7" : "h-6 w-6")}>
            <Icon className={cn(style.iconColor, hero ? "h-4 w-4" : "h-3.5 w-3.5")} strokeWidth={1.75} />
          </span>
        )}
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
