"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { colorForKey } from "@/components/admin/charts/chart-colors";
import { formatGHS } from "@/lib/currency";
import type { BreakdownSlice } from "@/lib/analytics/queries";

export function DonutChart({
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
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={entry.key} fill={colorForKey(entry.key, i)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => (currency ? formatGHS(value) : value)}
          contentStyle={{ border: "1px solid #E2E5DB", borderRadius: 8, fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "#5E5B4F" }}
          formatter={(value) => <span style={{ color: "#5E5B4F" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
