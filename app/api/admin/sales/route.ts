import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { saleInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  date_desc: { column: "sale_date", ascending: false },
  date_asc: { column: "sale_date", ascending: true },
  amount_desc: { column: "sale_amount", ascending: false },
  amount_asc: { column: "sale_amount", ascending: true },
};

// GET /api/admin/sales — list sales with search/filter/sort/pagination.
// This is the only real source of confirmed revenue in the system; it never
// reads from enquiries.estimated_total.
export async function GET(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const params = req.nextUrl.searchParams;

  const search = params.get("search")?.trim();
  const source = params.get("source");
  const paymentMethod = params.get("payment_method");
  const from = params.get("from"); // ISO date
  const to = params.get("to"); // ISO date
  const sort = SORT_MAP[params.get("sort") ?? ""] ?? SORT_MAP.date_desc;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 25));

  let query = supabase.from("sales").select("*, sale_items(*)", { count: "exact" });

  if (search) {
    // Search customer name, WhatsApp number, or sale id.
    query = query.or(`customer_name.ilike.%${search}%,whatsapp_number.ilike.%${search}%,id.eq.${search}`);
  }
  if (source) query = query.eq("source", source);
  if (paymentMethod) query = query.eq("payment_method", paymentMethod);
  if (from) query = query.gte("sale_date", from);
  if (to) query = query.lte("sale_date", to);

  query = query.order(sort.column, { ascending: sort.ascending });
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sales: data ?? [], total: count ?? 0, page, pageSize });
}

// POST /api/admin/sales — record a new sale. May or may not reference an
// enquiry. Never assumes the sale covers everything the linked enquiry
// requested; sale_amount and items are exactly what the admin enters here.
export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = saleInputSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please check the form and try again.", fieldErrors }, { status: 400 });
  }

  const input = parsed.data;
  const supabase = createClient();

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      enquiry_id: input.enquiry_id ?? null,
      customer_name: input.customer_name,
      whatsapp_number: input.whatsapp_number ?? null,
      sale_date: (input.sale_date ?? new Date()).toISOString(),
      source: input.source,
      payment_method: input.payment_method,
      sale_amount: input.sale_amount,
      notes: input.notes ?? null,
      created_by: user!.email,
    })
    .select()
    .single();

  if (saleError || !sale) {
    return NextResponse.json({ error: saleError?.message ?? "Failed to record sale." }, { status: 500 });
  }

  let saleItems: unknown[] = [];
  if (input.items.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .insert(
        input.items.map((item) => ({
          sale_id: sale.id,
          product_id: item.product_id ?? null,
          product_name_snapshot: item.product_name_snapshot,
          brand_snapshot: item.brand_snapshot ?? null,
          size_snapshot: item.size_snapshot,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.quantity * item.unit_price,
        }))
      )
      .select();

    if (itemsError) {
      console.error("Failed to save sale items:", itemsError.message);
    } else {
      saleItems = items ?? [];
    }
  }

  // Timeline entry — only written if this sale is linked to a real enquiry.
  // Never changes the enquiry's outcome automatically; that stays an
  // explicit, separate admin action.
  if (input.enquiry_id) {
    await supabase.from("enquiry_activities").insert({
      enquiry_id: input.enquiry_id,
      event_type: "sale_created",
      metadata: { sale_id: sale.id, sale_amount: input.sale_amount },
      created_by: user!.email,
    });
  }

  return NextResponse.json({ sale: { ...sale, sale_items: saleItems } }, { status: 201 });
}
