"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ProductInventory } from "@/types";

export function InventorySetupForm({ productId, inventory }: { productId: string; inventory: ProductInventory | null }) {
  const router = useRouter();
  const isEdit = Boolean(inventory);

  const [bottleSizeMl, setBottleSizeMl] = useState(inventory ? String(inventory.bottle_size_ml) : "");
  const [decantSizeMl, setDecantSizeMl] = useState(inventory ? String(inventory.decant_size_ml) : "10");
  // Only used on first setup — it becomes the first restock automatically,
  // so there's no separate "Restock" click needed to log the initial bottle.
  const [costOfPerfume, setCostOfPerfume] = useState("");
  const [pouchCost, setPouchCost] = useState(inventory ? String(inventory.pouch_cost) : "0");
  const [sellingPrice, setSellingPrice] = useState(inventory ? String(inventory.selling_price_per_decant) : "");
  const [threshold, setThreshold] = useState(inventory?.low_stock_threshold_ml != null ? String(inventory.low_stock_threshold_ml) : "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const bottleSize = bottleSizeMl === "" ? 0 : Number(bottleSizeMl);
    const payload = {
      product_id: productId,
      bottle_size_ml: bottleSize,
      decant_size_ml: decantSizeMl === "" ? 10 : Number(decantSizeMl),
      pouch_cost: Number(pouchCost) || 0,
      selling_price_per_decant: sellingPrice === "" ? 0 : Number(sellingPrice),
      low_stock_threshold_ml: threshold === "" ? null : Number(threshold),
      // These fields no longer have inputs on this form, but PATCH replaces
      // every cost column unconditionally — pass the existing values through
      // untouched so editing an already-tracked perfume can never silently
      // zero out a cost it had saved before this form was simplified.
      ...(inventory && {
        atomizer_cost: inventory.atomizer_cost,
        label_cost: inventory.label_cost,
        packaging_cost: inventory.packaging_cost,
        shipping_cost: inventory.shipping_cost,
        other_cost: inventory.other_cost,
      }),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/inventory/${productId}` : "/api/admin/inventory", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save inventory settings");

      if (!isEdit) {
        // Fold the perfume's own cost into setup: the bottle just
        // configured above becomes the first restock, so nothing has to be
        // added separately via the Restock button to have real stock.
        const restockRes = await fetch(`/api/admin/inventory/${productId}/purchases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bottle_size_ml: bottleSize,
            ml_added: bottleSize,
            cost_price: costOfPerfume === "" ? 0 : Number(costOfPerfume),
            purchase_date: new Date().toISOString(),
            notes: "Initial stock (added during setup)",
          }),
        });
        if (!restockRes.ok) {
          const restockData = await restockRes.json().catch(() => ({}));
          throw new Error(restockData.error || "Inventory was set up, but adding the initial stock failed — restock it manually below.");
        }
      }

      toast.success(isEdit ? "Inventory settings updated" : "Inventory set up with its first stock");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {!isEdit && (
        <p className="text-sm text-muted-foreground">
          Set the bottle/decant sizes and what you paid for this bottle — saving logs it as your first stock, no
          separate restock needed. Use the "Restock" button later for any bottle you buy after this one.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="bottle_size_ml">Bottle Size Purchased (ml) *</Label>
          <Input
            id="bottle_size_ml"
            required
            type="number"
            min="0"
            step="0.01"
            className="mt-2"
            value={bottleSizeMl}
            onChange={(e) => setBottleSizeMl(e.target.value)}
            placeholder="100"
          />
        </div>
        <div>
          <Label htmlFor="decant_size_ml">Decant Size (ml) *</Label>
          <Input
            id="decant_size_ml"
            required
            type="number"
            min="0"
            step="0.01"
            className="mt-2"
            value={decantSizeMl}
            onChange={(e) => setDecantSizeMl(e.target.value)}
            placeholder="10"
          />
        </div>
      </div>

      {!isEdit && (
        <div>
          <Label htmlFor="cost_of_perfume">Cost of This Bottle (GH₵) *</Label>
          <Input
            id="cost_of_perfume"
            required
            type="number"
            min="0"
            step="0.01"
            className="mt-2 max-w-xs"
            value={costOfPerfume}
            onChange={(e) => setCostOfPerfume(e.target.value)}
            placeholder="What you paid for it"
          />
        </div>
      )}

      <div>
        <Label htmlFor="selling_price">Selling Price Per Decant (GH₵) *</Label>
        <Input
          id="selling_price"
          required
          type="number"
          min="0"
          step="0.01"
          className="mt-2 max-w-xs"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="pouch_cost">Pouch/Box Cost Per Decant (GH₵)</Label>
        <Input
          id="pouch_cost"
          type="number"
          min="0"
          step="0.01"
          className="mt-2 max-w-xs"
          value={pouchCost}
          onChange={(e) => setPouchCost(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="threshold">Low-Stock Threshold Override (ml)</Label>
        <Input
          id="threshold"
          type="number"
          min="0"
          step="0.01"
          className="mt-2 max-w-xs"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="Leave blank to use the shop-wide default"
        />
      </div>

      <Button type="submit" variant="gold" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isEdit ? "Save Changes" : "Set Up Inventory"}
      </Button>
    </form>
  );
}
