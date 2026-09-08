import { ArrowUp, ArrowDown } from "lucide-react";
import { formatGHS } from "@/lib/currency";

export function MetricCard({
  label,
  value,
  currency,
  changePercent,
  helpText,
}: {
  label: string;
  value: number;
  currency?: boolean;
  changePercent?: number | null;
  helpText?: string;
}) {
  const display = currency ? formatGHS(value) : value.toLocaleString("en-GH");

  return (
    <div className="min-w-0 border border-border bg-white p-5">
      <p className="text-[11px] font-medium uppercase tracking-widest2 text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-serif text-2xl text-ink">{display}</p>
      <div className="mt-2 flex min-h-[1.25rem] items-center gap-1">
        {changePercent !== undefined && changePercent !== null && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              changePercent >= 0 ? "text-emerald-700" : "text-destructive"
            }`}
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
