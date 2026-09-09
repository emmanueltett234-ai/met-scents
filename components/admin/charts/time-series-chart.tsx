"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_GRID, CHART_MUTED_TEXT } from "@/components/admin/charts/chart-colors";
import { formatGHS } from "@/lib/currency";
import type { TimeSeriesPoint } from "@/lib/analytics/queries";

export function TimeSeriesChart({
  data,
  currency,
  emptyMessage,
}: {
  data: TimeSeriesPoint[];
  currency?: boolean;
  emptyMessage: string;
}) {
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
    );
  }

  // Sales (currency) trend in green — real revenue; enquiries trend in blue
  // — demand, not yet revenue. Keeps the two trend lines tellable apart at a glance.
  const lineColor = currency ? "#16A34A" : "#2563EB";

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_GRID} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: CHART_MUTED_TEXT }}
          axisLine={{ stroke: CHART_GRID }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_MUTED_TEXT }}
          axisLine={false}
          tickLine={false}
          width={currency ? 56 : 32}
          tickFormatter={(v) => (currency ? formatGHS(v).replace("GH₵", "₵") : String(v))}
        />
        <Tooltip
          formatter={(value: number) => [currency ? formatGHS(value) : value, currency ? "Sales" : "Enquiries"]}
          contentStyle={{ border: "1px solid #E2E5DB", borderRadius: 8, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="value" stroke={lineColor} strokeWidth={1.75} fill="url(#tsFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
