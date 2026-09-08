"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DATE_RANGE_OPTIONS, type DateRangeKey } from "@/lib/analytics/date-range";
import { cn } from "@/lib/utils";

export function DateRangeSelect({ current }: { current: DateRangeKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(key: DateRangeKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", key);
    if (key !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setCustomDate(field: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    if (value) params.set(field, value);
    else params.delete(field);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 border border-border bg-white p-1">
        {DATE_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setRange(opt.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium uppercase tracking-widest2 transition-colors",
              current === opt.key ? "bg-ink text-cream" : "text-ink/70 hover:bg-secondary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {current === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            defaultValue={searchParams.get("from") ?? ""}
            onChange={(e) => setCustomDate("from", e.target.value)}
            className="border border-border bg-white px-2 py-1.5 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            defaultValue={searchParams.get("to") ?? ""}
            onChange={(e) => setCustomDate("to", e.target.value)}
            className="border border-border bg-white px-2 py-1.5 text-xs"
          />
        </div>
      )}
    </div>
  );
}
