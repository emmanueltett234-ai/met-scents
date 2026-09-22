"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { formatGHS } from "@/lib/currency";
import { EXPENSE_CATEGORY_LABELS, type BusinessExpense, type ExpenseCategory } from "@/types";

type ExpenseRow = BusinessExpense & { products?: { brand: string; name: string } | null };

export function ExpenseTable({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<ExpenseRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/expenses/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      toast.success(`${target.expense_name} deleted`);
      setTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Expense</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Related Perfume</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <p className="font-medium">{e.expense_name}</p>
                {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
              </TableCell>
              <TableCell><Badge variant="outline">{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory]}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {e.products ? `${e.products.brand} - ${e.products.name}` : "-"}
              </TableCell>
              <TableCell className="text-sm">{formatGHS(Number(e.amount))}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(e.expense_date).toLocaleDateString("en-GH", { dateStyle: "medium" })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/admin/expenses/${e.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setTarget(e)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {target?.expense_name}?</DialogTitle>
            <DialogDescription>This permanently removes the expense record. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
