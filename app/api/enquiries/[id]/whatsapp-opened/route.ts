import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Records that WhatsApp was opened (wa.me launched) for a specific enquiry.
 * Called from every customer- and admin-facing "message on WhatsApp" button
 * that already has a real enquiry id — never claims a message was sent, only
 * that the chat was opened. Public (no auth) because customers on the Thank
 * You page aren't authenticated, but it does nothing except flip one boolean
 * on one enquiry the id points to, and only on the first call (idempotent),
 * so it can't be used to tamper with anything else.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!uuidRegex.test(params.id)) {
    return NextResponse.json({ error: "Invalid enquiry id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: enquiry, error: fetchError } = await supabase
    .from("enquiries")
    .select("id, whatsapp_opened")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  if (!enquiry) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }

  // Already recorded — keep the original whatsapp_opened_at (first-open
  // time is what matters for "time to WhatsApp contact" analytics).
  if (enquiry.whatsapp_opened) {
    return NextResponse.json({ ok: true, alreadyRecorded: true });
  }

  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("enquiries")
    .update({ whatsapp_opened: true, whatsapp_opened_at: nowIso })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  let source: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body.via === "string") source = body.via;
  } catch {
    // no body sent — fine, this endpoint doesn't require one
  }

  await supabase
    .from("enquiry_activities")
    .insert({ enquiry_id: params.id, event_type: "whatsapp_opened", metadata: source ? { via: source } : {} });

  return NextResponse.json({ ok: true, alreadyRecorded: false });
}
