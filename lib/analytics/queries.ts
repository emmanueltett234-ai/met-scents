import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { DateRange } from "@/lib/analytics/date-range";
import { previousPeriod } from "@/lib/analytics/date-range";

type Supabase = ReturnType<typeof createClient>;

// ----------------------------------------------------------------------------
// Row counts in this business are small (a single-shop catalogue), so every
// aggregation here fetches the raw rows for the date range — already bounded
// by an indexed created_at/sale_date filter — and reduces them in memory,
// instead of relying on Postgres RPC functions this app has no way to
// install without direct database access.
// ----------------------------------------------------------------------------

interface EnquiryRow {
  id: string;
  created_at: string;
  status: string;
  enquiry_source: string;
  whatsapp_opened: boolean;
  outcome: string;
  estimated_total: number;
}

interface SaleRow {
  id: string;
  sale_date: string;
  source: string;
  payment_method: string;
  sale_amount: number;
}

async function fetchEnquiries(supabase: Supabase, from: Date, to: Date): Promise<EnquiryRow[]> {
  const { data, error } = await supabase
    .from("enquiries")
    .select("id, created_at, status, enquiry_source, whatsapp_opened, outcome, estimated_total")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());
  if (error) {
    console.error("Failed to fetch enquiries for analytics:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({ ...r, estimated_total: Number(r.estimated_total) }));
}

async function fetchSales(supabase: Supabase, from: Date, to: Date): Promise<SaleRow[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("id, sale_date, source, payment_method, sale_amount")
    .gte("sale_date", from.toISOString())
    .lt("sale_date", to.toISOString());
  if (error) {
    console.error("Failed to fetch sales for analytics:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({ ...r, sale_amount: Number(r.sale_amount) }));
}

export interface DashboardMetrics {
  newEnquiries: number;
  totalEnquiries: number; // all-time, not period-scoped — shown for context
  whatsappOpened: number;
  websiteEnquiries: number;
  estimatedEnquiryValue: number;
  completedSales: number;
  confirmedSalesValue: number;
  averageSaleValue: number;
  previous: {
    newEnquiries: number;
    whatsappOpened: number;
    websiteEnquiries: number;
    estimatedEnquiryValue: number;
    completedSales: number;
    confirmedSalesValue: number;
    averageSaleValue: number;
  };
}

export async function getDashboardMetrics(supabase: Supabase, range: DateRange): Promise<DashboardMetrics> {
  const prev = previousPeriod(range);

  const [enquiries, sales, prevEnquiries, prevSales, { count: totalEnquiries }] = await Promise.all([
    fetchEnquiries(supabase, range.from, range.to),
    fetchSales(supabase, range.from, range.to),
    fetchEnquiries(supabase, prev.from, prev.to),
    fetchSales(supabase, prev.from, prev.to),
    supabase.from("enquiries").select("id", { count: "exact", head: true }),
  ]);

  const summarize = (enq: EnquiryRow[], sal: SaleRow[]) => ({
    newEnquiries: enq.length,
    whatsappOpened: enq.filter((e) => e.whatsapp_opened).length,
    websiteEnquiries: enq.filter((e) => e.enquiry_source === "website").length,
    estimatedEnquiryValue: enq.reduce((sum, e) => sum + e.estimated_total, 0),
    completedSales: sal.length,
    confirmedSalesValue: sal.reduce((sum, s) => sum + s.sale_amount, 0),
    averageSaleValue: sal.length > 0 ? sal.reduce((sum, s) => sum + s.sale_amount, 0) / sal.length : 0,
  });

  const current = summarize(enquiries, sales);
  const previous = summarize(prevEnquiries, prevSales);

  return { ...current, totalEnquiries: totalEnquiries ?? 0, previous };
}

export interface FunnelData {
  enquiries: number;
  whatsappOpened: number;
  contacted: number;
  saleCompleted: number;
}

// Funnel is built from the SAME cohort (enquiries created within the
// period), so each stage is a true subset of the one before it. This does
// NOT imply every customer follows this exact sequence — it's a summary of
// how many reached each stage, nothing more.
export async function getFunnel(supabase: Supabase, range: DateRange): Promise<FunnelData> {
  const enquiries = await fetchEnquiries(supabase, range.from, range.to);
  return {
    enquiries: enquiries.length,
    whatsappOpened: enquiries.filter((e) => e.whatsapp_opened).length,
    contacted: enquiries.filter((e) => e.outcome === "contacted" || e.outcome === "sale_completed" || e.outcome === "no_sale").length,
    saleCompleted: enquiries.filter((e) => e.outcome === "sale_completed").length,
  };
}

export interface TimeSeriesPoint {
  bucket: string; // ISO date or hour label, chart-ready
  label: string;
  value: number;
}

function bucketKey(date: Date, granularity: DateRange["granularity"]): string {
  if (granularity === "hour") {
    return `${date.toISOString().slice(0, 13)}:00`; // YYYY-MM-DDTHH:00
  }
  if (granularity === "week") {
    // ISO week start (Monday), in UTC.
    const d = new Date(date);
    const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0, 10);
  }
  if (granularity === "month") {
    return date.toISOString().slice(0, 7); // YYYY-MM
  }
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function bucketLabel(key: string, granularity: DateRange["granularity"]): string {
  if (granularity === "hour") {
    const d = new Date(key);
    return d.toLocaleTimeString("en-GH", { hour: "numeric", hour12: true, timeZone: "UTC" });
  }
  if (granularity === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GH", { month: "short", year: "numeric", timeZone: "UTC" });
  }
  const d = new Date(key);
  return d.toLocaleDateString("en-GH", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Every bucket in [from, to) gets an entry, even if the count is zero, so charts never have silent gaps. */
function allBucketKeys(from: Date, to: Date, granularity: DateRange["granularity"]): string[] {
  const keys: string[] = [];
  const stepMs = { hour: 3600_000, day: 86_400_000, week: 7 * 86_400_000, month: 0 }[granularity];
  if (granularity === "month") {
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
    while (cursor <= end) {
      keys.push(bucketKey(cursor, granularity));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return keys;
  }
  let cursor = new Date(from);
  if (granularity === "week") cursor = new Date(bucketKey(from, "week"));
  while (cursor < to) {
    const key = bucketKey(cursor, granularity);
    if (!keys.includes(key)) keys.push(key);
    cursor = new Date(cursor.getTime() + stepMs);
  }
  return keys;
}

export async function getEnquiriesOverTime(supabase: Supabase, range: DateRange): Promise<TimeSeriesPoint[]> {
  const enquiries = await fetchEnquiries(supabase, range.from, range.to);
  const counts = new Map<string, number>();
  for (const e of enquiries) {
    const key = bucketKey(new Date(e.created_at), range.granularity);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return allBucketKeys(range.from, range.to, range.granularity).map((key) => ({
    bucket: key,
    label: bucketLabel(key, range.granularity),
    value: counts.get(key) ?? 0,
  }));
}

export async function getSalesOverTime(supabase: Supabase, range: DateRange): Promise<TimeSeriesPoint[]> {
  const sales = await fetchSales(supabase, range.from, range.to);
  const totals = new Map<string, number>();
  for (const s of sales) {
    const key = bucketKey(new Date(s.sale_date), range.granularity);
    totals.set(key, (totals.get(key) ?? 0) + s.sale_amount);
  }
  return allBucketKeys(range.from, range.to, range.granularity).map((key) => ({
    bucket: key,
    label: bucketLabel(key, range.granularity),
    value: Math.round((totals.get(key) ?? 0) * 100) / 100,
  }));
}

export interface BreakdownSlice {
  key: string;
  label: string;
  value: number;
}

export async function getSourceBreakdown(supabase: Supabase, range: DateRange): Promise<BreakdownSlice[]> {
  const enquiries = await fetchEnquiries(supabase, range.from, range.to);
  const labels: Record<string, string> = { website: "Website", whatsapp: "WhatsApp", unknown: "Unknown" };
  const counts: Record<string, number> = { website: 0, whatsapp: 0, unknown: 0 };
  for (const e of enquiries) counts[e.enquiry_source] = (counts[e.enquiry_source] ?? 0) + 1;
  return Object.entries(counts).map(([key, value]) => ({ key, label: labels[key] ?? key, value }));
}

export async function getStatusBreakdown(supabase: Supabase, range: DateRange): Promise<BreakdownSlice[]> {
  const enquiries = await fetchEnquiries(supabase, range.from, range.to);
  const labels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  const counts: Record<string, number> = { new: 0, contacted: 0, pending: 0, completed: 0, cancelled: 0 };
  for (const e of enquiries) counts[e.status] = (counts[e.status] ?? 0) + 1;
  return Object.entries(counts).map(([key, value]) => ({ key, label: labels[key] ?? key, value }));
}

export async function getSalesBySource(supabase: Supabase, range: DateRange): Promise<BreakdownSlice[]> {
  const sales = await fetchSales(supabase, range.from, range.to);
  const labels: Record<string, string> = {
    website: "Website",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    walk_in: "Walk-in",
    referral: "Referral",
    other: "Other",
  };
  const counts: Record<string, number> = {};
  for (const s of sales) counts[s.source] = (counts[s.source] ?? 0) + s.sale_amount;
  return Object.entries(labels)
    .map(([key, label]) => ({ key, label, value: Math.round((counts[key] ?? 0) * 100) / 100 }))
    .filter((s) => s.value > 0 || sales.length === 0);
}

export async function getPaymentMethodBreakdown(supabase: Supabase, range: DateRange): Promise<BreakdownSlice[]> {
  const sales = await fetchSales(supabase, range.from, range.to);
  const labels: Record<string, string> = {
    cash: "Cash",
    mobile_money: "Mobile Money",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };
  const counts: Record<string, number> = {};
  for (const s of sales) counts[s.payment_method] = (counts[s.payment_method] ?? 0) + s.sale_amount;
  return Object.entries(labels)
    .map(([key, label]) => ({ key, label, value: Math.round((counts[key] ?? 0) * 100) / 100 }))
    .filter((s) => s.value > 0 || sales.length === 0);
}

export interface ConversionRate {
  enquiriesInPeriod: number;
  salesLinkedToEnquiry: number; // sales in period whose enquiry was ALSO created in this period
  rate: number | null; // null when there are no enquiries to divide by — never invented
}

// Conversion rate = completed sales linked to an enquiry ÷ enquiries in the
// period. Direct sales with no enquiry are excluded from this ratio (there's
// nothing for them to "convert" from) but are still counted in total sales
// and revenue everywhere else on the dashboard.
export async function getConversionRate(supabase: Supabase, range: DateRange): Promise<ConversionRate> {
  const enquiries = await fetchEnquiries(supabase, range.from, range.to);
  const enquiryIds = new Set(enquiries.map((e) => e.id));

  const { data: sales, error } = await supabase
    .from("sales")
    .select("id, enquiry_id")
    .gte("sale_date", range.from.toISOString())
    .lt("sale_date", range.to.toISOString())
    .not("enquiry_id", "is", null);

  if (error) {
    console.error("Failed to fetch sales for conversion rate:", error.message);
    return { enquiriesInPeriod: enquiries.length, salesLinkedToEnquiry: 0, rate: null };
  }

  const linkedCount = (sales ?? []).filter((s) => s.enquiry_id && enquiryIds.has(s.enquiry_id)).length;

  return {
    enquiriesInPeriod: enquiries.length,
    salesLinkedToEnquiry: linkedCount,
    rate: enquiries.length > 0 ? (linkedCount / enquiries.length) * 100 : null,
  };
}

export interface ProductHealth {
  active: number;
  unavailable: number;
  featured: number;
  bestSellers: number;
  newArrivals: number;
}

export async function getProductHealth(supabase: Supabase): Promise<ProductHealth> {
  const { data, error } = await supabase.from("products").select("availability, featured, best_seller, new_arrival");
  if (error || !data) return { active: 0, unavailable: 0, featured: 0, bestSellers: 0, newArrivals: 0 };
  return {
    active: data.filter((p) => p.availability !== "out_of_stock").length,
    unavailable: data.filter((p) => p.availability === "out_of_stock").length,
    featured: data.filter((p) => p.featured).length,
    bestSellers: data.filter((p) => p.best_seller).length,
    newArrivals: data.filter((p) => p.new_arrival).length,
  };
}
