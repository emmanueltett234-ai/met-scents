import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { enquiryStatusSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = enquiryStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: existing } = await supabase.from("enquiries").select("status").eq("id", params.id).maybeSingle();

  const { data, error } = await supabase
    .from("enquiries")
    .update({ status: parsed.data.status })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing && existing.status !== parsed.data.status) {
    await supabase.from("enquiry_activities").insert({
      enquiry_id: params.id,
      event_type: "status_changed",
      metadata: { from: existing.status, to: parsed.data.status },
      created_by: user!.email,
    });
  }

  return NextResponse.json({ enquiry: data });
}
