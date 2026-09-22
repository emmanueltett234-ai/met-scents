import type { InventoryStatus } from "@/types";

// The single place inventory status is derived — always from the live
// current_ml balance, never stored, so it can't go stale. Reused by the
// inventory list, the dashboard, and the needs-attention query.
export function inventoryStatus(currentMl: number, thresholdMl: number): InventoryStatus {
  if (currentMl <= 0) return "out_of_stock";
  if (currentMl <= thresholdMl) return "low_stock";
  return "in_stock";
}

// A product's effective low-stock threshold: its own override if set,
// otherwise the shop-wide default from settings.
export function effectiveThreshold(productThresholdMl: number | null, defaultThresholdMl: number): number {
  return productThresholdMl ?? defaultThresholdMl;
}

// How many full decants the remaining ml can produce, and how much is left
// over that can't form a complete decant (requirement: show both values).
export function decantBreakdown(currentMl: number, decantSizeMl: number): { fullDecants: number; leftoverMl: number } {
  if (decantSizeMl <= 0) return { fullDecants: 0, leftoverMl: currentMl };
  const fullDecants = Math.floor(currentMl / decantSizeMl);
  const leftoverMl = Math.round((currentMl - fullDecants * decantSizeMl) * 100) / 100;
  return { fullDecants, leftoverMl };
}

// Weighted-average cost per ml, derived from cumulative totals so it's
// always correct across any number of restocks at different prices.
export function avgCostPerMl(totalCostInvested: number, initialMl: number): number {
  return initialMl > 0 ? totalCostInvested / initialMl : 0;
}

export function totalCostPerDecant(
  avgCostPerMlValue: number,
  decantSizeMl: number,
  extras: {
    atomizer_cost: number;
    label_cost: number;
    packaging_cost: number;
    pouch_cost: number;
    shipping_cost: number;
    other_cost: number;
  }
): number {
  const juiceCost = avgCostPerMlValue * decantSizeMl;
  const extrasCost =
    extras.atomizer_cost + extras.label_cost + extras.packaging_cost + extras.pouch_cost + extras.shipping_cost + extras.other_cost;
  return Math.round((juiceCost + extrasCost) * 100) / 100;
}
