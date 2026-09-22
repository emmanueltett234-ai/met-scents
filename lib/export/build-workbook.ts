import "server-only";
import ExcelJS from "exceljs";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_OUTCOME_LABELS, ENQUIRY_SOURCE_LABELS, SALE_SOURCE_LABELS, PAYMENT_METHOD_LABELS } from "@/types";
import type { EnquiryStatus, EnquiryOutcome, EnquirySource, SaleSource, PaymentMethod } from "@/types";

// Never invents a value that isn't actually in the database — every column
// below reads straight off the row, and a genuinely missing field is left
// blank rather than guessed or defaulted to something plausible-looking.

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17140F" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFF6F3EC" }, size: 11 };
const CURRENCY_FORMAT = '"GH₵"#,##0.00';
const DATE_FORMAT = "dd mmm yyyy hh:mm";

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  });
  row.height = 22;
}

interface EnquiryExportRow {
  id: string;
  created_at: string;
  customer_name: string;
  whatsapp_number: string;
  email: string | null;
  location: string | null;
  message: string | null;
  estimated_total: number;
  enquiry_source: string;
  whatsapp_opened: boolean;
  whatsapp_opened_at: string | null;
  status: string;
  outcome: string;
  contacted_at: string | null;
  completed_at: string | null;
  items: { product_name: string; size: string; quantity: number; price: number }[];
  notes: { note: string; created_at: string }[];
}

