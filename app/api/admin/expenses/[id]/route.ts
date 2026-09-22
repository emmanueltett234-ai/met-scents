import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/route-auth";
import { businessExpenseInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { data: expense, error } = await supabase
    .from("business_expenses")
    .select("*, products(brand, name)")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  return NextResponse.json({ expense });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
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
    .update({
      expense_name: input.expense_name,
      category: input.category,
      amount: input.amount,
      expense_date: (input.expense_date ?? new Date()).toISOString(),
      description: input.description ?? null,
      related_product_id: input.related_product_id ?? null,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !expense) {
    return NextResponse.json({ error: error?.message ?? "Failed to update expense." }, { status: 500 });
  }

  return NextResponse.json({ expense });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createClient();
  const { error } = await supabase.from("business_expenses").delete().eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
