import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { DateRange } from "@/lib/analytics/date-range";

type Supabase = ReturnType<typeof createClient>;

// ----------------------------------------------------------------------------
// "Most Requested" comes from enquiry_items (what customers asked about) and
// is never treated as revenue. "Best Selling" comes from sale_items ONLY
// (what was actually confirmed sold). The two are never combined into one
// number or one ranking.
// ----------------------------------------------------------------------------

export interface RequestedProductRow {
  productId: string | null;
  productName: string;
  brand: string | null;
  enquiryCount: number;
  quantityRequested: number;
  estimatedValue: number;
}

export interface SellingProductRow {
  productId: string | null;
  productName: string;
  brand: string | null;
  unitsSold: number;
  numberOfSales: number;
  confirmedSalesValue: number;
}

export interface SizeRow {
  size: string;
  count: number; // enquiries (requested) or sales (selling) that included this size
  quantity: number;
  value: number;
}

async function enquiryIdsInRange(supabase: Supabase, from: Date, to: Date): Promise<string[]> {
  const { data, error } = await supabase
    .from("enquiries")
    .select("id")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());
  if (error) {
    console.error("Failed to fetch enquiry ids for product performance:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.id);
}

async function saleIdsInRange(supabase: Supabase, from: Date, to: Date): Promise<string[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("id")
    .gte("sale_date", from.toISOString())
    .lt("sale_date", to.toISOString());
  if (error) {
    console.error("Failed to fetch sale ids for product performance:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.id);
}

export async function getMostRequestedProducts(supabase: Supabase, range: DateRange): Promise<RequestedProductRow[]> {
  const ids = await enquiryIdsInRange(supabase, range.from, range.to);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("enquiry_items")
    .select("enquiry_id, product_id, product_name, brand, price, quantity")
    .in("enquiry_id", ids);
  if (error || !data) return [];

  const byProduct = new Map<string, RequestedProductRow & { enquiryIds: Set<string> }>();
  for (const item of data) {
    const key = item.product_id ?? `unlinked:${item.product_name}`;
    const existing = byProduct.get(key) ?? {
      productId: item.product_id,
      productName: item.product_name,
      brand: item.brand,
      enquiryCount: 0,
      quantityRequested: 0,
      estimatedValue: 0,
      enquiryIds: new Set<string>(),
    };
    existing.enquiryIds.add(item.enquiry_id);
    existing.quantityRequested += item.quantity;
    existing.estimatedValue += Number(item.price) * item.quantity;
    byProduct.set(key, existing);
  }

  return Array.from(byProduct.values())
    .map((r) => ({ ...r, enquiryCount: r.enquiryIds.size }))
    .map(({ enquiryIds: _enquiryIds, ...rest }) => rest)
    .sort((a, b) => b.enquiryCount - a.enquiryCount);
}

export async function getBestSellingProducts(supabase: Supabase, range: DateRange): Promise<SellingProductRow[]> {
  const ids = await saleIdsInRange(supabase, range.from, range.to);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("sale_items")
    .select("sale_id, product_id, product_name_snapshot, brand_snapshot, quantity, line_total")
    .in("sale_id", ids);
  if (error || !data) return [];

  const byProduct = new Map<string, SellingProductRow & { saleIds: Set<string> }>();
  for (const item of data) {
    const key = item.product_id ?? `unlinked:${item.product_name_snapshot}`;
    const existing = byProduct.get(key) ?? {
      productId: item.product_id,
      productName: item.product_name_snapshot,
      brand: item.brand_snapshot,
      unitsSold: 0,
      numberOfSales: 0,
      confirmedSalesValue: 0,
      saleIds: new Set<string>(),
    };
    existing.saleIds.add(item.sale_id);
    existing.unitsSold += item.quantity;
    existing.confirmedSalesValue += Number(item.line_total);
    byProduct.set(key, existing);
  }

  return Array.from(byProduct.values())
    .map((r) => ({ ...r, numberOfSales: r.saleIds.size }))
    .map(({ saleIds: _saleIds, ...rest }) => rest)
    .sort((a, b) => b.confirmedSalesValue - a.confirmedSalesValue);
}

export async function getMostRequestedSizes(supabase: Supabase, range: DateRange): Promise<SizeRow[]> {
  const ids = await enquiryIdsInRange(supabase, range.from, range.to);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("enquiry_items").select("size, price, quantity").in("enquiry_id", ids);
  if (error || !data) return [];

  const bySize = new Map<string, SizeRow>();
  for (const item of data) {
    const existing = bySize.get(item.size) ?? { size: item.size, count: 0, quantity: 0, value: 0 };
    existing.count += 1;
    existing.quantity += item.quantity;
    existing.value += Number(item.price) * item.quantity;
    bySize.set(item.size, existing);
  }
  return Array.from(bySize.values()).sort((a, b) => b.quantity - a.quantity);
}

export async function getBestSellingSizes(supabase: Supabase, range: DateRange): Promise<SizeRow[]> {
  const ids = await saleIdsInRange(supabase, range.from, range.to);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("sale_items").select("size_snapshot, quantity, line_total").in("sale_id", ids);
  if (error || !data) return [];

  const bySize = new Map<string, SizeRow>();
  for (const item of data) {
    const existing = bySize.get(item.size_snapshot) ?? { size: item.size_snapshot, count: 0, quantity: 0, value: 0 };
    existing.count += 1;
    existing.quantity += item.quantity;
    existing.value += Number(item.line_total);
    bySize.set(item.size_snapshot, existing);
  }
  return Array.from(bySize.values()).sort((a, b) => b.quantity - a.quantity);
}

export interface ProductPerformanceRow {
  productId: string;
  brand: string;
  name: string;
  availability: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  enquiryCount: number;
  quantityRequested: number;
  estimatedEnquiryValue: number;
  unitsSold: number;
  numberOfSales: number;
  confirmedSalesValue: number;
}

export async function getProductPerformance(supabase: Supabase, range: DateRange): Promise<ProductPerformanceRow[]> {
  const [{ data: products }, requested, sold] = await Promise.all([
    supabase.from("products").select("id, brand, name, availability, featured, best_seller, new_arrival"),
    getMostRequestedProducts(supabase, range),
    getBestSellingProducts(supabase, range),
  ]);

  const requestedMap = new Map(requested.filter((r) => r.productId).map((r) => [r.productId as string, r]));
  const soldMap = new Map(sold.filter((r) => r.productId).map((r) => [r.productId as string, r]));

  return (products ?? []).map((p) => {
    const req = requestedMap.get(p.id);
    const sale = soldMap.get(p.id);
    return {
      productId: p.id,
      brand: p.brand,
      name: p.name,
      availability: p.availability,
      featured: p.featured,
      bestSeller: p.best_seller,
      newArrival: p.new_arrival,
      enquiryCount: req?.enquiryCount ?? 0,
      quantityRequested: req?.quantityRequested ?? 0,
      estimatedEnquiryValue: req?.estimatedValue ?? 0,
      unitsSold: sale?.unitsSold ?? 0,
      numberOfSales: sale?.numberOfSales ?? 0,
      confirmedSalesValue: sale?.confirmedSalesValue ?? 0,
    };
  });
}
