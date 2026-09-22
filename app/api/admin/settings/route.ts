import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { settingsInputSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings", issues: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("settings")
    .update({
      owner_whatsapp_number: parsed.data.owner_whatsapp_number || null,
      owner_notification_email: parsed.data.owner_notification_email || null,
      whatsapp_notifications_enabled: parsed.data.whatsapp_notifications_enabled,
      email_notifications_enabled: parsed.data.email_notifications_enabled,
      admin_display_name: parsed.data.admin_display_name || null,
      ...(parsed.data.default_low_stock_threshold_ml !== undefined && {
        default_low_stock_threshold_ml: parsed.data.default_low_stock_threshold_ml,
      }),
    })
    .eq("id", "default")
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}
