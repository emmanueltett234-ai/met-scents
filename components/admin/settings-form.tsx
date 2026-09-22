"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { normalizeWhatsappNumber } from "@/lib/notifications/whatsapp";
import type { StoreSettings } from "@/types";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [whatsappNumber, setWhatsappNumber] = useState(settings.owner_whatsapp_number ?? "");
  const normalizedPreview = normalizeWhatsappNumber(whatsappNumber);
  const [email, setEmail] = useState(settings.owner_notification_email ?? "");
  const [emailEnabled, setEmailEnabled] = useState(settings.email_notifications_enabled);
  const [lowStockThreshold, setLowStockThreshold] = useState(String(settings.default_low_stock_threshold_ml));
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
          default_low_stock_threshold_ml: lowStockThreshold === "" ? undefined : Number(lowStockThreshold),
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
          Include the country code, or a local Ghana number starting with 0. Either is normalized
          automatically. Every WhatsApp button on the site (the floating chat button, per-product
          enquiries, and "Send on WhatsApp") opens addressed to this number, pre-filled. Customers
          still press Send themselves; nothing is sent automatically.
        </p>
        {whatsappNumber.trim() && (
          <p className="mt-2 text-xs">
            {normalizedPreview.length >= 11 ? (
              <span className="text-muted-foreground">
                WhatsApp links will open to{" "}
                <span className="font-medium text-ink">wa.me/{normalizedPreview}</span>
              </span>
            ) : (
              <span className="text-destructive">
                This doesn&apos;t look like a complete number. Double-check it before saving.
              </span>
            )}
          </p>
        )}
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
            Send an email for every new enquiry (requires Resend to be configured, see Settings
            below).
          </p>
        </div>
        <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
      </div>

      <div className="border-t border-border pt-4">
        <Label htmlFor="low_stock_threshold">Default Low-Stock Threshold (ml)</Label>
        <Input
          id="low_stock_threshold"
          type="number"
          min="0"
          step="0.01"
          className="mt-2 max-w-xs"
          value={lowStockThreshold}
          onChange={(e) => setLowStockThreshold(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          A perfume is flagged "Low Stock" once its remaining juice drops to or below this. Applies to every
          tracked perfume unless it has its own override set on its inventory page.
        </p>
      </div>

      <Button type="submit" variant="gold" size="lg" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </Button>
    </form>
  );
}
