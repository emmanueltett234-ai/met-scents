import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { DateRange } from "@/lib/analytics/date-range";
import { previousPeriod } from "@/lib/analytics/date-range";
import { inventoryStatus, effectiveThreshold } from "@/lib/inventory/status";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

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

export interface AttentionItem {
  key: string;
  count: number;
  label: string;
  description: string;
  href: string;
}

// Always reflects CURRENT state, not the selected date range — "what needs
// my attention right now" doesn't care whether a stale enquiry arrived
// yesterday or three weeks ago. Every count is a cheap head-only query.
export async function getNeedsAttention(supabase: Supabase, defaultLowStockThresholdMl: number): Promise<AttentionItem[]> {
  const [newEnquiries, pendingEnquiries, awaitingFollowUp, unavailableProducts, lowStock] = await Promise.all([
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("whatsapp_opened", true)
      .eq("outcome", "no_decision"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("availability", "out_of_stock"),
    getLowStockAlerts(supabase, defaultLowStockThresholdMl),
  ]);

  const items: AttentionItem[] = [
    {
      key: "new",
      count: newEnquiries.count ?? 0,
      label: "New Enquiries",
      description: "Customers waiting for a response",
      href: "/admin/enquiries?status=new",
    },
    {
      key: "pending",
      count: pendingEnquiries.count ?? 0,
      label: "Pending Enquiries",
      description: "Follow-up required",
      href: "/admin/enquiries?status=pending",
    },
    {
      key: "awaiting_followup",
      count: awaitingFollowUp.count ?? 0,
      label: "WhatsApp Opened, No Decision Yet",
      description: "Chat was opened but nothing's been recorded since",
      href: "/admin/enquiries?whatsapp_opened=true",
    },
    {
      key: "unavailable",
      count: unavailableProducts.count ?? 0,
      label: "Unavailable Products",
      description: "Review catalogue availability",
      href: "/admin/products?availability=out_of_stock",
    },
    {
      key: "low_stock",
      count: lowStock.length,
      label: "Low or Out of Stock Perfumes",
      description: "Juice running low — restock soon",
      href: "/admin/inventory?status=low_stock",
    },
  ];

  return items.filter((i) => i.count > 0);
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

// ----------------------------------------------------------------------------
// Inventory cost/profit & expenses — a sale's true product cost/profit is
// only ever read from sale_items.line_cost/line_profit (snapshotted at sale
// time), never recomputed from current inventory cost, so historical profit
// never drifts when costs are edited later.
// ----------------------------------------------------------------------------

interface SaleItemCostRow {
  sale_id: string;
  sale_date: string | null;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number;
  line_total: number;
  line_cost: number | null;
  line_profit: number | null;
}

async function fetchSaleItemsWithCost(supabase: Supabase, from: Date, to: Date): Promise<SaleItemCostRow[]> {
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("id, sale_date")
    .gte("sale_date", from.toISOString())
    .lt("sale_date", to.toISOString());
  if (salesError || !sales || sales.length === 0) {
    if (salesError) console.error("Failed to fetch sales for profit analytics:", salesError.message);
    return [];
  }

  const saleDateById = new Map(sales.map((s) => [s.id, s.sale_date]));
  const { data, error } = await supabase
    .from("sale_items")
    .select("sale_id, product_id, product_name_snapshot, quantity, line_total, line_cost, line_profit")
    .in("sale_id", sales.map((s) => s.id));
  if (error) {
    console.error("Failed to fetch sale items for profit analytics:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    ...r,
    sale_date: saleDateById.get(r.sale_id) ?? null,
    line_total: Number(r.line_total),
    line_cost: r.line_cost != null ? Number(r.line_cost) : null,
    line_profit: r.line_profit != null ? Number(r.line_profit) : null,
  }));
}

interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  expense_date: string;
}

