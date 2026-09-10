import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { productTypeInputSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = productTypeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product type data" }, { status: 400 });
  }

  const supabase = createClient();

  if (parsed.data.sort_order === 0) {
    const { data: max } = await supabase
      .from("product_types")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    parsed.data.sort_order = (max?.sort_order ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("product_types")
    .insert({ ...parsed.data, description: parsed.data.description || null })
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "A product type with that name already exists" : error.message;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ productType: data }, { status: 201 });
}
