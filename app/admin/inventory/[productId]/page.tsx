import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { InventorySetupForm } from "@/components/admin/inventory/inventory-setup-form";
import { RestockForm } from "@/components/admin/inventory/restock-form";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import { formatGHS } from "@/lib/currency";
import { oneOf } from "@/lib/utils";
import {
  inventoryStatus,
  effectiveThreshold,
  decantBreakdown,
  avgCostPerMl,
  totalCostPerDecant,
} from "@/lib/inventory/status";
import { INVENTORY_STATUS_LABELS, type InventoryStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_BADGE_VARIANT: Record<InventoryStatus, "success" | "warning" | "destructive"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "destructive",
};

export default async function InventoryDetailPage({ params }: { params: { productId: string } }) {
  const supabase = createClient();
  const [{ data: product }, { data: inventory }, { data: purchases }, settings] = await Promise.all([
    supabase.from("products").select("id, brand, name, image_url, product_types(name)").eq("id", params.productId).maybeSingle(),
    supabase.from("product_inventory").select("*").eq("product_id", params.productId).maybeSingle(),
    supabase.from("inventory_purchases").select("*").eq("product_id", params.productId).order("purchase_date", { ascending: false }),
    getSettings(),
  ]);

  if (!product) notFound();
  const productType = oneOf(product.product_types);

  const threshold = inventory ? effectiveThreshold(inventory.low_stock_threshold_ml, settings.default_low_stock_threshold_ml) : null;
  const status = inventory && threshold != null ? inventoryStatus(inventory.current_ml, threshold) : null;
  const breakdown = inventory ? decantBreakdown(inventory.current_ml, inventory.decant_size_ml) : null;
  const avgCost = inventory ? avgCostPerMl(inventory.total_cost_invested, inventory.initial_ml) : 0;
  const costPerDecant = inventory ? totalCostPerDecant(avgCost, inventory.decant_size_ml, inventory) : 0;
  const profitPerDecant = inventory ? Math.round((inventory.selling_price_per_decant - costPerDecant) * 100) / 100 : 0;
  const totalInvested = (purchases ?? []).reduce((sum, p) => sum + Number(p.cost_price), 0);

  return (
    <AdminShell
      title={`${product.brand} - ${product.name}`}
      description={productType?.name ?? undefined}
      action={
        inventory && (
          <div className="flex items-center gap-3">
            {status && <Badge variant={STATUS_BADGE_VARIANT[status]}>{INVENTORY_STATUS_LABELS[status]}</Badge>}
            <RestockForm productId={product.id} defaultBottleSizeMl={inventory.bottle_size_ml} />
          </div>
        )
      }
    >
      <Link href="/admin/inventory" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Inventory
      </Link>

      {inventory && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Remaining", `${inventory.current_ml.toLocaleString()}ml`, `${breakdown?.fullDecants} decant${breakdown?.fullDecants === 1 ? "" : "s"}${breakdown?.leftoverMl ? ` + ${breakdown.leftoverMl}ml leftover` : ""}`],
            ["Avg. Cost / ml", formatGHS(avgCost), `${formatGHS(inventory.total_cost_invested)} invested in juice`],
            ["Cost / Decant", formatGHS(costPerDecant), `${inventory.decant_size_ml}ml juice + extras`],
            ["Profit / Decant", formatGHS(profitPerDecant), `sells for ${formatGHS(inventory.selling_price_per_decant)}`],
          ].map(([label, value, caption]) => (
            <div key={label} className="border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-widest2 text-muted-foreground">{label}</p>
              <p className="mt-1 font-serif text-2xl">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-10 max-w-2xl border border-border bg-white p-6">
        <h2 className="mb-4 font-serif text-lg">{inventory ? "Inventory Settings" : "Set Up Inventory Tracking"}</h2>
        <InventorySetupForm productId={product.id} inventory={inventory} />
      </div>

      {inventory && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg">Restock History</h2>
            <p className="text-xs text-muted-foreground">{formatGHS(totalInvested)} total invested</p>
          </div>
          {!purchases || purchases.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No restocks recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bottle Size</TableHead>
                  <TableHead>ML Added</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.purchase_date).toLocaleDateString("en-GH", { dateStyle: "medium" })}
                    </TableCell>
                    <TableCell className="text-sm">{Number(p.bottle_size_ml).toLocaleString()}ml</TableCell>
                    <TableCell className="text-sm">{Number(p.ml_added).toLocaleString()}ml</TableCell>
                    <TableCell className="text-sm">{formatGHS(Number(p.cost_price))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.notes ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </AdminShell>
  );
}
