import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ExpenseForm } from "@/components/admin/expenses/expense-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: expense }, { data: products }] = await Promise.all([
    supabase.from("business_expenses").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("products").select("id, brand, name").order("brand"),
  ]);

  if (!expense) notFound();

  return (
    <AdminShell title="Edit Expense">
      <ExpenseForm expense={expense} products={products ?? []} />
    </AdminShell>
  );
}
