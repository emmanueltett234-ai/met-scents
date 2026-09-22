import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/types";

/**
 * Reads the single-row store settings, falling back to environment
 * variables (used before the admin ever visits Settings, or if the
 * migration hasn't been run yet) so the site never breaks.
 */
export async function getSettings(): Promise<StoreSettings> {
  const supabase = createClient();
  const { data, error } = await supabase.from("settings").select("*").eq("id", "default").maybeSingle();

  if (error || !data) {
    return {
      id: "default",
      owner_whatsapp_number: process.env.NEXT_PUBLIC_OWNER_WHATSAPP || null,
      owner_notification_email: process.env.OWNER_NOTIFICATION_EMAIL || null,
      whatsapp_notifications_enabled: true,
      email_notifications_enabled: true,
      default_low_stock_threshold_ml: 20,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    ...(data as StoreSettings),
    owner_whatsapp_number: data.owner_whatsapp_number || process.env.NEXT_PUBLIC_OWNER_WHATSAPP || null,
    owner_notification_email: data.owner_notification_email || process.env.OWNER_NOTIFICATION_EMAIL || null,
  };
}
