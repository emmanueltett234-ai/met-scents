import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { saleInputSchema } from "@/lib/validation";
import { deductInventoryForSale, reverseSaleItemsInventory, buildSaleItemRows } from "@/lib/inventory/sale-deduction";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { data: sale, error } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  return NextResponse.json({ sale });
}

// PATCH /api/admin/sales/[id] — correct an existing sale. Never silently
// overwrites: if `items` is provided, the full item set is replaced (delete
// + reinsert) so line-item edits stay consistent with the new totals; if
// omitted, existing items are left untouched.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = saleInputSchema.partial({ items: true }).safeParse(body);
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

  const { data: existing } = await supabase.from("sales").select("id, enquiry_id, sale_amount").eq("id", params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  const updatePayload: Record<string, unknown> = {};
  if (input.enquiry_id !== undefined) updatePayload.enquiry_id = input.enquiry_id;
  if (input.customer_name !== undefined) updatePayload.customer_name = input.customer_name;
  if (input.whatsapp_number !== undefined) updatePayload.whatsapp_number = input.whatsapp_number ?? null;
  if (input.sale_date !== undefined) updatePayload.sale_date = input.sale_date.toISOString();
  if (input.source !== undefined) updatePayload.source = input.source;
  if (input.payment_method !== undefined) updatePayload.payment_method = input.payment_method;
  if (input.sale_amount !== undefined) updatePayload.sale_amount = input.sale_amount;
  if (input.notes !== undefined) updatePayload.notes = input.notes ?? null;

  const { data: sale, error: updateError } = await supabase
    .from("sales")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (updateError || !sale) {
    return NextResponse.json({ error: updateError?.message ?? "Failed to update sale." }, { status: 500 });
  }

  let saleItems: unknown[] | undefined;
  if (input.items) {
    // Full item replacement: reverse whatever ml the OLD items deducted
    // before applying deduction for the NEW items, so editing a sale nets
    // out correctly (the delta) instead of double-deducting or leaking ml.
    const { data: oldItems } = await supabase.from("sale_items").select("*").eq("sale_id", params.id);
    const oldDeductedItems = (oldItems ?? []).map((i) => ({ product_id: i.product_id, ml_deducted: i.ml_deducted }));

    await reverseSaleItemsInventory(supabase, oldDeductedItems);
    await supabase.from("sale_items").delete().eq("sale_id", params.id);

    if (input.items.length > 0) {
      let deductions;
      try {
        deductions = await deductInventoryForSale(
          supabase,
          input.items.map((i) => ({ product_id: i.product_id ?? null, variant_id: i.variant_id ?? null, quantity: i.quantity }))
        );
      } catch (err) {
        // New deduction failed — undo the reversal above (re-subtract the
        // same ml) and restore the exact old item rows so no data is lost.
        await reverseSaleItemsInventory(
          supabase,
          oldDeductedItems.map((i) => ({ product_id: i.product_id, ml_deducted: i.ml_deducted != null ? -i.ml_deducted : null }))
        );
        if (oldItems && oldItems.length > 0) {
          await supabase.from("sale_items").insert(oldItems.map(({ id, ...rest }) => rest));
        }
        return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update inventory." }, { status: 400 });
      }

      const { data: items, error: itemsError } = await supabase
        .from("sale_items")
        .insert(buildSaleItemRows(params.id, input.items, deductions))
        .select();

      if (itemsError) {
        await reverseSaleItemsInventory(
          supabase,
          input.items.map((item, idx) => ({ product_id: item.product_id ?? null, ml_deducted: deductions[idx].ml_deducted }))
        );
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
      saleItems = items ?? [];
    } else {
      saleItems = [];
    }
  }

  const linkedEnquiryId = sale.enquiry_id ?? existing.enquiry_id;
  if (linkedEnquiryId) {
    await supabase.from("enquiry_activities").insert({
      enquiry_id: linkedEnquiryId,
      event_type: "sale_updated",
      metadata: {
        sale_id: sale.id,
        previous_amount: existing.sale_amount,
        new_amount: sale.sale_amount,
      },
      created_by: user!.email,
    });
  }

  return NextResponse.json({ sale: { ...sale, ...(saleItems ? { sale_items: saleItems } : {}) } });
}

// DELETE /api/admin/sales/[id] — restores ml for every item that had a
// tracked deduction, then deletes the sale (cascades to sale_items). Never
// blocks the delete even if reversal partially fails for an item (e.g. its
// product's inventory record was later removed) — a sale must always be
// deletable, since reverse_inventory_sale silently no-ops in that case.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();

  const { data: existing } = await supabase.from("sales").select("id").eq("id", params.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  const { data: items } = await supabase.from("sale_items").select("product_id, ml_deducted").eq("sale_id", params.id);
  await reverseSaleItemsInventory(supabase, items ?? []);

  const { error } = await supabase.from("sales").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
