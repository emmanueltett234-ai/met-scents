"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { StoreSettings } from "@/types";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [whatsappNumber, setWhatsappNumber] = useState(settings.owner_whatsapp_number ?? "");
  const [email, setEmail] = useState(settings.owner_notification_email ?? "");
  const [emailEnabled, setEmailEnabled] = useState(settings.email_notifications_enabled);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_whatsapp_number: whatsappNumber,
          owner_notification_email: email,
          email_notifications_enabled: emailEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="whatsapp">Shop WhatsApp Number</Label>
        <Input
          id="whatsapp"
          className="mt-2"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="233 24 123 4567"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Include the country code. Every WhatsApp button on the site — the floating chat button,
          per-product enquiries, and "Send on WhatsApp" — opens addressed to this number, pre-filled.
          Customers still press Send themselves; nothing is sent automatically.
        </p>
      </div>

      <div>
        <Label htmlFor="email">Notification Email</Label>
        <Input
          id="email"
          type="email"
          className="mt-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@example.com"
        />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-sm font-medium">Email Notifications</p>
          <p className="text-xs text-muted-foreground">
            Send an email for every new enquiry (requires Resend to be configured — see Settings
            below).
          </p>
        </div>
        <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
      </div>

      <Button type="submit" variant="gold" size="lg" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </Button>
    </form>
  );
}
