import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/enquiries/[id]/activities — the append-only timeline.
// Nothing here is ever fabricated for historical rows; it only reflects
// events actually logged from the moment this feature shipped onward.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("enquiry_activities")
    .select("*")
    .eq("enquiry_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activities: data ?? [] });
}
