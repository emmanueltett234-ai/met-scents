import Link from "next/link";
import { Plus, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ExpenseFilters } from "@/components/admin/expenses/expense-filters";
import { ExpenseTable } from "@/components/admin/expenses/expense-table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatGHS } from "@/lib/currency";
import type { BusinessExpense } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface SearchParams {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
}

export default async function AdminExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);

  let query = supabase.from("business_expenses").select("*, products(brand, name)", { count: "exact" });

  if (searchParams.search) query = query.ilike("expense_name", `%${searchParams.search.trim()}%`);
  if (searchParams.category) query = query.eq("category", searchParams.category);
  if (searchParams.from) query = query.gte("expense_date", searchParams.from);
  if (searchParams.to) {
    const toDate = new Date(searchParams.to);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    query = query.lt("expense_date", toDate.toISOString().slice(0, 10));
  }

  const sort = searchParams.sort ?? "date_desc";
  if (sort === "date_asc") query = query.order("expense_date", { ascending: true });
  else if (sort === "amount_desc") query = query.order("amount", { ascending: false });
  else if (sort === "amount_asc") query = query.order("amount", { ascending: true });
  else query = query.order("expense_date", { ascending: false });

  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: expenses, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageTotal = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(p));
    return `/admin/expenses?${params.toString()}`;
  }

  const exportHref = (() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    return `/api/admin/export/expenses?${params.toString()}`;
  })();

  return (
    <AdminShell
      title="Expenses"
      description="Marketing, branding, and operating costs, kept separate from product cost so gross profit and net profit never get confused."
      action={
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><a href={exportHref}><FileSpreadsheet className="h-4 w-4" /> Export</a></Button>
          <Button asChild size="sm"><Link href="/admin/expenses/new"><Plus className="h-4 w-4" /> Add Expense</Link></Button>
        </div>
      }
    >
      <ExpenseFilters />

      <p className="mb-3 text-xs text-muted-foreground">
        {total} expense{total === 1 ? "" : "s"} found{expenses && expenses.length > 0 ? ` (${formatGHS(pageTotal)} on this page)` : ""}
      </p>

      {!expenses || expenses.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No expenses recorded yet.</p>
      ) : (
        <>
          <ExpenseTable expenses={expenses as unknown as (BusinessExpense & { products: { brand: string; name: string } | null })[]} />

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Link href={pageHref(Math.max(1, page - 1))} className={`flex items-center gap-1 border border-border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-ink"}`}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Link>
                <Link href={pageHref(Math.min(totalPages, page + 1))} className={`flex items-center gap-1 border border-border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-ink"}`}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
