"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PackagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RestockForm({ productId, defaultBottleSizeMl }: { productId: string; defaultBottleSizeMl: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bottleSizeMl, setBottleSizeMl] = useState(String(defaultBottleSizeMl || ""));
  const [mlAdded, setMlAdded] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bottle_size_ml: Number(bottleSizeMl) || 0,
          ml_added: Number(mlAdded) || 0,
          cost_price: Number(costPrice) || 0,
          purchase_date: new Date(purchaseDate).toISOString(),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record restock");

      toast.success(`Restocked ${mlAdded}ml`);
      setOpen(false);
      setMlAdded("");
      setCostPrice("");
      setNotes("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" size="sm">
          <PackagePlus className="h-4 w-4" /> Restock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a Restock</DialogTitle>
          <DialogDescription>Adds to remaining ml and rolls the cost into the weighted-average cost per ml.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="restock_bottle_size">Bottle Size (ml) *</Label>
              <Input
                id="restock_bottle_size"
                required
                type="number"
                min="0"
                step="0.01"
                className="mt-1"
                value={bottleSizeMl}
                onChange={(e) => setBottleSizeMl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="restock_ml_added">ML Added *</Label>
              <Input
                id="restock_ml_added"
                required
                type="number"
                min="0"
                step="0.01"
                className="mt-1"
                value={mlAdded}
                onChange={(e) => setMlAdded(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="restock_cost">Cost Price (GH₵) *</Label>
              <Input
                id="restock_cost"
                required
                type="number"
                min="0"
                step="0.01"
                className="mt-1"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="restock_date">Purchase Date *</Label>
              <Input
                id="restock_date"
                required
                type="date"
                className="mt-1"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="restock_notes">Notes</Label>
            <Textarea id="restock_notes" className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
