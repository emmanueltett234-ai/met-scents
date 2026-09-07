import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatGHS } from "@/lib/currency";
import { ENQUIRY_STATUS_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [{ count: productCount }, { count: newEnquiryCount }, { data: recentEnquiries }, { count: totalEnquiryCount }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase
        .from("enquiries")
        .select("id, customer_name, whatsapp_number, estimated_total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("enquiries").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Total Products", value: productCount ?? 0 },
    { label: "New Enquiries", value: newEnquiryCount ?? 0 },
    { label: "Total Enquiries", value: totalEnquiryCount ?? 0 },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-3xl font-serif">{s.value}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs uppercase tracking-widest2 text-muted-foreground">
              {s.label}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Enquiries</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!recentEnquiries || recentEnquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No enquiries yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentEnquiries.map((e) => (
                <Link
                  key={e.id}
                  href={`/admin/enquiries/${e.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:bg-secondary/40"
                >
                  <div>
                    <p className="font-medium">{e.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{e.whatsapp_number}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatGHS(Number(e.estimated_total))}</p>
                    <p className="text-xs uppercase tracking-widest2 text-muted-foreground">
                      {ENQUIRY_STATUS_LABELS[e.status as keyof typeof ENQUIRY_STATUS_LABELS]}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
