import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { addInventorySheet, filenameFor } from "@/lib/export/build-workbook";
import { getSettings } from "@/lib/data/settings";
import { inventoryStatus, effectiveThreshold, avgCostPerMl, totalCostPerDecant } from "@/lib/inventory/status";
import { INVENTORY_STATUS_LABELS, type InventoryStatus } from "@/types";
import { oneOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/admin/export/inventory — exports every tracked perfume's current
// ml/cost/profit state. Untracked products are left out entirely (nothing
// to export for them yet).
export async function GET(_req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const [{ data: products }, settings] = await Promise.all([
    supabase.from("products").select("id, brand, name, product_inventory(*)").order("brand"),
    getSettings(),
  ]);

  const rows = (products ?? [])
    .map((p) => {
      const inv = oneOf(p.product_inventory);
      if (!inv) return null;
      const threshold = effectiveThreshold(inv.low_stock_threshold_ml, settings.default_low_stock_threshold_ml);
      const status: InventoryStatus = inventoryStatus(inv.current_ml, threshold);
      const avgCost = avgCostPerMl(inv.total_cost_invested, inv.initial_ml);
      const costPerDecant = totalCostPerDecant(avgCost, inv.decant_size_ml, inv);
      return {
        brand: p.brand,
        name: p.name,
        initial_ml: Number(inv.initial_ml),
        current_ml: Number(inv.current_ml),
        decants_sold: inv.decant_size_ml > 0 ? Math.floor((inv.initial_ml - inv.current_ml) / inv.decant_size_ml) : 0,
        avg_cost_per_ml: Math.round(avgCost * 100) / 100,
        cost_per_decant: costPerDecant,
        selling_price_per_decant: Number(inv.selling_price_per_decant),
        profit_per_decant: Math.round((inv.selling_price_per_decant - costPerDecant) * 100) / 100,
        status: INVENTORY_STATUS_LABELS[status],
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Met Scents Admin";
  workbook.created = new Date();
  addInventorySheet(workbook, rows);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = filenameFor("inventory");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
