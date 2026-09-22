import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { addProfitByProductSheet, addSummarySheet, filenameFor } from "@/lib/export/build-workbook";
import { resolveDateRange, type DateRangeKey } from "@/lib/analytics/date-range";
import { getProfitMetrics, getProfitByProduct } from "@/lib/analytics/queries";
import { formatGHS } from "@/lib/currency";

export const dynamic = "force-dynamic";

// GET /api/admin/export/profit — Sheet1: profit by product, Sheet2:
// revenue -> gross profit -> expenses -> net profit summary, for the given
// date range (defaults to last 30 days).
export async function GET(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const params = req.nextUrl.searchParams;
  const rangeKey = (params.get("range") as DateRangeKey) || "30d";
  const range = resolveDateRange(rangeKey, params.get("from"), params.get("to"));

  const [metrics, byProduct] = await Promise.all([getProfitMetrics(supabase, range), getProfitByProduct(supabase, range)]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Met Scents Admin";
  workbook.created = new Date();

  addProfitByProductSheet(
    workbook,
    byProduct.map((p) => ({
      product_name: p.productName,
      units_sold: p.unitsSold,
      revenue: p.revenue,
      cost: p.cost,
      profit: p.profit,
    }))
  );

  addSummarySheet(workbook, [
    { label: "Date Range", value: range.label },
    { label: "Revenue", value: formatGHS(metrics.revenue) },
    { label: "Product Cost", value: formatGHS(metrics.productCost) },
    { label: "Gross Profit", value: formatGHS(metrics.grossProfit) },
    { label: "Total Expenses", value: formatGHS(metrics.totalExpenses) },
    { label: "Net Profit", value: formatGHS(metrics.netProfit) },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = filenameFor("profit", range.from, range.to);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
