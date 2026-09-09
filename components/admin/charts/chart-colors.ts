// The admin is a working tool the shop owner scans quickly, not a
// customer-facing brand surface — so unlike the storefront's restrained
// black/white/olive palette, charts here use real, distinguishable color so
// data reads at a glance: each category has a fixed, semantic color
// regardless of chart type, plus a vivid fallback sequence for anything
// unmapped.
export const KEY_COLORS: Record<string, string> = {
  // enquiry / sale source
  website: "#2563EB", // blue
  whatsapp: "#128C7E", // the same WhatsApp green used on every WhatsApp button site-wide
  unknown: "#94A3B8", // slate
  instagram: "#DB2777", // pink
  walk_in: "#F59E0B", // amber
  referral: "#7C3AED", // violet
  other: "#64748B", // slate

  // enquiry status
  new: "#F59E0B",
  contacted: "#2563EB",
  pending: "#7C3AED",
  completed: "#16A34A",
  cancelled: "#DC2626",

  // payment method
  cash: "#F59E0B",
  mobile_money: "#16A34A",
  bank_transfer: "#2563EB",
};

export const FALLBACK_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DB2777", "#7C3AED", "#0891B2"];

export function colorForKey(key: string, index: number): string {
  return KEY_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export const CHART_GRID = "#E2E5DB"; // neutral border tone — kept quiet so the colored data stays what draws the eye
export const CHART_MUTED_TEXT = "#4D4D4D";
