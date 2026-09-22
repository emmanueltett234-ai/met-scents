import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { inventorySetupInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/inventory/[productId] — one product's catalogue record +
// its inventory record (if set up) + restock history, for the detail page.
export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const [{ data: product, error: productError }, { data: inventory }, { data: purchases }] = await Promise.all([
    supabase
      .from("products")
      .select("id, brand, name, slug, image_url, product_types(name)")
      .eq("id", params.productId)
      .maybeSingle(),
    supabase.from("product_inventory").select("*").eq("product_id", params.productId).maybeSingle(),
    supabase
      .from("inventory_purchases")
      .select("*")
      .eq("product_id", params.productId)
      .order("purchase_date", { ascending: false }),
  ]);

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ product, inventory: inventory ?? null, purchases: purchases ?? [] });
}

// PATCH /api/admin/inventory/[productId] — edit the editable cost/threshold
// fields. Plain update: initial_ml/current_ml/total_cost_invested are never
// touched here, only by the record_inventory_purchase/record_inventory_sale
// RPCs, so this route can never desync the ml/cost ledger.
export async function PATCH(req: NextRequest, { params }: { params: { productId: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
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

  const { data: updated, error } = await supabase
    .from("product_inventory")
    .update({
      decant_size_ml: input.decant_size_ml,
      atomizer_cost: input.atomizer_cost,
      label_cost: input.label_cost,
      packaging_cost: input.packaging_cost,
      pouch_cost: input.pouch_cost,
      shipping_cost: input.shipping_cost,
      other_cost: input.other_cost,
      selling_price_per_decant: input.selling_price_per_decant,
      low_stock_threshold_ml: input.low_stock_threshold_ml ?? null,
      // bottle_size_ml is informational (records the most recent bottle
      // size purchased) — it's set by record_inventory_purchase on restock,
      // not editable here independent of a real purchase.
    })
    .eq("product_id", params.productId)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Failed to update inventory." }, { status: 500 });
  }

  return NextResponse.json({ inventory: updated });
}
