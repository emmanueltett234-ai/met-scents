import Link from "next/link";
import { Package, FileSpreadsheet } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { InventoryFilters } from "@/components/admin/inventory/inventory-filters";
import { InventoryTable, type InventoryRow } from "@/components/admin/inventory/inventory-table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import { inventoryStatus, effectiveThreshold, decantBreakdown, avgCostPerMl, totalCostPerDecant } from "@/lib/inventory/status";
import { oneOf } from "@/lib/utils";
import type { ProductInventory } from "@/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  status?: string;
  sort?: string;
}

export default async function InventoryPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const [{ data: products }, settings] = await Promise.all([
    supabase
      .from("products")
      .select("id, brand, name, slug, image_url, product_types(name), product_inventory(*)")
      .order("brand"),
    getSettings(),
  ]);

  let rows: InventoryRow[] = (products ?? []).map((p) => {
    const inv = oneOf(p.product_inventory) as ProductInventory | null;
    const type = oneOf(p.product_types);
    if (!inv) {
      return {
        productId: p.id,
        brand: p.brand,
        name: p.name,
        imageUrl: p.image_url,
        typeName: type?.name ?? null,
        tracked: false,
      };
    }

    const threshold = effectiveThreshold(inv.low_stock_threshold_ml, settings.default_low_stock_threshold_ml);
    const status = inventoryStatus(inv.current_ml, threshold);
    const { fullDecants, leftoverMl } = decantBreakdown(inv.current_ml, inv.decant_size_ml);
    const decantsSold = inv.decant_size_ml > 0 ? Math.floor((inv.initial_ml - inv.current_ml) / inv.decant_size_ml) : 0;
    const costPerDecant = totalCostPerDecant(avgCostPerMl(inv.total_cost_invested, inv.initial_ml), inv.decant_size_ml, inv);
    const profitPerDecant = Math.round((inv.selling_price_per_decant - costPerDecant) * 100) / 100;

    return {
      productId: p.id,
      brand: p.brand,
      name: p.name,
      imageUrl: p.image_url,
      typeName: type?.name ?? null,
      tracked: true,
      initialMl: inv.initial_ml,
      currentMl: inv.current_ml,
      decantsSold,
      fullDecants,
      leftoverMl,
      costPerDecant,
      sellingPricePerDecant: inv.selling_price_per_decant,
      profitPerDecant,
      status,
    };
  });

  if (searchParams.search) {
    const q = searchParams.search.toLowerCase();
    rows = rows.filter((r) => r.brand.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }
  if (searchParams.status === "not_tracked") {
    rows = rows.filter((r) => !r.tracked);
  } else if (searchParams.status) {
    rows = rows.filter((r) => r.tracked && r.status === searchParams.status);
  }

  const sort = searchParams.sort ?? "brand_asc";
  rows.sort((a, b) => {
    if (sort === "remaining_asc") return (a.currentMl ?? Infinity) - (b.currentMl ?? Infinity);
    if (sort === "remaining_desc") return (b.currentMl ?? -Infinity) - (a.currentMl ?? -Infinity);
    if (sort === "profit_desc") return (b.profitPerDecant ?? -Infinity) - (a.profitPerDecant ?? -Infinity);
    return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`);
  });

  const lowOrOutCount = rows.filter((r) => r.tracked && (r.status === "low_stock" || r.status === "out_of_stock")).length;
  const juiceRemaining = rows.reduce((sum, r) => sum + (r.currentMl ?? 0), 0);

  return (
    <AdminShell
      title="Inventory"
      description={`${juiceRemaining.toLocaleString()}ml remaining across ${rows.filter((r) => r.tracked).length} tracked perfume${rows.filter((r) => r.tracked).length === 1 ? "" : "s"}${lowOrOutCount > 0 ? ` — ${lowOrOutCount} need attention` : ""}.`}
      action={
        <Button asChild variant="outline" size="sm">
          <a href="/api/admin/export/inventory"><FileSpreadsheet className="h-4 w-4" /> Export</a>
        </Button>
      }
    >
      <InventoryFilters />

      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No products in the catalogue yet.</p>
      ) : (
        <InventoryTable rows={rows} />
      )}

      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" />
        <span>
          Inventory attaches to your existing catalogue products. Need to add a new perfume entirely?{" "}
          <Link href="/admin/products/new" className="underline hover:text-ink">
            Add it to the catalogue
          </Link>{" "}
          first, then set up its inventory here.
        </span>
      </div>
    </AdminShell>
  );
}
