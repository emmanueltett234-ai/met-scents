import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { enquiryNoteInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/enquiries/[id]/notes — private, admin-only notes. Never
// exposed on any customer-facing page or injected into a WhatsApp message.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("enquiry_notes")
    .select("*")
    .eq("enquiry_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = enquiryNoteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid note" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: note, error } = await supabase
    .from("enquiry_notes")
    .insert({ enquiry_id: params.id, note: parsed.data.note, created_by: user!.email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("enquiry_activities").insert({
    enquiry_id: params.id,
    event_type: "note_added",
    metadata: {},
    created_by: user!.email,
  });

  return NextResponse.json({ note }, { status: 201 });
}
