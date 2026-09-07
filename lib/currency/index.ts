/**
 * Single source of truth for currency formatting. All prices are stored as
 * plain numeric values (e.g. 380.00) in the database — this is the only
 * place that turns a number into the "GH₵380" display string, so formatting
 * stays consistent everywhere it's used across the app.
 */
export function formatGHS(amount: number): string {
  const formatted = new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `GH₵${formatted}`;
}

export function parsePrice(value: string | number): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}
