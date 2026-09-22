"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_NAME_SUGGESTIONS, type BusinessExpense, type ExpenseCategory } from "@/types";

interface ProductOption {
  id: string;
  brand: string;
  name: string;
}

export function ExpenseForm({ expense, products }: { expense?: BusinessExpense; products: ProductOption[] }) {
  const router = useRouter();
  const isEdit = Boolean(expense);

  const [expenseName, setExpenseName] = useState(expense?.expense_name ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "marketing");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date ? expense.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [relatedProductId, setRelatedProductId] = useState(expense?.related_product_id ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseName.trim()) {
      toast.error("Expense name is required");
      return;
    }
    if (!amount || Number(amount) < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        expense_name: expenseName.trim(),
        category,
        amount: Number(amount),
        expense_date: new Date(expenseDate).toISOString(),
        description: description.trim() || undefined,
        related_product_id: relatedProductId || null,
      };

      const res = await fetch(isEdit ? `/api/admin/expenses/${expense!.id}` : "/api/admin/expenses", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save expense");

      toast.success(isEdit ? "Expense updated" : "Expense recorded");
      router.push("/admin/expenses");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <Label htmlFor="expense_name">Expense Name *</Label>
        <Input
          id="expense_name"
          required
          list="expense-name-suggestions"
          className="mt-2"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
          placeholder="Meta/Facebook Ads"
        />
        <datalist id="expense-name-suggestions">
          {EXPENSE_NAME_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Category *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amount">Amount (GH₵) *</Label>
          <Input id="amount" required type="number" min="0" step="0.01" className="mt-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="expense_date">Date *</Label>
          <Input id="expense_date" required type="date" className="mt-2" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
        </div>
        <div>
          <Label>Related Perfume (optional)</Label>
          <Select value={relatedProductId || "none"} onValueChange={(v) => setRelatedProductId(v === "none" ? "" : v)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.brand} - {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <Button type="submit" variant="gold" size="lg" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isEdit ? "Save Changes" : "Record Expense"}
      </Button>
    </form>
  );
}
