import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { addEnquiriesSheet, addSalesSheet, addSummarySheet, filenameFor } from "@/lib/export/build-workbook";
import { resolveDateRange, type DateRangeKey } from "@/lib/analytics/date-range";
import { getDashboardMetrics } from "@/lib/analytics/queries";
import { formatGHS } from "@/lib/currency";

export const dynamic = "force-dynamic";

// GET /api/admin/export/combined — Sheet1: Enquiries, Sheet2: Sales, Sheet3:
// Summary, all scoped to the same date range (defaults to last 30 days).
export async function GET(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const params = req.nextUrl.searchParams;
  const rangeKey = (params.get("range") as DateRangeKey) || "30d";
  const range = resolveDateRange(rangeKey, params.get("from"), params.get("to"));

  const [{ data: enquiries }, { data: sales }, metrics] = await Promise.all([
    supabase
      .from("enquiries")
      .select("*")
      .gte("created_at", range.from.toISOString())
      .lt("created_at", range.to.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select("*")
      .gte("sale_date", range.from.toISOString())
      .lt("sale_date", range.to.toISOString())
      .order("sale_date", { ascending: false }),
    getDashboardMetrics(supabase, range),
  ]);

  const enquiryIds = (enquiries ?? []).map((e) => e.id);
  const saleIds = (sales ?? []).map((s) => s.id);

  const [{ data: enquiryItems }, { data: enquiryNotes }, { data: saleItems }] = await Promise.all([
    enquiryIds.length > 0 ? supabase.from("enquiry_items").select("*").in("enquiry_id", enquiryIds) : Promise.resolve({ data: [] }),
    enquiryIds.length > 0 ? supabase.from("enquiry_notes").select("*").in("enquiry_id", enquiryIds) : Promise.resolve({ data: [] }),
    saleIds.length > 0 ? supabase.from("sale_items").select("*").in("sale_id", saleIds) : Promise.resolve({ data: [] }),
  ]);

  const itemsByEnquiry = new Map<string, typeof enquiryItems>();
  for (const item of enquiryItems ?? []) itemsByEnquiry.set(item.enquiry_id, [...(itemsByEnquiry.get(item.enquiry_id) ?? []), item]);
  const notesByEnquiry = new Map<string, typeof enquiryNotes>();
  for (const note of enquiryNotes ?? []) notesByEnquiry.set(note.enquiry_id, [...(notesByEnquiry.get(note.enquiry_id) ?? []), note]);
  const itemsBySale = new Map<string, typeof saleItems>();
  for (const item of saleItems ?? []) itemsBySale.set(item.sale_id, [...(itemsBySale.get(item.sale_id) ?? []), item]);

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
      items: (itemsByEnquiry.get(e.id) ?? []).map((i) => ({ product_name: i.product_name, size: i.size, quantity: i.quantity, price: Number(i.price) })),
      notes: (notesByEnquiry.get(e.id) ?? []).map((n) => ({ note: n.note, created_at: n.created_at })),
    }))
  );

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
      items: (itemsBySale.get(s.id) ?? []).map((i) => ({ product_name_snapshot: i.product_name_snapshot, size_snapshot: i.size_snapshot, quantity: i.quantity, unit_price: Number(i.unit_price) })),
    }))
  );

  addSummarySheet(workbook, [
    { label: "Date Range", value: range.label },
    { label: "New Enquiries", value: String(metrics.newEnquiries) },
    { label: "WhatsApp Opened", value: String(metrics.whatsappOpened) },
    { label: "Website Enquiries", value: String(metrics.websiteEnquiries) },
    { label: "Estimated Enquiry Value (not revenue)", value: formatGHS(metrics.estimatedEnquiryValue) },
    { label: "Completed Sales", value: String(metrics.completedSales) },
    { label: "Confirmed Sales Value (actual revenue)", value: formatGHS(metrics.confirmedSalesValue) },
    { label: "Average Sale Value", value: formatGHS(metrics.averageSaleValue) },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = filenameFor("summary", range.from, range.to);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
