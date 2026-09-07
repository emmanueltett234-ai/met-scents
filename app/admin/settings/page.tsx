import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

function StatusRow({ label, configured }: { label: string; configured: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={configured ? "success" : "muted"}>{configured ? "Configured" : "Not set up"}</Badge>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const whatsappApiConfigured = Boolean(
    process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID
  );
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <AdminShell title="Settings">
      <div className="grid max-w-4xl gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Store Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SettingsForm settings={settings} />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <StatusRow label="WhatsApp Business API" configured={whatsappApiConfigured} />
              <StatusRow label="Email (Resend)" configured={emailConfigured} />
              <p className="pt-4 text-xs leading-relaxed text-muted-foreground">
                {whatsappApiConfigured
                  ? "Automatic WhatsApp notifications to the owner number above are active."
                  : "Automatic WhatsApp isn't set up yet — every enquiry still reaches you reliably: it's saved here in Enquiries, and the customer is offered a one-tap \"Send on WhatsApp\" that opens their WhatsApp addressed to your number with the enquiry pre-filled. To enable fully automatic notifications instead, add WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_CLOUD_API_PHONE_NUMBER_ID from a Meta WhatsApp Business API app as environment variables."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Account</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Admin users are managed in Supabase under Authentication → Users. Invite a second
              administrator there — no code changes needed.
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
