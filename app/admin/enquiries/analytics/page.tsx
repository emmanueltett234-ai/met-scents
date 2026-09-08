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
import { getDashboardMetrics, getEnquiriesOverTime, getSourceBreakdown, getStatusBreakdown } from "@/lib/analytics/queries";
import { getMostRequestedProducts, getMostRequestedSizes } from "@/lib/analytics/product-performance";
import { formatGHS } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function EnquiryAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const rangeKey = (searchParams.range as DateRangeKey) || "30d";
  const range = resolveDateRange(rangeKey, searchParams.from, searchParams.to);
  const supabase = createClient();

  const [metrics, enquiriesOverTime, sourceBreakdown, statusBreakdown, requestedProducts, requestedSizes] =
    await Promise.all([
      getDashboardMetrics(supabase, range),
      getEnquiriesOverTime(supabase, range),
      getSourceBreakdown(supabase, range),
      getStatusBreakdown(supabase, range),
      getMostRequestedProducts(supabase, range),
      getMostRequestedSizes(supabase, range),
    ]);

  const websiteCount = sourceBreakdown.find((s) => s.key === "website")?.value ?? 0;
  const whatsappCount = sourceBreakdown.find((s) => s.key === "whatsapp")?.value ?? 0;
  const unknownCount = sourceBreakdown.find((s) => s.key === "unknown")?.value ?? 0;
  const completedCount = statusBreakdown.find((s) => s.key === "completed")?.value ?? 0;
  const cancelledCount = statusBreakdown.find((s) => s.key === "cancelled")?.value ?? 0;
  const avgEnquiryValue = metrics.newEnquiries > 0 ? metrics.estimatedEnquiryValue / metrics.newEnquiries : 0;

  return (
    <AdminShell title="Enquiry Analytics" action={<DateRangeSelect current={range.key} />}>
      <div className="space-y-8">
        <p className="text-xs text-muted-foreground">
          Every figure here comes from enquiries and enquiry_items — it never reflects confirmed sales. See Sales
          Analytics for actual revenue.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Total Enquiries" value={metrics.newEnquiries} />
          <MetricCard label="Website Enquiries" value={websiteCount} />
          <MetricCard label="WhatsApp-Source Enquiries" value={whatsappCount} />
          <MetricCard label="Unknown-Source Enquiries" value={unknownCount} />
          <MetricCard label="WhatsApp Opened" value={metrics.whatsappOpened} />
          <MetricCard label="Estimated Enquiry Value" value={metrics.estimatedEnquiryValue} currency helpText="Not revenue" />
          <MetricCard label="Average Enquiry Value" value={avgEnquiryValue} currency />
          <MetricCard label="Completed / Cancelled" value={completedCount} helpText={`${cancelledCount} cancelled`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Enquiries Over Time</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <TimeSeriesChart data={enquiriesOverTime} emptyMessage="No enquiries in this period yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Source Breakdown</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <DonutChart data={sourceBreakdown} emptyMessage="No enquiries in this period yet." />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <BarBreakdownChart data={statusBreakdown} emptyMessage="No enquiries in this period yet." />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Most Requested Fragrances</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <PerformanceTable
              rows={requestedProducts}
              emptyMessage="No enquiries in this period yet."
              keyField={(r, i) => r.productId ?? `${r.productName}-${i}`}
              columns={[
                { label: "Product", render: (r) => `${r.brand ? `${r.brand} — ` : ""}${r.productName}` },
                { label: "Number of Enquiries", render: (r) => r.enquiryCount, align: "right" },
                { label: "Quantity Requested", render: (r) => r.quantityRequested, align: "right" },
                { label: "Estimated Value", render: (r) => formatGHS(r.estimatedValue), align: "right" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Most Requested Sizes</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <PerformanceTable
              rows={requestedSizes}
              emptyMessage="No enquiries in this period yet."
              keyField={(r) => r.size}
              columns={[
                { label: "Size", render: (r) => r.size },
                { label: "Enquiries", render: (r) => r.count, align: "right" },
                { label: "Quantity Requested", render: (r) => r.quantity, align: "right" },
                { label: "Estimated Value", render: (r) => formatGHS(r.value), align: "right" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
