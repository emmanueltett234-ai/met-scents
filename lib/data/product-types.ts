import { createClient } from "@/lib/supabase/server";
import type { ProductType } from "@/types";

// All product types, every status — admin management view.
export async function getProductTypes(): Promise<ProductType[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("product_types").select("*").order("sort_order");
  if (error) {
    console.error("getProductTypes error:", error.message);
    return [];
  }
  return (data ?? []) as ProductType[];
}

// Active-only — customer catalogue filter and the "new product" form, where
// an admin should only ever be offered types currently in use.
export async function getActiveProductTypes(): Promise<ProductType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    console.error("getActiveProductTypes error:", error.message);
    return [];
  }
  return (data ?? []) as ProductType[];
}

// Active types plus, if editing a product currently assigned to an inactive
// type, that one type too — so the edit form can still show/keep the
// product's real assignment without silently reassigning it. See
// PRODUCT.md §7: inactive types stay valid for products that already have
// them, just not selectable for new assignments.
export async function getProductTypesForForm(currentTypeId?: string | null): Promise<ProductType[]> {
  const active = await getActiveProductTypes();
  if (!currentTypeId || active.some((t) => t.id === currentTypeId)) return active;

  const supabase = createClient();
  const { data } = await supabase.from("product_types").select("*").eq("id", currentTypeId).maybeSingle();
  return data ? [...active, data as ProductType] : active;
}

export interface ProductTypeWithCount extends ProductType {
  productCount: number;
}

// Admin "Product Types" page — name/slug/status plus how many products are
// currently assigned, so the admin can see at a glance whether a type is
// safe to delete.
export async function getProductTypesWithCounts(): Promise<ProductTypeWithCount[]> {
  const supabase = createClient();
  const [{ data: types, error: typesError }, { data: products, error: productsError }] = await Promise.all([
    supabase.from("product_types").select("*").order("sort_order"),
    supabase.from("products").select("product_type_id"),
  ]);

  if (typesError) {
    console.error("getProductTypesWithCounts error:", typesError.message);
    return [];
  }
  if (productsError) {
    console.error("getProductTypesWithCounts (product counts) error:", productsError.message);
  }

  const counts = new Map<string, number>();
  for (const p of products ?? []) {
    if (!p.product_type_id) continue;
    counts.set(p.product_type_id, (counts.get(p.product_type_id) ?? 0) + 1);
  }

  return ((types ?? []) as ProductType[]).map((t) => ({ ...t, productCount: counts.get(t.id) ?? 0 }));
}
