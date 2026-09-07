import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { productInputSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { variants, ...product } = parsed.data;
  const supabase = createClient();

  const { data: updated, error } = await supabase
    .from("products")
    .update({
      ...product,
      description: product.description || null,
      fragrance_notes: product.fragrance_notes || null,
      fragrance_type: product.fragrance_type || null,
      image_url: product.image_url || null,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message || "Failed to update product" }, { status: 500 });
  }

  // Reconcile variants: update existing (has id), insert new (no id),
  // delete any that were removed on the client.
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", params.id);

  const existingIds = new Set((existingVariants ?? []).map((v) => v.id));
  const keptIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));

  if (toDelete.length > 0) {
    await supabase.from("product_variants").delete().in("id", toDelete);
  }

  for (const [i, v] of variants.entries()) {
    if (v.id) {
      await supabase
        .from("product_variants")
        .update({ size: v.size, price: v.price, availability: v.availability, sort_order: i })
        .eq("id", v.id);
    } else {
      await supabase.from("product_variants").insert({
        product_id: params.id,
        size: v.size,
        price: v.price,
        availability: v.availability,
        sort_order: i,
      });
    }
  }

  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
