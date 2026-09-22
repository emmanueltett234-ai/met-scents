import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { addExpensesSheet, filenameFor } from "@/lib/export/build-workbook";

export const dynamic = "force-dynamic";

// GET /api/admin/export/expenses — exports EXACTLY what the current
// /admin/expenses filters show.
export async function GET(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const params = req.nextUrl.searchParams;

  let query = supabase.from("business_expenses").select("*, products(brand, name)");

  const search = params.get("search");
  const category = params.get("category");
  const from = params.get("from");
  const to = params.get("to");

  if (search) query = query.ilike("expense_name", `%${search.trim()}%`);
  if (category) query = query.eq("category", category);
  if (from) query = query.gte("expense_date", from);
  if (to) {
    const toDate = new Date(to);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    query = query.lt("expense_date", toDate.toISOString().slice(0, 10));
  }

  query = query.order("expense_date", { ascending: false });

  const { data: expenses, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Met Scents Admin";
  workbook.created = new Date();

  addExpensesSheet(
    workbook,
    (expenses ?? []).map((e) => {
      const product = Array.isArray(e.products) ? e.products[0] : e.products;
      return {
        expense_name: e.expense_name,
        category: e.category,
        amount: Number(e.amount),
        expense_date: e.expense_date,
        description: e.description,
        related_product: product ? `${product.brand} - ${product.name}` : null,
        created_by: e.created_by,
      };
    })
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = filenameFor("expenses", from ? new Date(from) : undefined, to ? new Date(to) : undefined);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
