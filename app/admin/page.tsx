import Link from "next/link";
import {
  PackagePlus,
  Inbox,
  ReceiptText,
  FileSpreadsheet,
  Tags,
  Settings as SettingsIcon,
  ArrowRight,
  Wallet,
  Receipt,
  TrendingUp,
  MessageCircleMore,
  Globe,
  Sparkles,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DateRangeSelect } from "@/components/admin/date-range-select";
import { MetricCard } from "@/components/admin/metric-card";
import { SectionHeading } from "@/components/admin/section-heading";
import { NeedsAttention } from "@/components/admin/needs-attention";
import { FunnelChart } from "@/components/admin/funnel-chart";
import { TimeSeriesChart } from "@/components/admin/charts/time-series-chart";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { BarBreakdownChart } from "@/components/admin/charts/bar-breakdown-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  getConversionRate,
  getNeedsAttention,
  getProductHealth,
} from "@/lib/analytics/queries";
import { formatGHS } from "@/lib/currency";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/types";

export const dynamic = "force-dynamic";

// Ghana runs on UTC year-round, so the server clock IS the shop owner's
// local time — no timezone conversion needed for a time-of-day greeting.
function greeting(): string {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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
    conversion,
    attention,
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
    getConversionRate(supabase, range),
    getNeedsAttention(supabase),
    getProductHealth(supabase),
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("sales").select("*").order("sale_date", { ascending: false }).limit(6),
  ]);

  const exportSummaryHref = `/api/admin/export/combined?range=${range.key}&from=${searchParams.from ?? ""}&to=${searchParams.to ?? ""}`;

  return (
    <AdminShell
      title={`${greeting()}.`}
      description="Here's what's happening with Met Scents."
      action={<DateRangeSelect current={range.key} />}
    >
      <div className="space-y-14">
        {/* --- Overview: revenue first, interest second — the shape of the
            business, not a wall of equal boxes. -------------------------- */}
        <section>
          <SectionHeading
            eyebrow={range.label}
            title="Overview"
            description="Compared to the equal-length period immediately before it, where a comparison is meaningful."
          />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="col-span-2">
              <MetricCard
                label="Confirmed Sales Value"
                value={metrics.confirmedSalesValue}
                currency
                changePercent={percentChange(metrics.confirmedSalesValue, metrics.previous.confirmedSalesValue)}
                helpText="Actual revenue — the only figure that is"
                icon={Wallet}
                hero
                accent="revenue"
              />
            </div>
            <MetricCard
              label="Sales Recorded"
              value={metrics.completedSales}
              changePercent={percentChange(metrics.completedSales, metrics.previous.completedSales)}
              icon={Receipt}
              accent="revenue"
            />
            <MetricCard
              label="Average Sale Value"
              value={metrics.averageSaleValue}
              currency
              changePercent={percentChange(metrics.averageSaleValue, metrics.previous.averageSaleValue)}
              icon={TrendingUp}
              accent="revenue"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="New Enquiries"
              value={metrics.newEnquiries}
              changePercent={percentChange(metrics.newEnquiries, metrics.previous.newEnquiries)}
              helpText={`${metrics.totalEnquiries.toLocaleString("en-GH")} all-time`}
              icon={Inbox}
              accent="enquiry"
            />
            <MetricCard
              label="WhatsApp Opened"
              value={metrics.whatsappOpened}
              changePercent={percentChange(metrics.whatsappOpened, metrics.previous.whatsappOpened)}
              icon={MessageCircleMore}
              accent="whatsapp"
            />
            <MetricCard
              label="Website Enquiries"
              value={metrics.websiteEnquiries}
              changePercent={percentChange(metrics.websiteEnquiries, metrics.previous.websiteEnquiries)}
              icon={Globe}
              accent="enquiry"
            />
            <MetricCard
              label="Estimated Enquiry Value"
              value={metrics.estimatedEnquiryValue}
              currency
              changePercent={percentChange(metrics.estimatedEnquiryValue, metrics.previous.estimatedEnquiryValue)}
              helpText="Requested, not revenue"
              icon={Sparkles}
              accent="caution"
            />
            <MetricCard
              label="Enquiry → Sale Conversion"
              value={conversion.rate ?? 0}
              percent
              helpText={
                conversion.rate === null
                  ? "No enquiries in this period"
                  : `${conversion.salesLinkedToEnquiry} of ${conversion.enquiriesInPeriod} enquiries`
              }
              icon={TrendingUp}
              accent="enquiry"
            />
          </div>
        </section>

        {/* --- Needs Attention: actionable, sits right under the numbers —
            this is what the owner should look at before anything else. --- */}
        <section>
          <SectionHeading eyebrow="Today" title="Needs Attention" />
          <NeedsAttention items={attention} />
        </section>

        {/* --- Quick actions: a quiet utility strip, high enough to actually
            get used rather than buried at the foot of the page. ------------ */}
        <section>
          <p className="kicker mb-3">Quick Actions</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <QuickLink href="/admin/products/new" icon={PackagePlus} label="Add Product" />
            <QuickLink href="/admin/sales/new" icon={ReceiptText} label="Record Sale" />
            <QuickLink href="/admin/enquiries" icon={Inbox} label="View Enquiries" />
            <QuickLink href="/admin/categories" icon={Tags} label="Manage Categories" />
            <QuickLink href="/api/admin/export/enquiries" icon={FileSpreadsheet} label="Export Enquiries" external />
            <QuickLink href="/api/admin/export/sales" icon={FileSpreadsheet} label="Export Sales" external />
            <QuickLink href={exportSummaryHref} icon={FileSpreadsheet} label="Export Summary" external />
            <QuickLink href="/admin/settings" icon={SettingsIcon} label="Settings" />
          </div>
        </section>

        {/* --- Customer Journey ------------------------------------------- */}
        <section>
          <SectionHeading eyebrow="Performance" title="Customer Journey" />
          <Card className="border-ink/10">
            <CardContent className="pt-5">
              <FunnelChart funnel={funnel} />
            </CardContent>
          </Card>
        </section>

        {/* --- Trends: intentionally asymmetric — the two "over time"
            charts carry more information, so they get more width. --------- */}
        <section>
          <SectionHeading eyebrow="Trends" title="Enquiries & Sales" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Enquiries Over Time</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <TimeSeriesChart data={enquiriesOverTime} emptyMessage="No enquiries in this period yet." />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>WhatsApp vs Website</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <DonutChart data={sourceBreakdown} emptyMessage="No enquiries in this period yet." />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Sales Over Time</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <TimeSeriesChart data={salesOverTime} currency emptyMessage="No sales recorded in this period yet." />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <DonutChart data={paymentMethods} currency emptyMessage="No sales recorded in this period yet." />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Enquiry Status</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <BarBreakdownChart data={statusBreakdown} emptyMessage="No enquiries in this period yet." />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Sales by Source</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <BarBreakdownChart data={salesBySource} currency emptyMessage="No sales recorded in this period yet." />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* --- Catalogue health: a slim printed-ledger strip, not five more
            cards competing with the metrics above. ------------------------ */}
        <section>
          <SectionHeading eyebrow="Catalogue" title="Product Health" />
          <div className="flex flex-wrap divide-y divide-border border border-border bg-card sm:divide-x sm:divide-y-0">
            <HealthStat label="Active" value={productHealth.active} href="/admin/products?availability=active" />
            <HealthStat label="Unavailable" value={productHealth.unavailable} href="/admin/products?availability=out_of_stock" />
            <HealthStat label="Featured" value={productHealth.featured} href="/admin/products?featured=true" />
            <HealthStat label="Best Sellers" value={productHealth.bestSellers} href="/admin/products?best_seller=true" />
            <HealthStat label="New Arrivals" value={productHealth.newArrivals} href="/admin/products?new_arrival=true" />
          </div>
        </section>

        {/* --- Recent activity ---------------------------------------------- */}
        <section>
          <SectionHeading eyebrow="Latest" title="Recent Activity" />
          <div className="grid gap-4 lg:grid-cols-2">
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
                        <span className="shrink-0 font-accent italic">{formatGHS(Number(e.estimated_total))}</span>
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
                        <span className="shrink-0 font-accent italic">{formatGHS(Number(s.sale_amount))}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function HealthStat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="min-w-[7rem] flex-1 px-5 py-4 text-center transition-colors hover:bg-secondary/40">
      <p className="font-serif text-2xl text-ink">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-widest2 text-muted-foreground">{label}</p>
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: typeof PackagePlus;
  label: string;
  external?: boolean;
}) {
  const className = "flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest2 text-ink/70 transition-colors hover:text-accent-dark";
  const content = (
    <>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {label}
    </>
  );
  return external ? (
    <a href={href} className={className}>{content}</a>
  ) : (
    <Link href={href} className={className}>{content}</Link>
  );
}
