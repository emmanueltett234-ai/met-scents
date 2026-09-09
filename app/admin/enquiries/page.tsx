import Link from "next/link";
import { AlertTriangle, MessageCircleMore, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { EnquiryFilters } from "@/components/admin/enquiries/enquiry-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatGHS } from "@/lib/currency";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_SOURCE_LABELS, type EnquiryStatus, type EnquirySource } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<EnquiryStatus, "muted" | "warning" | "success" | "destructive"> = {
  new: "warning",
  contacted: "muted",
  pending: "muted",
  completed: "success",
  cancelled: "destructive",
};

const PAGE_SIZE = 25;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SearchParams {
  search?: string;
  status?: string;
  source?: string;
  whatsapp_opened?: string;
  product?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
}

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [{ data: products }] = await Promise.all([
    supabase.from("products").select("id, brand, name").order("brand"),
  ]);

  let query = supabase.from("enquiries").select("*", { count: "exact" });

  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.source) query = query.eq("enquiry_source", searchParams.source);
  if (searchParams.whatsapp_opened) query = query.eq("whatsapp_opened", searchParams.whatsapp_opened === "true");
  if (searchParams.from) query = query.gte("created_at", searchParams.from);
  if (searchParams.to) {
    const toDate = new Date(searchParams.to);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    query = query.lt("created_at", toDate.toISOString().slice(0, 10));
  }

  if (searchParams.product) {
    const { data: matchingItems } = await supabase
      .from("enquiry_items")
      .select("enquiry_id")
      .eq("product_id", searchParams.product);
    const ids = Array.from(new Set((matchingItems ?? []).map((i) => i.enquiry_id)));
    query = query.in("id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }

  if (searchParams.search) {
    const q = searchParams.search.trim();
    const orClauses = [`customer_name.ilike.%${q}%`, `whatsapp_number.ilike.%${q}%`, `email.ilike.%${q}%`];
    if (uuidRegex.test(q)) orClauses.push(`id.eq.${q}`);

    const { data: matchingItems } = await supabase.from("enquiry_items").select("enquiry_id").ilike("product_name", `%${q}%`);
    const productMatchIds = Array.from(new Set((matchingItems ?? []).map((i) => i.enquiry_id)));
    if (productMatchIds.length > 0) orClauses.push(`id.in.(${productMatchIds.join(",")})`);

    query = query.or(orClauses.join(","));
  }

  const sort = searchParams.sort ?? "newest";
  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "value_desc") query = query.order("estimated_total", { ascending: false });
  else if (sort === "value_asc") query = query.order("estimated_total", { ascending: true });
  else query = query.order("created_at", { ascending: false });

  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: enquiries, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(p));
    return `/admin/enquiries?${params.toString()}`;
  }

  const exportHref = (() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    return `/api/admin/export/enquiries?${params.toString()}`;
  })();

  return (
    <AdminShell
      title="Enquiries"
      action={
        <Button asChild variant="outline" size="sm">
          <a href={exportHref}><FileSpreadsheet className="h-4 w-4" /> Export</a>
        </Button>
      }
    >
      <EnquiryFilters products={products ?? []} />

      <p className="mb-3 text-xs text-muted-foreground">
        {total} enquir{total === 1 ? "y" : "ies"} found
      </p>

      {!enquiries || enquiries.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No enquiries match these filters.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Estimated Total</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>WhatsApp Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((e) => (
                <TableRow key={e.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/enquiries/${e.id}`} className="flex items-center gap-2 font-medium hover:text-accent-dark">
                      {e.customer_name}
                      {(e.whatsapp_status === "failed" || e.email_status === "failed") && (
                        <span title="A notification failed to send; the enquiry itself was saved">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{e.whatsapp_number}</TableCell>
                  <TableCell className="text-sm">{formatGHS(Number(e.estimated_total))}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ENQUIRY_SOURCE_LABELS[e.enquiry_source as EnquirySource]}</Badge>
                  </TableCell>
                  <TableCell>
                    {e.whatsapp_opened ? (
                      <span title="WhatsApp opened, not confirmation a message was sent" className="flex items-center gap-1 text-xs text-emerald-700">
                        <MessageCircleMore className="h-3.5 w-3.5" /> Opened
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not opened</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[e.status as EnquiryStatus]}>
                      {ENQUIRY_STATUS_LABELS[e.status as EnquiryStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Link
                  href={pageHref(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={`flex items-center gap-1 border border-border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-ink"}`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Link>
                <Link
                  href={pageHref(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  className={`flex items-center gap-1 border border-border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-ink"}`}
                >
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
