import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { addEnquiriesSheet, filenameFor } from "@/lib/export/build-workbook";

export const dynamic = "force-dynamic";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/admin/export/enquiries — exports EXACTLY what the current
// /admin/enquiries filters show (same query params), never the whole table
// unless no filters are set. One row per enquiry; multiple products in one
// enquiry are preserved as line breaks within that row's cells.
export async function GET(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const params = req.nextUrl.searchParams;

  let query = supabase.from("enquiries").select("*");

  const status = params.get("status");
  const source = params.get("source");
  const whatsappOpened = params.get("whatsapp_opened");
  const product = params.get("product");
  const from = params.get("from");
  const to = params.get("to");
  const search = params.get("search");

  if (status) query = query.eq("status", status);
  if (source) query = query.eq("enquiry_source", source);
  if (whatsappOpened) query = query.eq("whatsapp_opened", whatsappOpened === "true");
  if (from) query = query.gte("created_at", from);
  if (to) {
    const toDate = new Date(to);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    query = query.lt("created_at", toDate.toISOString().slice(0, 10));
  }
  if (product) {
    const { data: matchingItems } = await supabase.from("enquiry_items").select("enquiry_id").eq("product_id", product);
    const ids = Array.from(new Set((matchingItems ?? []).map((i) => i.enquiry_id)));
    query = query.in("id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }
  if (search) {
    const q = search.trim();
    const orClauses = [`customer_name.ilike.%${q}%`, `whatsapp_number.ilike.%${q}%`, `email.ilike.%${q}%`];
    if (uuidRegex.test(q)) orClauses.push(`id.eq.${q}`);
    const { data: matchingItems } = await supabase.from("enquiry_items").select("enquiry_id").ilike("product_name", `%${q}%`);
    const productMatchIds = Array.from(new Set((matchingItems ?? []).map((i) => i.enquiry_id)));
    if (productMatchIds.length > 0) orClauses.push(`id.in.(${productMatchIds.join(",")})`);
    query = query.or(orClauses.join(","));
  }

  query = query.order("created_at", { ascending: false });

  const { data: enquiries, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (enquiries ?? []).map((e) => e.id);
  const [{ data: items }, { data: notes }] =
    ids.length > 0
      ? await Promise.all([
          supabase.from("enquiry_items").select("*").in("enquiry_id", ids),
          supabase.from("enquiry_notes").select("*").in("enquiry_id", ids),
        ])
      : [{ data: [] }, { data: [] }];

  const itemsByEnquiry = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsByEnquiry.get(item.enquiry_id) ?? [];
    list.push(item);
    itemsByEnquiry.set(item.enquiry_id, list);
  }
  const notesByEnquiry = new Map<string, typeof notes>();
  for (const note of notes ?? []) {
    const list = notesByEnquiry.get(note.enquiry_id) ?? [];
    list.push(note);
    notesByEnquiry.set(note.enquiry_id, list);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Met Scents Admin";
  workbook.created = new Date();

  addEnquiriesSheet(
    workbook,
    (enquiries ?? []).map((e) => ({
      id: e.id,
      created_at: e.created_at,
      customer_name: e.customer_name,
      whatsapp_number: e.whatsapp_number,
      email: e.email,
      location: e.location,
      message: e.message,
      estimated_total: Number(e.estimated_total),
      enquiry_source: e.enquiry_source,
      whatsapp_opened: e.whatsapp_opened,
      whatsapp_opened_at: e.whatsapp_opened_at,
      status: e.status,
      outcome: e.outcome,
      contacted_at: e.contacted_at,
      completed_at: e.completed_at,
      items: (itemsByEnquiry.get(e.id) ?? []).map((i) => ({
        product_name: i.product_name,
        size: i.size,
        quantity: i.quantity,
        price: Number(i.price),
      })),
      notes: (notesByEnquiry.get(e.id) ?? []).map((n) => ({ note: n.note, created_at: n.created_at })),
    }))
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = filenameFor(
    "enquiries",
    from ? new Date(from) : undefined,
    to ? new Date(to) : undefined
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
