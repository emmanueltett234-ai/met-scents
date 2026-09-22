import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateRangeSelect } from "@/components/admin/date-range-select";
import { PrintButton } from "@/components/admin/reports/print-button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import { resolveDateRange, type DateRangeKey } from "@/lib/analytics/date-range";
import { getProfitMetrics, getProfitByProduct, getExpensesByCategory, getLowStockAlerts, getDashboardMetrics } from "@/lib/analytics/queries";
import { formatGHS } from "@/lib/currency";
import { INVENTORY_STATUS_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const supabase = createClient();
  const rangeKey = (searchParams.range as DateRangeKey) || "30d";
  const range = resolveDateRange(rangeKey, searchParams.from, searchParams.to);
  const settings = await getSettings();

  const [profit, byProduct, expensesByCategory, lowStock, dashboardMetrics] = await Promise.all([
    getProfitMetrics(supabase, range),
    getProfitByProduct(supabase, range),
    getExpensesByCategory(supabase, range),
    getLowStockAlerts(supabase, settings.default_low_stock_threshold_ml),
    getDashboardMetrics(supabase, range),
  ]);

  const exportParams = `range=${range.key}&from=${searchParams.from ?? ""}&to=${searchParams.to ?? ""}`;

  return (
    <AdminShell
      title="Reports"
      description="Inventory, sales, profit, expense, marketing, and product performance — one printable summary."
      action={<DateRangeSelect current={range.key} />}
    >
      <div className="mb-8 flex flex-wrap gap-2 print:hidden">
        <PrintButton />
        <Button asChild variant="outline" size="sm">
          <a href={`/api/admin/export/profit?${exportParams}`}><FileSpreadsheet className="h-4 w-4" /> Export Profit Report</a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href="/api/admin/export/inventory"><FileSpreadsheet className="h-4 w-4" /> Export Inventory Report</a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/admin/export/expenses?from=${searchParams.from ?? ""}&to=${searchParams.to ?? ""}`}><FileSpreadsheet className="h-4 w-4" /> Export Expense Report</a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/admin/export/sales?from=${searchParams.from ?? ""}&to=${searchParams.to ?? ""}`}><FileSpreadsheet className="h-4 w-4" /> Export Sales Report</a>
        </Button>
      </div>

      {/* Everything below this point is what prints. */}
      <div className="space-y-10">
        <div>
          <h1 className="font-serif text-2xl">Met Scents — Business Report</h1>
          <p className="text-sm text-muted-foreground">
            {range.label} · Generated {new Date().toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>

        <section>
          <h2 className="mb-3 font-serif text-lg">Profit Summary</h2>
          <Table>
            <TableBody>
              <TableRow><TableCell>Sales Revenue</TableCell><TableCell className="text-right">{formatGHS(profit.revenue)}</TableCell></TableRow>
              <TableRow><TableCell>Product Cost</TableCell><TableCell className="text-right">{formatGHS(profit.productCost)}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">Gross Profit</TableCell><TableCell className="text-right font-medium">{formatGHS(profit.grossProfit)}</TableCell></TableRow>
              <TableRow><TableCell>Marketing / Branding / Other Expenses</TableCell><TableCell className="text-right">{formatGHS(profit.totalExpenses)}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">Net Profit</TableCell><TableCell className="text-right font-medium">{formatGHS(profit.netProfit)}</TableCell></TableRow>
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">
            {dashboardMetrics.completedSales} sale{dashboardMetrics.completedSales === 1 ? "" : "s"} recorded in this period.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-lg">Product Performance</h2>
          {byProduct.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales recorded in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Perfume</TableHead>
                  <TableHead>Units Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byProduct.map((p) => (
                  <TableRow key={p.productId ?? p.productName}>
                    <TableCell>{p.productName}</TableCell>
                    <TableCell>{p.unitsSold}</TableCell>
                    <TableCell>{formatGHS(p.revenue)}</TableCell>
                    <TableCell>{p.cost != null ? formatGHS(p.cost) : "not tracked"}</TableCell>
                    <TableCell>{p.profit != null ? formatGHS(p.profit) : "not tracked"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-serif text-lg">Marketing &amp; Expenses by Category</h2>
          {expensesByCategory.every((e) => e.value === 0) ? (
            <p className="text-sm text-muted-foreground">No expenses recorded in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Category</TableHead><TableHead>Amount</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {expensesByCategory.filter((e) => e.value > 0).map((e) => (
                  <TableRow key={e.key}><TableCell>{e.label}</TableCell><TableCell>{formatGHS(e.value)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-serif text-lg">Low &amp; Out of Stock (Current)</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing needs restocking right now.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Perfume</TableHead><TableHead>Remaining</TableHead><TableHead>Threshold</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((s) => (
                  <TableRow key={s.productId}>
                    <TableCell>{s.brand} — {s.name}</TableCell>
                    <TableCell>{s.currentMl.toLocaleString()}ml</TableCell>
                    <TableCell>{s.thresholdMl.toLocaleString()}ml</TableCell>
                    <TableCell>{INVENTORY_STATUS_LABELS[s.status]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <p className="text-xs text-muted-foreground print:hidden">
          Need the full inventory table or every sale/expense line?{" "}
          <Link href="/admin/inventory" className="underline hover:text-ink">Inventory</Link>,{" "}
          <Link href="/admin/sales" className="underline hover:text-ink">Sales</Link>, and{" "}
          <Link href="/admin/expenses" className="underline hover:text-ink">Expenses</Link> each have their own detailed, filterable list with export.
        </p>
      </div>
    </AdminShell>
  );
}
