"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatGHS } from "@/lib/currency";
import { SALE_SOURCE_LABELS, PAYMENT_METHOD_LABELS, type Sale, type SaleSource, type PaymentMethod } from "@/types";

interface ProductOption {
  id: string;
  brand: string;
  name: string;
  product_variants?: { id: string; size: string; price: number }[];
}

interface LineItemRow {
  product_id: string | null;
  product_name_snapshot: string;
  brand_snapshot: string;
  size_snapshot: string;
  quantity: number;
  unit_price: number;
}

export function SaleForm({
  products,
  sale,
  prefill,
}: {
  products: ProductOption[];
  sale?: Sale;
  prefill?: {
    enquiryId: string;
    customerName: string;
    whatsappNumber: string;
    items: { product_id: string | null; product_name: string; brand: string; size: string; price: number; quantity: number }[];
  };
}) {
  const router = useRouter();
  const isEdit = Boolean(sale);

  const [customerName, setCustomerName] = useState(sale?.customer_name ?? prefill?.customerName ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(sale?.whatsapp_number ?? prefill?.whatsappNumber ?? "");
  const [saleDate, setSaleDate] = useState(
    sale?.sale_date ? sale.sale_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [source, setSource] = useState<SaleSource>(sale?.source ?? (prefill ? "website" : "whatsapp"));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale?.payment_method ?? "mobile_money");
  const [notes, setNotes] = useState(sale?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const initialItems: LineItemRow[] = sale?.sale_items
    ? sale.sale_items.map((i) => ({
        product_id: i.product_id,
        product_name_snapshot: i.product_name_snapshot,
        brand_snapshot: i.brand_snapshot ?? "",
        size_snapshot: i.size_snapshot,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }))
    : prefill
    ? prefill.items.map((i) => ({
        product_id: i.product_id,
        product_name_snapshot: i.product_name,
        brand_snapshot: i.brand,
        size_snapshot: i.size,
        quantity: i.quantity,
        unit_price: i.price,
      }))
    : [];

  const [items, setItems] = useState<LineItemRow[]>(initialItems);
  const computedTotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0), [items]);
  const [saleAmount, setSaleAmount] = useState(sale ? String(sale.sale_amount) : computedTotal ? String(computedTotal) : "");
  const [amountTouched, setAmountTouched] = useState(Boolean(sale));

  function syncAmountFromItems(nextItems: LineItemRow[]) {
    if (!amountTouched) {
      const total = nextItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
      setSaleAmount(total ? String(Math.round(total * 100) / 100) : "");
    }
  }

  function updateItem(i: number, patch: Partial<LineItemRow>) {
    setItems((rows) => {
      const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
      syncAmountFromItems(next);
      return next;
    });
  }

  function selectProductForRow(i: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    const firstVariant = product?.product_variants?.[0];
    updateItem(i, {
      product_id: productId,
      product_name_snapshot: product?.name ?? "",
      brand_snapshot: product?.brand ?? "",
      size_snapshot: firstVariant?.size ?? "",
      unit_price: firstVariant?.price ?? 0,
    });
  }

  function addItem() {
    setItems((rows) => [...rows, { product_id: null, product_name_snapshot: "", brand_snapshot: "", size_snapshot: "", quantity: 1, unit_price: 0 }]);
  }
  function removeItem(i: number) {
    setItems((rows) => {
      const next = rows.filter((_, idx) => idx !== i);
      syncAmountFromItems(next);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!saleAmount || Number(saleAmount) < 0) {
      toast.error("Enter a valid sale amount");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        enquiry_id: sale?.enquiry_id ?? prefill?.enquiryId ?? null,
        customer_name: customerName.trim(),
        whatsapp_number: whatsappNumber.trim() || undefined,
        sale_date: new Date(saleDate).toISOString(),
        source,
        payment_method: paymentMethod,
        sale_amount: Number(saleAmount),
        notes: notes.trim() || undefined,
        items: items
          .filter((i) => i.product_name_snapshot.trim() && i.size_snapshot.trim())
          .map((i) => ({
            product_id: i.product_id,
            product_name_snapshot: i.product_name_snapshot.trim(),
            brand_snapshot: i.brand_snapshot.trim() || undefined,
            size_snapshot: i.size_snapshot.trim(),
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
      };

      const res = await fetch(isEdit ? `/api/admin/sales/${sale!.id}` : "/api/admin/sales", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sale");

      toast.success(isEdit ? "Sale updated" : "Sale recorded");
      router.push(`/admin/sales/${data.sale.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {prefill && (
        <div className="border border-accent/30 bg-accent/5 p-4 text-sm text-accent-dark">
          Linked to enquiry from {prefill.customerName || "this customer"}. The enquiry&apos;s requested items are
          pre-filled below, but you can add, remove, or change them to match what was actually sold.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="customer_name">Customer Name *</Label>
          <Input id="customer_name" required className="mt-2" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
          <Input id="whatsapp_number" className="mt-2" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="sale_date">Sale Date *</Label>
          <Input id="sale_date" type="date" required className="mt-2" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
        </div>
        <div>
          <Label>Source *</Label>
          <Select value={source} onValueChange={(v) => setSource(v as SaleSource)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SALE_SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Payment Method *</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sale_amount">Sale Amount (GH₵) *</Label>
          <Input
            id="sale_amount"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-2"
            value={saleAmount}
            onChange={(e) => {
              setAmountTouched(true);
              setSaleAmount(e.target.value);
            }}
          />
          {items.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Items total {formatGHS(computedTotal)}; override this field for discounts or adjustments.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Items Sold (optional detail)</Label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No line items added. This sale will be recorded as a single lump amount with no per-product breakdown.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2 border border-border p-3">
                <div className="min-w-0 flex-1">
                  <Label className="text-xs">Product</Label>
                  <select
                    className="mt-1 w-full border border-border bg-white px-2 py-2 text-sm"
                    value={item.product_id ?? ""}
                    onChange={(e) => (e.target.value ? selectProductForRow(i, e.target.value) : updateItem(i, { product_id: null }))}
                  >
                    <option value="">Custom item…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.brand} - {p.name}</option>
                    ))}
                  </select>
                  {!item.product_id && (
                    <Input
                      className="mt-1"
                      placeholder="Product name"
                      value={item.product_name_snapshot}
                      onChange={(e) => updateItem(i, { product_name_snapshot: e.target.value })}
                    />
                  )}
                </div>
                <div className="w-28">
                  <Label className="text-xs">Size</Label>
                  {item.product_id ? (
                    <select
                      className="mt-1 w-full border border-border bg-white px-2 py-2 text-sm"
                      value={item.size_snapshot}
                      onChange={(e) => {
                        const product = products.find((p) => p.id === item.product_id);
                        const variant = product?.product_variants?.find((v) => v.size === e.target.value);
                        updateItem(i, { size_snapshot: e.target.value, unit_price: variant?.price ?? item.unit_price });
                      }}
                    >
                      {(products.find((p) => p.id === item.product_id)?.product_variants ?? []).map((v) => (
                        <option key={v.id} value={v.size}>{v.size}</option>
                      ))}
                    </select>
                  ) : (
                    <Input className="mt-1" value={item.size_snapshot} onChange={(e) => updateItem(i, { size_snapshot: e.target.value })} />
                  )}
                </div>
                <div className="w-20">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                <div className="w-28">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unit_price}
                    onChange={(e) => updateItem(i, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} aria-label="Remove item">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isEdit ? "Save Changes" : "Record Sale"}
      </Button>
    </form>
  );
}
