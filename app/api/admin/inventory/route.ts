import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { inventorySetupInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/inventory — every product with its inventory record (if
// any). A product with no product_inventory row is "not tracked yet" —
// never fabricated as zero stock.
export async function GET() {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, brand, name, slug, image_url, product_types(name), product_inventory(*)")
    .order("brand");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data ?? [] });
}

// POST /api/admin/inventory — set up inventory tracking for a product (one
// product_inventory row, 1:1). This is the only inventory write that is a
// plain single-table insert rather than going through an RPC — restock and
// sale-deduction are the only operations that must be atomic across tables.
export async function POST(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const productId = body?.product_id;
  if (typeof productId !== "string") {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  const parsed = inventorySetupInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please check the form and try again.", fieldErrors }, { status: 400 });
  }

  const input = parsed.data;
  const supabase = createClient();

  const { data: created, error } = await supabase
    .from("product_inventory")
    .insert({
      product_id: productId,
      bottle_size_ml: input.bottle_size_ml,
      decant_size_ml: input.decant_size_ml,
      atomizer_cost: input.atomizer_cost,
      label_cost: input.label_cost,
      packaging_cost: input.packaging_cost,
      pouch_cost: input.pouch_cost,
      shipping_cost: input.shipping_cost,
      other_cost: input.other_cost,
      selling_price_per_decant: input.selling_price_per_decant,
      low_stock_threshold_ml: input.low_stock_threshold_ml ?? null,
    })
    .select()
    .single();

  if (error || !created) {
    return NextResponse.json({ error: error?.message ?? "Failed to set up inventory for this product." }, { status: 500 });
  }

  return NextResponse.json({ inventory: created }, { status: 201 });
}
