import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { businessExpenseInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  date_desc: { column: "expense_date", ascending: false },
  date_asc: { column: "expense_date", ascending: true },
  amount_desc: { column: "amount", ascending: false },
  amount_asc: { column: "amount", ascending: true },
};

// GET /api/admin/expenses — list with search/filter/sort/pagination,
// mirroring app/api/admin/sales/route.ts.
export async function GET(req: NextRequest) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const params = req.nextUrl.searchParams;

  const search = params.get("search")?.trim();
  const category = params.get("category");
  const from = params.get("from");
  const to = params.get("to");
  const sort = SORT_MAP[params.get("sort") ?? ""] ?? SORT_MAP.date_desc;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 25));

  let query = supabase.from("business_expenses").select("*, products(brand, name)", { count: "exact" });

  if (search) query = query.ilike("expense_name", `%${search}%`);
  if (category) query = query.eq("category", category);
  if (from) query = query.gte("expense_date", from);
  if (to) query = query.lte("expense_date", to);

  query = query.order(sort.column, { ascending: sort.ascending });
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ expenses: data ?? [], total: count ?? 0, page, pageSize });
}

// POST /api/admin/expenses — record a new expense.
export async function POST(req: NextRequest) {
  const { user, response: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  const parsed = businessExpenseInputSchema.safeParse(body);
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

  const { data: expense, error } = await supabase
    .from("business_expenses")
    .insert({
      expense_name: input.expense_name,
      category: input.category,
      amount: input.amount,
      expense_date: (input.expense_date ?? new Date()).toISOString(),
      description: input.description ?? null,
      related_product_id: input.related_product_id ?? null,
      created_by: user!.email,
    })
    .select()
    .single();

  if (error || !expense) {
    return NextResponse.json({ error: error?.message ?? "Failed to record expense." }, { status: 500 });
  }

  return NextResponse.json({ expense }, { status: 201 });
}
