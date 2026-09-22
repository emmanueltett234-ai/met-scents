import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { productInputSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
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

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      ...product,
      description: product.description || null,
      fragrance_notes: product.fragrance_notes || null,
      fragrance_type: product.fragrance_type || null,
      image_url: product.image_url || null,
    })
    .select()
    .single();

  if (error || !created) {
    return NextResponse.json({ error: error?.message || "Failed to create product" }, { status: 500 });
  }

  const { error: variantsError } = await supabase.from("product_variants").insert(
    variants.map((v, i) => ({
      product_id: created.id,
      size: v.size,
      price: v.price,
      availability: v.availability,
      size_ml: v.size_ml ?? null,
      sort_order: i,
    }))
  );

  if (variantsError) {
    return NextResponse.json({ error: variantsError.message }, { status: 500 });
  }

  return NextResponse.json({ product: created }, { status: 201 });
}
