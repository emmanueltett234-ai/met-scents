import Link from "next/link";
import {
  PackagePlus,
  Inbox,
  ReceiptText,
  FileSpreadsheet,
  Tags,
  Settings as SettingsIcon,
  ArrowRight,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateRangeSelect } from "@/components/admin/date-range-select";
import { MetricCard } from "@/components/admin/metric-card";
import { FunnelChart } from "@/components/admin/funnel-chart";
import { TimeSeriesChart } from "@/components/admin/charts/time-series-chart";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { BarBreakdownChart } from "@/components/admin/charts/bar-breakdown-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { resolveDateRange, percentChange, type DateRangeKey } from "@/lib/analytics/date-range";
import {
  getDashboardMetrics,
  getFunnel,
  getEnquiriesOverTime,
  getSourceBreakdown,
  getStatusBreakdown,
  getSalesOverTime,
  getSalesBySource,
  getPaymentMethodBreakdown,
  getProductHealth,
} from "@/lib/analytics/queries";
import { formatGHS } from "@/lib/currency";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const rangeKey = (searchParams.range as DateRangeKey) || "30d";
  const range = resolveDateRange(rangeKey, searchParams.from, searchParams.to);

  const supabase = createClient();

  const [
    metrics,
    funnel,
    enquiriesOverTime,
    sourceBreakdown,
    statusBreakdown,
    salesOverTime,
    salesBySource,
    paymentMethods,
    productHealth,
    { data: recentEnquiries },
    { data: recentSales },
  ] = await Promise.all([
    getDashboardMetrics(supabase, range),
    getFunnel(supabase, range),
    getEnquiriesOverTime(supabase, range),
    getSourceBreakdown(supabase, range),
    getStatusBreakdown(supabase, range),
    getSalesOverTime(supabase, range),
    getSalesBySource(supabase, range),
    getPaymentMethodBreakdown(supabase, range),
    getProductHealth(supabase),
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("sales").select("*").order("sale_date", { ascending: false }).limit(6),
  ]);

  return (
    <AdminShell
      title="Dashboard"
      action={<DateRangeSelect current={range.key} />}
    >
      <div className="space-y-8">
        <p className="text-xs text-muted-foreground">
          Showing {range.label.toLowerCase()} — compared to the equal-length period immediately before it.
        </p>

        {/* --- Summary cards ------------------------------------------------ */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard
            label="New Enquiries"
            value={metrics.newEnquiries}
            changePercent={percentChange(metrics.newEnquiries, metrics.previous.newEnquiries)}
          />
          <MetricCard label="Total Enquiries" value={metrics.totalEnquiries} helpText="All time" />
          <MetricCard
            label="WhatsApp Opened"
            value={metrics.whatsappOpened}
            changePercent={percentChange(metrics.whatsappOpened, metrics.previous.whatsappOpened)}
          />
          <MetricCard
            label="Website Enquiries"
            value={metrics.websiteEnquiries}
            changePercent={percentChange(metrics.websiteEnquiries, metrics.previous.websiteEnquiries)}
          />
          <MetricCard
            label="Estimated Enquiry Value"
            value={metrics.estimatedEnquiryValue}
            currency
            changePercent={percentChange(metrics.estimatedEnquiryValue, metrics.previous.estimatedEnquiryValue)}
            helpText="Not revenue"
          />
          <MetricCard
            label="Completed Sales"
            value={metrics.completedSales}
            changePercent={percentChange(metrics.completedSales, metrics.previous.completedSales)}
          />
          <MetricCard
            label="Confirmed Sales Value"
            value={metrics.confirmedSalesValue}
            currency
            changePercent={percentChange(metrics.confirmedSalesValue, metrics.previous.confirmedSalesValue)}
            helpText="Actual revenue"
          />
          <MetricCard
            label="Average Sale Value"
            value={metrics.averageSaleValue}
            currency
            changePercent={percentChange(metrics.averageSaleValue, metrics.previous.averageSaleValue)}
          />
        </div>

        {/* --- Funnel --------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Journey</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <FunnelChart funnel={funnel} />
          </CardContent>
        </Card>

        {/* --- Charts ---------------------------------------------------------- */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Enquiries Over Time</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <TimeSeriesChart data={enquiriesOverTime} emptyMessage="No enquiries in this period yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sales Over Time</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <TimeSeriesChart data={salesOverTime} currency emptyMessage="No sales recorded in this period yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>WhatsApp vs Website</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <DonutChart data={sourceBreakdown} emptyMessage="No enquiries in this period yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Enquiry Status</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <BarBreakdownChart data={statusBreakdown} emptyMessage="No enquiries in this period yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sales by Source</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <BarBreakdownChart data={salesBySource} currency emptyMessage="No sales recorded in this period yet." />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <DonutChart data={paymentMethods} currency emptyMessage="No sales recorded in this period yet." />
            </CardContent>
          </Card>
        </div>

        {/* --- Product health --------------------------------------------------- */}
        <Card>
          <CardHeader><CardTitle>Product Health</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <ProductHealthTile label="Active" value={productHealth.active} href="/admin/products?availability=active" />
              <ProductHealthTile label="Unavailable" value={productHealth.unavailable} href="/admin/products?availability=out_of_stock" />
              <ProductHealthTile label="Featured" value={productHealth.featured} href="/admin/products?featured=true" />
              <ProductHealthTile label="Best Sellers" value={productHealth.bestSellers} href="/admin/products?best_seller=true" />
              <ProductHealthTile label="New Arrivals" value={productHealth.newArrivals} href="/admin/products?new_arrival=true" />
            </div>
          </CardContent>
        </Card>

        {/* --- Quick actions ----------------------------------------------------- */}
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-widest2 text-muted-foreground">Quick Actions</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm"><Link href="/admin/products/new"><PackagePlus className="h-4 w-4" /> Add Product</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/enquiries"><Inbox className="h-4 w-4" /> View Enquiries</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/sales/new"><ReceiptText className="h-4 w-4" /> Record Sale</Link></Button>
            <Button asChild variant="outline" size="sm"><a href="/api/admin/export/enquiries"><FileSpreadsheet className="h-4 w-4" /> Export Enquiries</a></Button>
            <Button asChild variant="outline" size="sm"><a href="/api/admin/export/sales"><FileSpreadsheet className="h-4 w-4" /> Export Sales</a></Button>
            <Button asChild variant="outline" size="sm"><a href={`/api/admin/export/combined?range=${range.key}&from=${searchParams.from ?? ""}&to=${searchParams.to ?? ""}`}><FileSpreadsheet className="h-4 w-4" /> Export Summary Workbook</a></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/categories"><Tags className="h-4 w-4" /> Manage Categories</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/admin/settings"><SettingsIcon className="h-4 w-4" /> Settings</Link></Button>
          </div>
        </div>

        {/* --- Recent activity ----------------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent Enquiries</CardTitle>
              <Link href="/admin/enquiries" className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest2 text-accent-dark">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {(recentEnquiries ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No enquiries yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {(recentEnquiries ?? []).map((e) => (
                    <Link
                      key={e.id}
                      href={`/admin/enquiries/${e.id}`}
                      className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-secondary/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ENQUIRY_STATUS_LABELS[e.status as EnquiryStatus]} ·{" "}
                          {new Date(e.created_at).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm">{formatGHS(Number(e.estimated_total))}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent Sales</CardTitle>
              <Link href="/admin/sales" className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest2 text-accent-dark">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {(recentSales ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No confirmed sales recorded.</p>
              ) : (
                <div className="divide-y divide-border">
                  {(recentSales ?? []).map((s) => (
                    <Link
                      key={s.id}
                      href={`/admin/sales/${s.id}`}
                      className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-secondary/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.customer_name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {s.source.replace("_", " ")} ·{" "}
                          {new Date(s.sale_date).toLocaleDateString("en-GH", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm">{formatGHS(Number(s.sale_amount))}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function ProductHealthTile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="min-w-0 border border-border p-4 text-center transition-colors hover:border-ink">
      <p className="font-serif text-xl">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-widest2 text-muted-foreground">{label}</p>
    </Link>
  );
}
