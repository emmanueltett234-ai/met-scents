"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { CHART_COLORS, CHART_GRID, CHART_MUTED_TEXT } from "@/components/admin/charts/chart-colors";
import { formatGHS } from "@/lib/currency";
import type { BreakdownSlice } from "@/lib/analytics/queries";

export function BarBreakdownChart({
  data,
  currency,
  emptyMessage,
}: {
  data: BreakdownSlice[];
  currency?: boolean;
  emptyMessage: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={CHART_GRID} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: CHART_MUTED_TEXT }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (currency ? formatGHS(v).replace("GH₵", "₵") : String(v))}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: CHART_MUTED_TEXT }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          formatter={(value: number) => (currency ? formatGHS(value) : value)}
          contentStyle={{ border: "1px solid #E6E2D8", borderRadius: 0, fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={18}>
          {data.map((entry, i) => (
            <Cell key={entry.key} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
