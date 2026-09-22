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
  const [atomizerCost, setAtomizerCost] = useState(inventory ? String(inventory.atomizer_cost) : "0");
  const [labelCost, setLabelCost] = useState(inventory ? String(inventory.label_cost) : "0");
  const [packagingCost, setPackagingCost] = useState(inventory ? String(inventory.packaging_cost) : "0");
  const [pouchCost, setPouchCost] = useState(inventory ? String(inventory.pouch_cost) : "0");
  const [shippingCost, setShippingCost] = useState(inventory ? String(inventory.shipping_cost) : "0");
  const [otherCost, setOtherCost] = useState(inventory ? String(inventory.other_cost) : "0");
  const [sellingPrice, setSellingPrice] = useState(inventory ? String(inventory.selling_price_per_decant) : "");
  const [threshold, setThreshold] = useState(inventory?.low_stock_threshold_ml != null ? String(inventory.low_stock_threshold_ml) : "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      product_id: productId,
      bottle_size_ml: bottleSizeMl === "" ? 0 : Number(bottleSizeMl),
      decant_size_ml: decantSizeMl === "" ? 10 : Number(decantSizeMl),
      atomizer_cost: Number(atomizerCost) || 0,
      label_cost: Number(labelCost) || 0,
      packaging_cost: Number(packagingCost) || 0,
      pouch_cost: Number(pouchCost) || 0,
      shipping_cost: Number(shippingCost) || 0,
      other_cost: Number(otherCost) || 0,
      selling_price_per_decant: sellingPrice === "" ? 0 : Number(sellingPrice),
      low_stock_threshold_ml: threshold === "" ? null : Number(threshold),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/inventory/${productId}` : "/api/admin/inventory", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save inventory settings");

      toast.success(isEdit ? "Inventory settings updated" : "Inventory tracking set up — record a restock below to add stock");
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
          Set the bottle/decant sizes and costs for this perfume. This doesn&apos;t add any stock yet — after saving,
          record your first restock below.
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
        <Label className="mb-2 block">Additional Cost Per Decant (GH₵)</Label>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Atomizer", atomizerCost, setAtomizerCost],
            ["Label", labelCost, setLabelCost],
            ["Packaging", packagingCost, setPackagingCost],
            ["Pouch/Box", pouchCost, setPouchCost],
            ["Shipping", shippingCost, setShippingCost],
            ["Other", otherCost, setOtherCost],
          ].map(([label, value, setter]) => (
            <div key={label as string}>
              <Label className="text-xs text-muted-foreground">{label as string}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="mt-1"
                value={value as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              />
            </div>
          ))}
        </div>
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
