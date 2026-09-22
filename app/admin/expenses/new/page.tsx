import { AdminShell } from "@/components/admin/admin-shell";
import { ExpenseForm } from "@/components/admin/expenses/expense-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const supabase = createClient();
  const { data: products } = await supabase.from("products").select("id, brand, name").order("brand");

  return (
    <AdminShell title="Add Expense">
      <ExpenseForm products={products ?? []} />
    </AdminShell>
  );
}
