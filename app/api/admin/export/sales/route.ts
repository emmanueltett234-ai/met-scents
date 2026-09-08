import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { addSalesSheet, filenameFor } from "@/lib/export/build-workbook";

export const dynamic = "force-dynamic";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/admin/export/sales — exports EXACTLY what the current
// /admin/sales filters show. One row per sale; multiple line items are
// preserved as line breaks within that row's cells.
export async function GET(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const params = req.nextUrl.searchParams;

  let query = supabase.from("sales").select("*");

  const source = params.get("source");
  const paymentMethod = params.get("payment_method");
  const from = params.get("from");
  const to = params.get("to");
  const search = params.get("search");

  if (source) query = query.eq("source", source);
  if (paymentMethod) query = query.eq("payment_method", paymentMethod);
  if (from) query = query.gte("sale_date", from);
  if (to) {
    const toDate = new Date(to);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    query = query.lt("sale_date", toDate.toISOString().slice(0, 10));
  }
  if (search) {
    const q = search.trim();
    const orClauses = [`customer_name.ilike.%${q}%`, `whatsapp_number.ilike.%${q}%`];
    if (uuidRegex.test(q)) orClauses.push(`id.eq.${q}`);
    query = query.or(orClauses.join(","));
  }

  query = query.order("sale_date", { ascending: false });

  const { data: sales, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (sales ?? []).map((s) => s.id);
  const { data: items } = ids.length > 0 ? await supabase.from("sale_items").select("*").in("sale_id", ids) : { data: [] };

  const itemsBySale = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsBySale.get(item.sale_id) ?? [];
    list.push(item);
    itemsBySale.set(item.sale_id, list);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Met Scents Admin";
  workbook.created = new Date();

  addSalesSheet(
    workbook,
    (sales ?? []).map((s) => ({
      id: s.id,
      sale_date: s.sale_date,
      enquiry_id: s.enquiry_id,
      customer_name: s.customer_name,
      whatsapp_number: s.whatsapp_number,
      source: s.source,
      payment_method: s.payment_method,
      sale_amount: Number(s.sale_amount),
      notes: s.notes,
      created_by: s.created_by,
      created_at: s.created_at,
      updated_at: s.updated_at,
      items: (itemsBySale.get(s.id) ?? []).map((i) => ({
        product_name_snapshot: i.product_name_snapshot,
        size_snapshot: i.size_snapshot,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
      })),
    }))
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = filenameFor("sales", from ? new Date(from) : undefined, to ? new Date(to) : undefined);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
