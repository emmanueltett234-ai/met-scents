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
import { GENDER_LABELS, type Product } from "@/types";

export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      toast.success(`${target.name} deleted`);
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
            <TableHead>Product</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const prices = (p.product_variants ?? []).map((v) => v.price);
            const min = prices.length ? Math.min(...prices) : null;
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="text-xs text-muted-foreground">{p.brand}</p>
                  <p className="font-serif text-base">{p.name}</p>
                </TableCell>
                <TableCell className="text-sm">{GENDER_LABELS[p.gender]}</TableCell>
                <TableCell className="text-sm">{min !== null ? `from ${formatGHS(min)}` : "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {p.featured && <Badge variant="gold">Featured</Badge>}
                    {p.new_arrival && <Badge variant="outline">New</Badge>}
                    {p.best_seller && <Badge variant="outline">Best Seller</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-sm capitalize">{p.availability.replace("_", " ")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/admin/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setTarget(p)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {target?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the product and its sizes/prices. This can&apos;t be undone —
              consider marking it &ldquo;Out of Stock&rdquo; instead if you just want to hide it
              temporarily.
            </DialogDescription>
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
