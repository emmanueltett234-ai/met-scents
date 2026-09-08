import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { enquiryOutcomeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// PATCH /api/admin/enquiries/[id]/outcome — always an explicit admin action.
// Never set automatically by a sale being recorded or a status changing.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = enquiryOutcomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: existing } = await supabase.from("enquiries").select("outcome, contacted_at, completed_at").eq("id", params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });

  const nextOutcome = parsed.data.outcome;
  const nowIso = new Date().toISOString();

  const updatePayload: Record<string, unknown> = { outcome: nextOutcome };
  // First time reaching "contacted" or a terminal outcome, stamp the time.
  // Never overwrite a timestamp that's already set — that would rewrite
  // real history.
  if (nextOutcome === "contacted" && !existing.contacted_at) {
    updatePayload.contacted_at = nowIso;
  }
  if ((nextOutcome === "sale_completed" || nextOutcome === "no_sale") && !existing.completed_at) {
    updatePayload.completed_at = nowIso;
  }

  const { data: enquiry, error } = await supabase
    .from("enquiries")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing.outcome !== nextOutcome) {
    await supabase.from("enquiry_activities").insert({
      enquiry_id: params.id,
      event_type: "outcome_changed",
      metadata: { from: existing.outcome, to: nextOutcome },
      created_by: user!.email,
    });
  }

  return NextResponse.json({ enquiry });
}
