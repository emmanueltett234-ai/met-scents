import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Mail, MapPin, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { EnquiryStatusSelect } from "@/components/admin/enquiry-status-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatGHS } from "@/lib/currency";
import { buildCustomerReplyWhatsappLink } from "@/lib/notifications/whatsapp";
import type { EnquiryStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function EnquiryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: enquiry }, { data: items }] = await Promise.all([
    supabase.from("enquiries").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("enquiry_items").select("*").eq("enquiry_id", params.id),
  ]);

  if (!enquiry) notFound();

  const whatsappLink = buildCustomerReplyWhatsappLink({
    customerWhatsapp: enquiry.whatsapp_number,
    customerName: enquiry.customer_name,
    items: items ?? [],
    estimatedTotal: Number(enquiry.estimated_total),
  });

  return (
    <AdminShell title="Enquiry Detail">
      <Link href="/admin/enquiries" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Enquiries
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Selected Fragrances</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {(items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{item.brand ? `${item.brand} — ` : ""}{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.size} × {item.quantity}</p>
                    </div>
                    <p>{formatGHS(Number(item.price) * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm uppercase tracking-widest2 text-muted-foreground">Estimated Total</span>
                <span className="font-serif text-xl">{formatGHS(Number(enquiry.estimated_total))}</span>
              </div>
            </CardContent>
          </Card>

          {enquiry.message && (
            <Card>
              <CardHeader><CardTitle>Customer Message</CardTitle></CardHeader>
              <CardContent className="pt-0 text-sm text-ink/80">{enquiry.message}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              <p className="font-medium">{enquiry.customer_name}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" /> {enquiry.whatsapp_number}
              </p>
              {enquiry.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {enquiry.email}
                </p>
              )}
              {enquiry.location && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {enquiry.location}
                </p>
              )}
              <p className="pt-2 text-xs text-muted-foreground">
                Submitted {new Date(enquiry.created_at).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <EnquiryStatusSelect id={enquiry.id} status={enquiry.status as EnquiryStatus} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              <NotificationRow label="WhatsApp" status={enquiry.whatsapp_status} error={enquiry.whatsapp_error} />
              <NotificationRow label="Email" status={enquiry.email_status} error={enquiry.email_error} />
              {(enquiry.whatsapp_status === "failed" || enquiry.email_status === "failed") && (
                <p className="text-xs text-muted-foreground">
                  The enquiry itself was saved successfully — only the automatic notification
                  failed. Use &ldquo;Message on WhatsApp&rdquo; below to follow up directly.
                </p>
              )}
            </CardContent>
          </Card>

          <Button asChild variant="gold" size="lg" className="w-full">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" /> Message on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}

function NotificationRow({
  label,
  status,
  error,
}: {
  label: string;
  status: string;
  error: string | null;
}) {
  const config = {
    sent: { icon: CheckCircle2, text: "Sent", className: "text-emerald-700" },
    failed: { icon: AlertTriangle, text: "Failed", className: "text-destructive" },
    not_configured: { icon: MinusCircle, text: "Not sent automatically", className: "text-muted-foreground" },
  }[status] ?? { icon: MinusCircle, text: status, className: "text-muted-foreground" };

  const Icon = config.icon;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className={`flex items-center gap-1.5 font-medium ${config.className}`}>
          <Icon className="h-3.5 w-3.5" /> {config.text}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-destructive/80">{error}</p>}
    </div>
  );
}