async function fetchExpenses(supabase: Supabase, from: Date, to: Date): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("business_expenses")
    .select("id, amount, category, expense_date")
    .gte("expense_date", from.toISOString())
    .lt("expense_date", to.toISOString());
  if (error) {
    console.error("Failed to fetch expenses for analytics:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));
}

export interface ProfitMetrics {
  revenue: number;
  productCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  previous: {
    revenue: number;
    productCost: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
  };
}

// Revenue is the recorded sale_amount (the source of truth used everywhere
// else on the dashboard) — NOT the sum of sale_items line totals, since a
// sale's amount can be manually overridden for discounts/adjustments.
// Product cost is summed separately from sale_items.line_cost (COGS), so
// gross profit = revenue - productCost, matching the brief's worked example
// exactly (never confusing revenue with profit).
export async function getProfitMetrics(supabase: Supabase, range: DateRange): Promise<ProfitMetrics> {
  const prev = previousPeriod(range);

  async function summarize(from: Date, to: Date) {
    const [sales, items, expenses] = await Promise.all([
      fetchSales(supabase, from, to),
      fetchSaleItemsWithCost(supabase, from, to),
      fetchExpenses(supabase, from, to),
    ]);
    const revenue = sales.reduce((sum, s) => sum + s.sale_amount, 0);
    const productCost = items.reduce((sum, i) => sum + (i.line_cost ?? 0), 0);
    const grossProfit = revenue - productCost;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    return {
      revenue: Math.round(revenue * 100) / 100,
      productCost: Math.round(productCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
    };
  }

  const [current, previous] = await Promise.all([summarize(range.from, range.to), summarize(prev.from, prev.to)]);
  return { ...current, previous };
}

export async function getProfitOverTime(supabase: Supabase, range: DateRange): Promise<TimeSeriesPoint[]> {
  const items = await fetchSaleItemsWithCost(supabase, range.from, range.to);
  const totals = new Map<string, number>();
  for (const i of items) {
    if (i.line_profit == null || !i.sale_date) continue;
    const key = bucketKey(new Date(i.sale_date), range.granularity);
    totals.set(key, (totals.get(key) ?? 0) + i.line_profit);
  }
  return allBucketKeys(range.from, range.to, range.granularity).map((key) => ({
    bucket: key,
    label: bucketLabel(key, range.granularity),
    value: Math.round((totals.get(key) ?? 0) * 100) / 100,
  }));
}

export async function getExpensesOverTime(supabase: Supabase, range: DateRange): Promise<TimeSeriesPoint[]> {
  const expenses = await fetchExpenses(supabase, range.from, range.to);
  const totals = new Map<string, number>();
  for (const e of expenses) {
    const key = bucketKey(new Date(e.expense_date), range.granularity);
    totals.set(key, (totals.get(key) ?? 0) + e.amount);
  }
  return allBucketKeys(range.from, range.to, range.granularity).map((key) => ({
    bucket: key,
    label: bucketLabel(key, range.granularity),
    value: Math.round((totals.get(key) ?? 0) * 100) / 100,
  }));
}

export async function getExpensesByCategory(supabase: Supabase, range: DateRange): Promise<BreakdownSlice[]> {
  const expenses = await fetchExpenses(supabase, range.from, range.to);
  const counts: Record<string, number> = {};
  for (const e of expenses) counts[e.category] = (counts[e.category] ?? 0) + e.amount;
  return Object.entries(EXPENSE_CATEGORY_LABELS)
    .map(([key, label]) => ({ key, label, value: Math.round((counts[key] ?? 0) * 100) / 100 }))
    .filter((s) => s.value > 0 || expenses.length === 0);
}

export interface ProductProfitRow {
  productId: string | null;
  productName: string;
  unitsSold: number;
  revenue: number;
  cost: number | null; // null when NO item for this product had tracked cost
  profit: number | null;
}

// Best-selling fragrances by units sold and by revenue/profit — grouped by
// product_id where available, falling back to the snapshot name for
// free-text items with no product link.
export async function getProfitByProduct(supabase: Supabase, range: DateRange): Promise<ProductProfitRow[]> {
  const items = await fetchSaleItemsWithCost(supabase, range.from, range.to);
  const byKey = new Map<string, ProductProfitRow & { hasCost: boolean }>();

  for (const i of items) {
    const key = i.product_id ?? `name:${i.product_name_snapshot}`;
    const existing = byKey.get(key) ?? {
      productId: i.product_id,
      productName: i.product_name_snapshot,
      unitsSold: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      hasCost: false,
    };
    existing.unitsSold += i.quantity;
    existing.revenue += i.line_total;
    if (i.line_cost != null) {
      existing.cost = (existing.cost ?? 0) + i.line_cost;
      existing.profit = (existing.profit ?? 0) + (i.line_profit ?? 0);
      existing.hasCost = true;
    }
    byKey.set(key, existing);
  }

  return Array.from(byKey.values())
    .map((r) => ({
      productId: r.productId,
      productName: r.productName,
      unitsSold: r.unitsSold,
      revenue: Math.round(r.revenue * 100) / 100,
      cost: r.hasCost ? Math.round((r.cost ?? 0) * 100) / 100 : null,
      profit: r.hasCost ? Math.round((r.profit ?? 0) * 100) / 100 : null,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface LowStockAlert {
  productId: string;
  brand: string;
  name: string;
  currentMl: number;
  thresholdMl: number;
  status: "low_stock" | "out_of_stock";
}

// Always reflects CURRENT state (not the selected date range), like
// getNeedsAttention — "what needs restocking right now."
export async function getLowStockAlerts(supabase: Supabase, defaultThresholdMl: number): Promise<LowStockAlert[]> {
  const { data, error } = await supabase
    .from("product_inventory")
    .select("product_id, current_ml, low_stock_threshold_ml, products(brand, name)");
  if (error || !data) return [];

  const alerts: LowStockAlert[] = [];
  for (const row of data) {
    const threshold = effectiveThreshold(row.low_stock_threshold_ml, defaultThresholdMl);
    const status = inventoryStatus(Number(row.current_ml), threshold);
    if (status === "in_stock") continue;
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    alerts.push({
      productId: row.product_id,
      brand: product?.brand ?? "",
      name: product?.name ?? "",
      currentMl: Number(row.current_ml),
      thresholdMl: threshold,
      status,
    });
  }
  return alerts;
}

export interface InventorySummary {
  trackedCount: number;
  juiceRemainingMl: number;
  lowOrOutCount: number;
}

export async function getInventorySummary(supabase: Supabase, defaultThresholdMl: number): Promise<InventorySummary> {
  const { data, error } = await supabase.from("product_inventory").select("current_ml, low_stock_threshold_ml");
  if (error || !data) return { trackedCount: 0, juiceRemainingMl: 0, lowOrOutCount: 0 };

  let lowOrOutCount = 0;
  for (const row of data) {
    const threshold = effectiveThreshold(row.low_stock_threshold_ml, defaultThresholdMl);
    if (inventoryStatus(Number(row.current_ml), threshold) !== "in_stock") lowOrOutCount++;
  }

  return {
    trackedCount: data.length,
    juiceRemainingMl: data.reduce((sum, r) => sum + Number(r.current_ml), 0),
    lowOrOutCount,
  };
}
