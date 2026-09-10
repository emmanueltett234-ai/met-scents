import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { productTypeInputSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = productTypeInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product type data" }, { status: 400 });
  }

  const supabase = createClient();

  if (parsed.data.is_active === false) {
    const { count, error: countError } = await supabase
      .from("product_types")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("id", params.id);
    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
    if (!count) {
      return NextResponse.json(
        { error: "At least one product type must stay active." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("product_types")
    .update({
      ...parsed.data,
      description: parsed.data.description !== undefined ? parsed.data.description || null : undefined,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "A product type with that name already exists" : error.message;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ productType: data });
}

// Product types are never deleted while products are assigned to them —
// reassign or deactivate first. Deactivating is the recommended path for
// retiring a type without touching the products that already have it.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("product_type_id", params.id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if (count && count > 0) {
    return NextResponse.json(
      {
        error: `${count} product${count === 1 ? " is" : "s are"} still assigned to this type. Reassign them or deactivate the type instead of deleting it.`,
      },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("product_types").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