export function addEnquiriesSheet(workbook: ExcelJS.Workbook, rows: EnquiryExportRow[]) {
  const sheet = workbook.addWorksheet("Enquiries", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = [
    { header: "Enquiry ID", key: "id", width: 20 },
    { header: "Date", key: "date", width: 18 },
    { header: "Customer Name", key: "customer_name", width: 22 },
    { header: "WhatsApp Number", key: "whatsapp_number", width: 18 },
    { header: "Email", key: "email", width: 24 },
    { header: "Location", key: "location", width: 20 },
    { header: "Customer Message", key: "message", width: 30 },
    { header: "Products", key: "products", width: 30 },
    { header: "Sizes", key: "sizes", width: 16 },
    { header: "Quantities", key: "quantities", width: 14 },
    { header: "Price Per Item", key: "price_per_item", width: 18 },
    { header: "Estimated Total", key: "estimated_total", width: 16 },
    { header: "Enquiry Source", key: "enquiry_source", width: 16 },
    { header: "WhatsApp Opened", key: "whatsapp_opened", width: 16 },
    { header: "WhatsApp Opened At", key: "whatsapp_opened_at", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Outcome", key: "outcome", width: 16 },
    { header: "Admin Notes", key: "admin_notes", width: 34 },
    { header: "Contacted At", key: "contacted_at", width: 18 },
    { header: "Completed At", key: "completed_at", width: 18 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const r of rows) {
    const row = sheet.addRow({
      id: r.id,
      date: new Date(r.created_at),
      customer_name: r.customer_name,
      whatsapp_number: r.whatsapp_number,
      email: r.email ?? "",
      location: r.location ?? "",
      message: r.message ?? "",
      products: r.items.map((i) => i.product_name).join("\n"),
      sizes: r.items.map((i) => i.size).join("\n"),
      quantities: r.items.map((i) => i.quantity).join("\n"),
      price_per_item: r.items.map((i) => `GH₵${i.price.toFixed(2)}`).join("\n"),
      estimated_total: r.estimated_total,
      enquiry_source: ENQUIRY_SOURCE_LABELS[r.enquiry_source as EnquirySource] ?? r.enquiry_source,
      whatsapp_opened: r.whatsapp_opened ? "Yes" : "No",
      whatsapp_opened_at: r.whatsapp_opened_at ? new Date(r.whatsapp_opened_at) : "",
      status: ENQUIRY_STATUS_LABELS[r.status as EnquiryStatus] ?? r.status,
      outcome: ENQUIRY_OUTCOME_LABELS[r.outcome as EnquiryOutcome] ?? r.outcome,
      admin_notes: r.notes.map((n) => `${new Date(n.created_at).toLocaleDateString("en-GH")}: ${n.note}`).join("\n"),
      contacted_at: r.contacted_at ? new Date(r.contacted_at) : "",
      completed_at: r.completed_at ? new Date(r.completed_at) : "",
    });
    row.getCell("date").numFmt = DATE_FORMAT;
    row.getCell("estimated_total").numFmt = CURRENCY_FORMAT;
    row.getCell("whatsapp_opened_at").numFmt = DATE_FORMAT;
    row.getCell("contacted_at").numFmt = DATE_FORMAT;
    row.getCell("completed_at").numFmt = DATE_FORMAT;
    row.alignment = { vertical: "top", wrapText: true };
  }

  sheet.autoFilter = { from: "A1", to: `T${rows.length + 1}` };
  return sheet;
}

interface SaleExportRow {
  id: string;
  sale_date: string;
  enquiry_id: string | null;
  customer_name: string;
  whatsapp_number: string | null;
  source: string;
  payment_method: string;
  sale_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items: { product_name_snapshot: string; size_snapshot: string; quantity: number; unit_price: number }[];
}

export function addSalesSheet(workbook: ExcelJS.Workbook, rows: SaleExportRow[]) {
  const sheet = workbook.addWorksheet("Sales", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = [
    { header: "Sale ID", key: "id", width: 20 },
    { header: "Sale Date", key: "sale_date", width: 18 },
    { header: "Enquiry ID", key: "enquiry_id", width: 20 },
    { header: "Customer Name", key: "customer_name", width: 22 },
    { header: "WhatsApp Number", key: "whatsapp_number", width: 18 },
    { header: "Source", key: "source", width: 14 },
    { header: "Products", key: "products", width: 30 },
    { header: "Sizes", key: "sizes", width: 16 },
    { header: "Quantities", key: "quantities", width: 14 },
    { header: "Unit Prices", key: "unit_prices", width: 18 },
    { header: "Sale Amount", key: "sale_amount", width: 16 },
    { header: "Payment Method", key: "payment_method", width: 16 },
    { header: "Notes", key: "notes", width: 30 },
    { header: "Recorded By", key: "created_by", width: 22 },
    { header: "Created At", key: "created_at", width: 18 },
    { header: "Updated At", key: "updated_at", width: 18 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const r of rows) {
    const row = sheet.addRow({
      id: r.id,
      sale_date: new Date(r.sale_date),
      enquiry_id: r.enquiry_id ?? "",
      customer_name: r.customer_name,
      whatsapp_number: r.whatsapp_number ?? "",
      source: SALE_SOURCE_LABELS[r.source as SaleSource] ?? r.source,
      products: r.items.map((i) => i.product_name_snapshot).join("\n"),
      sizes: r.items.map((i) => i.size_snapshot).join("\n"),
      quantities: r.items.map((i) => i.quantity).join("\n"),
      unit_prices: r.items.map((i) => `GH₵${i.unit_price.toFixed(2)}`).join("\n"),
      sale_amount: r.sale_amount,
      payment_method: PAYMENT_METHOD_LABELS[r.payment_method as PaymentMethod] ?? r.payment_method,
      notes: r.notes ?? "",
      created_by: r.created_by ?? "",
      created_at: new Date(r.created_at),
      updated_at: new Date(r.updated_at),
    });
    row.getCell("sale_date").numFmt = DATE_FORMAT;
    row.getCell("sale_amount").numFmt = CURRENCY_FORMAT;
    row.getCell("created_at").numFmt = DATE_FORMAT;
    row.getCell("updated_at").numFmt = DATE_FORMAT;
    row.alignment = { vertical: "top", wrapText: true };
  }

  sheet.autoFilter = { from: "A1", to: `P${rows.length + 1}` };
  return sheet;
}

interface InventoryExportRow {
  brand: string;
  name: string;
  initial_ml: number;
  current_ml: number;
  decants_sold: number;
  avg_cost_per_ml: number;
  cost_per_decant: number;
  selling_price_per_decant: number;
  profit_per_decant: number;
  status: string;
}

export function addInventorySheet(workbook: ExcelJS.Workbook, rows: InventoryExportRow[]) {
  const sheet = workbook.addWorksheet("Inventory", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = [
    { header: "Brand", key: "brand", width: 18 },
    { header: "Perfume", key: "name", width: 26 },
    { header: "Initial ML", key: "initial_ml", width: 14 },
    { header: "Remaining ML", key: "current_ml", width: 16 },
    { header: "Decants Sold", key: "decants_sold", width: 14 },
    { header: "Avg. Cost/ML", key: "avg_cost_per_ml", width: 14 },
    { header: "Cost/Decant", key: "cost_per_decant", width: 14 },
    { header: "Selling Price/Decant", key: "selling_price_per_decant", width: 18 },
    { header: "Profit/Decant", key: "profit_per_decant", width: 14 },
    { header: "Status", key: "status", width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const r of rows) {
    const row = sheet.addRow(r);
    for (const key of ["avg_cost_per_ml", "cost_per_decant", "selling_price_per_decant", "profit_per_decant"]) {
      row.getCell(key).numFmt = CURRENCY_FORMAT;
    }
  }

  sheet.autoFilter = { from: "A1", to: `J${rows.length + 1}` };
  return sheet;
}

interface ExpenseExportRow {
  expense_name: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string | null;
  related_product: string | null;
  created_by: string | null;
}

export function addExpensesSheet(workbook: ExcelJS.Workbook, rows: ExpenseExportRow[]) {
  const sheet = workbook.addWorksheet("Expenses", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = [
    { header: "Expense", key: "expense_name", width: 26 },
    { header: "Category", key: "category", width: 14 },
    { header: "Amount", key: "amount", width: 14 },
    { header: "Date", key: "date", width: 18 },
    { header: "Description", key: "description", width: 30 },
    { header: "Related Perfume", key: "related_product", width: 24 },
    { header: "Recorded By", key: "created_by", width: 22 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const r of rows) {
    const row = sheet.addRow({
      expense_name: r.expense_name,
      category: r.category,
      amount: r.amount,
      date: new Date(r.expense_date),
      description: r.description ?? "",
      related_product: r.related_product ?? "",
      created_by: r.created_by ?? "",
    });
    row.getCell("amount").numFmt = CURRENCY_FORMAT;
    row.getCell("date").numFmt = DATE_FORMAT;
  }

  sheet.autoFilter = { from: "A1", to: `G${rows.length + 1}` };
  return sheet;
}

interface ProfitByProductExportRow {
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number | null;
  profit: number | null;
}

export function addProfitByProductSheet(workbook: ExcelJS.Workbook, rows: ProfitByProductExportRow[]) {
  const sheet = workbook.addWorksheet("Profit by Product", { views: [{ state: "frozen", ySplit: 1 }] });

  sheet.columns = [
    { header: "Perfume", key: "product_name", width: 28 },
    { header: "Units Sold", key: "units_sold", width: 14 },
    { header: "Revenue", key: "revenue", width: 16 },
    { header: "Cost", key: "cost", width: 16 },
    { header: "Profit", key: "profit", width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const r of rows) {
    const row = sheet.addRow({
      product_name: r.product_name,
      units_sold: r.units_sold,
      revenue: r.revenue,
      cost: r.cost ?? "not tracked",
      profit: r.profit ?? "not tracked",
    });
    row.getCell("revenue").numFmt = CURRENCY_FORMAT;
    if (r.cost != null) row.getCell("cost").numFmt = CURRENCY_FORMAT;
    if (r.profit != null) row.getCell("profit").numFmt = CURRENCY_FORMAT;
  }

  sheet.autoFilter = { from: "A1", to: `E${rows.length + 1}` };
  return sheet;
}

export function addSummarySheet(
  workbook: ExcelJS.Workbook,
  summary: { label: string; value: string }[]
) {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [
    { header: "Metric", key: "label", width: 34 },
    { header: "Value", key: "value", width: 24 },
  ];
  styleHeaderRow(sheet.getRow(1));
  for (const s of summary) sheet.addRow(s);
  return sheet;
}

export function filenameFor(prefix: string, from?: Date, to?: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GH", { month: "long", year: "numeric", timeZone: "UTC" }).toLowerCase().replace(" ", "-");
  const label = from && to ? (fmt(from) === fmt(to) ? fmt(from) : `${fmt(from)}-to-${fmt(to)}`) : fmt(new Date());
  return `met-scents-${prefix}-${label}.xlsx`;
}
