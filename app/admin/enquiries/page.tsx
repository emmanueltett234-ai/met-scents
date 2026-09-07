import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatGHS } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ENQUIRY_STATUS_LABELS, type EnquiryStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<EnquiryStatus, "muted" | "warning" | "success" | "destructive"> = {
  new: "warning",
  contacted: "muted",
  pending: "muted",
  completed: "success",
  cancelled: "destructive",
};

const TABS: { label: string; value: EnquiryStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = (searchParams.status as EnquiryStatus | undefined) ?? "all";
  const supabase = createClient();

  let query = supabase.from("enquiries").select("*").order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data: enquiries } = await query;

  return (
    <AdminShell title="Enquiries">
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/admin/enquiries" : `/admin/enquiries?status=${tab.value}`}
            className={cn(
              "border px-4 py-2 text-xs uppercase tracking-widest2",
              status === tab.value ? "border-ink bg-ink text-cream" : "border-border bg-white text-ink/70"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!enquiries || enquiries.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No enquiries in this view.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enquiries.map((e) => (
              <TableRow key={e.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/admin/enquiries/${e.id}`} className="font-medium hover:text-gold-dark">
                    {e.customer_name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{e.whatsapp_number}</TableCell>
                <TableCell className="text-sm">{formatGHS(Number(e.estimated_total))}</TableCell>
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
      )}
    </AdminShell>
  );
}
