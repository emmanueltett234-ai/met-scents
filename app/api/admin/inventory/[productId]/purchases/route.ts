import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { inventoryPurchaseInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/inventory/[productId]/purchases — restock history for a
// product, newest first.
export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_purchases")
    .select("*")
    .eq("product_id", params.productId)
    .order("purchase_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ purchases: data ?? [] });
}

// POST /api/admin/inventory/[productId]/purchases — record a restock. Goes
// through the record_inventory_purchase RPC so the ledger insert and the
// product_inventory totals update atomically in one transaction.
export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  const { user, response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = inventoryPurchaseInputSchema.safeParse(body);
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

  const { data, error } = await supabase.rpc("record_inventory_purchase", {
    p_product_id: params.productId,
    p_bottle_size_ml: input.bottle_size_ml,
    p_ml_added: input.ml_added,
    p_cost_price: input.cost_price,
    p_purchase_date: (input.purchase_date ?? new Date()).toISOString(),
    p_notes: input.notes ?? null,
    p_created_by: user!.email ?? null,
  });

  if (error) {
    // The RPC raises a clear, human-readable message (e.g. "set up
    // inventory tracking first") — surface it as-is rather than a generic 500.
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ inventory: data }, { status: 201 });
}
