import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaleInput } from "@/lib/validation";

interface DeductibleItem {
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
}

export interface DeductionResult {
  decant_size_ml: number | null;
  ml_deducted: number | null;
  unit_cost_snapshot: number | null;
}

/**
 * Deducts inventory for every sale line that references a tracked variant
 * (the product has a product_inventory row AND the chosen variant has a
 * size_ml). Lines with no product, no matching variant, or an untracked
 * product get a null result — "cost not tracked" — never a fabricated 0.
 *
 * Applies deductions one item at a time so an insufficient-stock failure
 * partway through the list can cleanly reverse everything this call already
 * deducted before rethrowing — current_ml never ends up partially
 * decremented by a request that ultimately failed.
 */
export async function deductInventoryForSale(supabase: SupabaseClient, items: DeductibleItem[]): Promise<DeductionResult[]> {
  const productIds = [...new Set(items.map((i) => i.product_id).filter((id): id is string => Boolean(id)))];
  const variantIds = [...new Set(items.map((i) => i.variant_id).filter((id): id is string => Boolean(id)))];

  const [{ data: inventories }, { data: variants }] = await Promise.all([
    productIds.length
      ? supabase.from("product_inventory").select("product_id").in("product_id", productIds)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
    variantIds.length
      ? supabase.from("product_variants").select("id, size_ml").in("id", variantIds)
      : Promise.resolve({ data: [] as { id: string; size_ml: number | null }[] }),
  ]);

  const trackedProductIds = new Set((inventories ?? []).map((i) => i.product_id));
  const variantMlById = new Map((variants ?? []).map((v) => [v.id, v.size_ml]));

  const results: DeductionResult[] = [];
  const applied: { product_id: string; ml: number }[] = [];

  try {
    for (const item of items) {
      const sizeMl = item.variant_id ? variantMlById.get(item.variant_id) : null;
      if (!item.product_id || !sizeMl || !trackedProductIds.has(item.product_id)) {
        results.push({ decant_size_ml: null, ml_deducted: null, unit_cost_snapshot: null });
        continue;
      }

      const { data, error } = await supabase.rpc("record_inventory_sale", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
        p_ml_per_unit: sizeMl,
      });
      if (error) throw new Error(error.message);

      const row = Array.isArray(data) ? data[0] : data;
      applied.push({ product_id: item.product_id, ml: row.ml_deducted });
      results.push({ decant_size_ml: sizeMl, ml_deducted: row.ml_deducted, unit_cost_snapshot: row.unit_cost_snapshot });
    }
    return results;
  } catch (err) {
    for (const a of applied) {
      await supabase.rpc("reverse_inventory_sale", { p_product_id: a.product_id, p_ml_to_restore: a.ml });
    }
    throw err;
  }
}

/** Restores ml for every sale_items row that had a tracked deduction. */
export async function reverseSaleItemsInventory(
  supabase: SupabaseClient,
  items: { product_id: string | null; ml_deducted: number | null }[]
) {
  for (const item of items) {
    if (item.product_id && item.ml_deducted) {
      await supabase.rpc("reverse_inventory_sale", { p_product_id: item.product_id, p_ml_to_restore: item.ml_deducted });
    }
  }
}

/** Builds insertable sale_items rows, merging in the cost/profit snapshot from deductInventoryForSale. */
export function buildSaleItemRows(saleId: string, items: SaleInput["items"], deductions: DeductionResult[]) {
  return items.map((item, idx) => {
    const d = deductions[idx];
    const lineTotal = Math.round(item.quantity * item.unit_price * 100) / 100;
    const lineCost = d.unit_cost_snapshot != null ? Math.round(d.unit_cost_snapshot * item.quantity * 100) / 100 : null;
    return {
      sale_id: saleId,
      product_id: item.product_id ?? null,
      variant_id: item.variant_id ?? null,
      product_name_snapshot: item.product_name_snapshot,
      brand_snapshot: item.brand_snapshot ?? null,
      size_snapshot: item.size_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: lineTotal,
      decant_size_ml: d.decant_size_ml,
      ml_deducted: d.ml_deducted,
      unit_cost_snapshot: d.unit_cost_snapshot,
      line_cost: lineCost,
      line_profit: lineCost != null ? Math.round((lineTotal - lineCost) * 100) / 100 : null,
    };
  });
}
