import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "Not set"}</span>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Settings">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Row label="Site Name" value={process.env.NEXT_PUBLIC_SITE_NAME || "Met Scents"} />
            <Row label="Owner WhatsApp" value={process.env.NEXT_PUBLIC_OWNER_WHATSAPP || ""} />
            <Row label="Notification Email" value={process.env.OWNER_NOTIFICATION_EMAIL || ""} />
            <Row label="Email Notifications" value={process.env.RESEND_API_KEY ? "Enabled" : "Disabled"} />
            <p className="pt-4 text-xs leading-relaxed text-muted-foreground">
              These values are set via environment variables (in <code>.env.local</code> for
              development, or your Vercel project&apos;s Environment Variables for production) — see
              <code> .env.example</code> and the README for the full list. Changing them requires a
              redeploy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Admin users are managed in your Supabase project under Authentication → Users. To add a
            second administrator, invite them there — no code changes needed. To change your own
            password, use Supabase Auth&apos;s password reset flow.
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
