import { AdminShell } from "@/components/admin/admin-shell";
import { DateRangeSelect } from "@/components/admin/date-range-select";
import { MetricCard } from "@/components/admin/metric-card";
import { TimeSeriesChart } from "@/components/admin/charts/time-series-chart";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { BarBreakdownChart } from "@/components/admin/charts/bar-breakdown-chart";
import { PerformanceTable } from "@/components/admin/analytics/performance-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { resolveDateRange, type DateRangeKey } from "@/lib/analytics/date-range";
import { getDashboardMetrics, getSalesOverTime, getSalesBySource, getPaymentMethodBreakdown, getConversionRate } from "@/lib/analytics/queries";
import { getBestSellingProducts, getBestSellingSizes, getProductPerformance } from "@/lib/analytics/product-performance";
import { formatGHS } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { AVAILABILITY_LABELS, type Availability } from "@/types";

export const dynamic = "force-dynamic";

export default async function SalesAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const rangeKey = (searchParams.range as DateRangeKey) || "30d";
  const range = resolveDateRange(rangeKey, searchParams.from, searchParams.to);
  const supabase = createClient();

  const [metrics, salesOverTime, salesBySource, paymentMethods, conversion, bestSellingProducts, bestSellingSizes, productPerformance] =
    await Promise.all([
      getDashboardMetrics(supabase, range),
      getSalesOverTime(supabase, range),
      getSalesBySource(supabase, range),
      getPaymentMethodBreakdown(supabase, range),
      getConversionRate(supabase, range),
      getBestSellingProducts(supabase, range),
      getBestSellingSizes(supabase, range),
      getProductPerformance(supabase, range),
    ]);

  return (
    <AdminShell title="Sales Analytics" action={<DateRangeSelect current={range.key} />}>
      <div className="space-y-8">
        <p className="text-xs text-muted-foreground">
          Every figure here comes from the sales ledger only — confirmed, admin-recorded sales. This is the only
          source of revenue anywhere in this admin.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Completed Sales" value={metrics.completedSales} />
          <MetricCard label="Confirmed Sales Value" value={metrics.confirmedSalesValue} currency />
          <MetricCard label="Average Sale Value" value={metrics.averageSaleValue} currency />
          <MetricCard
            label="Enquiry-to-Sale Conversion"
            value={conversion.rate ?? 0}
            helpText={
              conversion.rate === null
                ? "No enquiries in this period"
                : `${conversion.salesLinkedToEnquiry} of ${conversion.enquiriesInPeriod} enquiries`
            }
          />
        </div>
        <p className="-mt-4 text-xs text-muted-foreground">
          Conversion rate counts only sales linked to an enquiry from this same period. Direct sales (WhatsApp,
          Instagram, walk-in, referral, other) are excluded from this ratio but still counted in every revenue figure
          above.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Sales Over Time</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <TimeSeriesChart data={salesOverTime} currency emptyMessage="No sales recorded in this period yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sales by Source</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <BarBreakdownChart data={salesBySource} currency emptyMessage="No sales recorded in this period yet." />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <DonutChart data={paymentMethods} currency emptyMessage="No sales recorded in this period yet." />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Best-Selling Fragrances</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <PerformanceTable
              rows={bestSellingProducts}
              emptyMessage="No sales recorded in this period yet."
              keyField={(r, i) => r.productId ?? `${r.productName}-${i}`}
              columns={[
                { label: "Product", render: (r) => `${r.brand ? `${r.brand} — ` : ""}${r.productName}` },
                { label: "Units Sold", render: (r) => r.unitsSold, align: "right" },
                { label: "Number of Sales", render: (r) => r.numberOfSales, align: "right" },
                { label: "Confirmed Sales Value", render: (r) => formatGHS(r.confirmedSalesValue), align: "right" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Best-Selling Sizes</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <PerformanceTable
              rows={bestSellingSizes}
              emptyMessage="No sales recorded in this period yet."
              keyField={(r) => r.size}
              columns={[
                { label: "Size", render: (r) => r.size },
                { label: "Sales", render: (r) => r.count, align: "right" },
                { label: "Units Sold", render: (r) => r.quantity, align: "right" },
                { label: "Confirmed Sales Value", render: (r) => formatGHS(r.value), align: "right" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Product Performance</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <PerformanceTable
              rows={productPerformance.filter((r) => r.enquiryCount > 0 || r.unitsSold > 0)}
              emptyMessage="No enquiries or sales for any product in this period yet."
              keyField={(r) => r.productId}
              columns={[
                {
                  label: "Product",
                  render: (r) => (
                    <div>
                      <p>{r.brand} — {r.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline">{AVAILABILITY_LABELS[r.availability as Availability]}</Badge>
                        {r.featured && <Badge variant="muted">Featured</Badge>}
                        {r.bestSeller && <Badge variant="muted">Best Seller</Badge>}
                        {r.newArrival && <Badge variant="muted">New Arrival</Badge>}
                      </div>
                    </div>
                  ),
                },
                { label: "Enquiries", render: (r) => r.enquiryCount, align: "right" },
                { label: "Qty Requested", render: (r) => r.quantityRequested, align: "right" },
                { label: "Units Sold", render: (r) => r.unitsSold, align: "right" },
                { label: "Sales Value", render: (r) => formatGHS(r.confirmedSalesValue), align: "right" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
