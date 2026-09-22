import Link from "next/link";
import { Plus, FileSpreadsheet, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { SaleFilters } from "@/components/admin/sales/sale-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatGHS } from "@/lib/currency";
import { SALE_SOURCE_LABELS, PAYMENT_METHOD_LABELS, type SaleSource, type PaymentMethod } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SearchParams {
  search?: string;
  source?: string;
  payment_method?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
}

export default async function AdminSalesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);

  let query = supabase.from("sales").select("*", { count: "exact" });

  if (searchParams.source) query = query.eq("source", searchParams.source);
  if (searchParams.payment_method) query = query.eq("payment_method", searchParams.payment_method);
  if (searchParams.from) query = query.gte("sale_date", searchParams.from);
  if (searchParams.to) {
    const toDate = new Date(searchParams.to);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    query = query.lt("sale_date", toDate.toISOString().slice(0, 10));
  }
  if (searchParams.search) {
    const q = searchParams.search.trim();
    const orClauses = [`customer_name.ilike.%${q}%`, `whatsapp_number.ilike.%${q}%`];
    if (uuidRegex.test(q)) orClauses.push(`id.eq.${q}`);

    const { data: matchingItems } = await supabase
      .from("sale_items")
      .select("sale_id")
      .ilike("product_name_snapshot", `%${q}%`);
    const productMatchIds = Array.from(new Set((matchingItems ?? []).map((i) => i.sale_id)));
    if (productMatchIds.length > 0) orClauses.push(`id.in.(${productMatchIds.join(",")})`);

    query = query.or(orClauses.join(","));
  }

  const sort = searchParams.sort ?? "date_desc";
  if (sort === "date_asc") query = query.order("sale_date", { ascending: true });
  else if (sort === "amount_desc") query = query.order("sale_amount", { ascending: false });
  else if (sort === "amount_asc") query = query.order("sale_amount", { ascending: true });
  else query = query.order("sale_date", { ascending: false });

  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: sales, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const saleIds = (sales ?? []).map((s) => s.id);
  const { data: items } = saleIds.length
    ? await supabase
        .from("sale_items")
        .select("sale_id, product_name_snapshot, size_snapshot, quantity, ml_deducted")
        .in("sale_id", saleIds)
    : { data: [] };
  const itemsBySale = new Map<string, NonNullable<typeof items>>();
  for (const item of items ?? []) {
    itemsBySale.set(item.sale_id, [...(itemsBySale.get(item.sale_id) ?? []), item]);
  }

  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(p));
    return `/admin/sales?${params.toString()}`;
  }

  const exportHref = (() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    return `/api/admin/export/sales?${params.toString()}`;
  })();

  return (
    <AdminShell
      title="Sales"
      description="See what's sold at a glance below, or open Sales Analytics for totals by perfume and by size (e.g. how many 10ml decants sold)."
      action={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/admin/sales/analytics"><BarChart3 className="h-4 w-4" /> Best-Sellers</Link></Button>
          <Button asChild variant="outline" size="sm"><a href={exportHref}><FileSpreadsheet className="h-4 w-4" /> Export</a></Button>
          <Button asChild size="sm"><Link href="/admin/sales/new"><Plus className="h-4 w-4" /> Record Sale</Link></Button>
        </div>
      }
    >
      <SaleFilters />

      <p className="mb-3 text-xs text-muted-foreground">{total} sale{total === 1 ? "" : "s"} found</p>

      {!sales || sales.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No confirmed sales recorded yet.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items Sold</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => {
                const saleItems = itemsBySale.get(s.id) ?? [];
                const totalMlDeducted = saleItems.reduce((sum, i) => sum + Number(i.ml_deducted ?? 0), 0);
                return (
                  <TableRow key={s.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/admin/sales/${s.id}`} className="font-medium hover:text-accent-dark">
                        {s.customer_name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[260px] text-sm">
                      {saleItems.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No items recorded</span>
                      ) : (
                        <>
                          <div className="space-y-0.5">
                            {saleItems.map((i, idx) => (
                              <p key={idx} className="truncate">
                                {i.quantity}× {i.product_name_snapshot} <span className="text-muted-foreground">({i.size_snapshot})</span>
                              </p>
                            ))}
                          </div>
                          {totalMlDeducted > 0 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{totalMlDeducted.toLocaleString()}ml deducted</p>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline">{SALE_SOURCE_LABELS[s.source as SaleSource]}</Badge></TableCell>
                    <TableCell className="text-sm">{formatGHS(Number(s.sale_amount))}</TableCell>
                    <TableCell className="text-sm">{PAYMENT_METHOD_LABELS[s.payment_method as PaymentMethod]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.sale_date).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Link href={pageHref(Math.max(1, page - 1))} className={`flex items-center gap-1 border border-border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-ink"}`}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Link>
                <Link href={pageHref(Math.min(totalPages, page + 1))} className={`flex items-center gap-1 border border-border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-ink"}`}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
