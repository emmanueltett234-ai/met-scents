"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slugify } from "@/lib/utils";
import { GENDER_LABELS, AVAILABILITY_LABELS, type Product, type ProductType } from "@/types";

interface VariantRow {
  id?: string;
  size: string;
  price: string;
  availability: keyof typeof AVAILABILITY_LABELS;
  size_ml: string;
}

export function ProductForm({ product, productTypes }: { product?: Product; productTypes: ProductType[] }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [brand, setBrand] = useState(product?.brand ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(product?.description ?? "");
  const [notes, setNotes] = useState(product?.fragrance_notes ?? "");
  const [fragranceType, setFragranceType] = useState(product?.fragrance_type ?? "");
  const [gender, setGender] = useState(product?.gender ?? "unisex");
  const [productTypeId, setProductTypeId] = useState(product?.product_type_id ?? productTypes[0]?.id ?? "");
  const [availability, setAvailability] = useState(product?.availability ?? "available");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [newArrival, setNewArrival] = useState(product?.new_arrival ?? false);
  const [bestSeller, setBestSeller] = useState(product?.best_seller ?? false);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.product_variants && product.product_variants.length > 0
      ? product.product_variants.map((v) => ({
          id: v.id,
          size: v.size,
          price: String(v.price),
          availability: v.availability,
          size_ml: v.size_ml != null ? String(v.size_ml) : "",
        }))
      : [{ size: "10ml Decant", price: "", availability: "available", size_ml: "10" }]
  );
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(`${brand} ${value}`));
  }
  function handleBrandChange(value: string) {
    setBrand(value);
    if (!slugTouched) setSlug(slugify(`${value} ${name}`));
  }

  function updateVariant(i: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addVariant() {
    setVariants((rows) => [...rows, { size: "", price: "", availability: "available", size_ml: "" }]);
  }
  function removeVariant(i: number) {
    setVariants((rows) => rows.filter((_, idx) => idx !== i));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImageUrl(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      brand,
      name,
      slug,
      description,
      fragrance_notes: notes,
      fragrance_type: fragranceType,
      gender,
      product_type_id: productTypeId,
      image_url: imageUrl,
      featured,
      new_arrival: newArrival,
      best_seller: bestSeller,
      availability,
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size,
        price: v.price === "" ? 0 : Number(v.price),
        availability: v.availability,
        size_ml: v.size_ml === "" ? undefined : Number(v.size_ml),
      })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      toast.success(isEdit ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Brand *</Label>
          <Input id="brand" required className="mt-2" value={brand} onChange={(e) => handleBrandChange(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="name">Perfume Name *</Label>
          <Input id="name" required className="mt-2" value={name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          required
          className="mt-2"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">/products/{slug || "…"}</p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="notes">Fragrance Notes (comma separated)</Label>
          <Input id="notes" className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bergamot, Musk, Amber" />
        </div>
        <div>
          <Label htmlFor="type">Fragrance Type</Label>
          <Input id="type" className="mt-2" value={fragranceType} onChange={(e) => setFragranceType(e.target.value)} placeholder="Eau de Parfum" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label>Gender</Label>
          <Select value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Product Type</Label>
          <Select value={productTypeId} onValueChange={setProductTypeId}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {productTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {!t.is_active ? " (Inactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Availability</Label>
          <Select value={availability} onValueChange={(v) => setAvailability(v as typeof availability)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        {[
          ["Featured", featured, setFeatured],
          ["New Arrival", newArrival, setNewArrival],
          ["Best Seller", bestSeller, setBestSeller],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="flex items-center gap-3">
            <Switch checked={value as boolean} onCheckedChange={setter as (v: boolean) => void} />
            <span className="text-sm">{label as string}</span>
          </label>
        ))}
      </div>

      <div>
        <Label>Product Image</Label>
        <div className="mt-2 flex items-center gap-4">
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={80} height={80} className="h-20 w-20 rounded-sm border border-border object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center border border-dashed border-border text-xs text-muted-foreground">
              No image
            </div>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex h-10 items-center gap-2 border border-ink/70 px-4 text-xs uppercase tracking-widest2 hover:bg-ink hover:text-cream">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {imageUrl ? "Replace" : "Upload"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
          </label>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label>Sizes &amp; Prices (GHS) *</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addVariant}>
            <Plus className="h-3.5 w-3.5" /> Add Size
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Set "ml" for any size that draws from tracked inventory (e.g. a 10ml decant) so recording a sale of it deducts juice
          automatically. Leave it blank for sizes with no inventory tracking (bundles, etc).
        </p>
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_0.8fr_1fr_auto] items-end gap-3">
              <div>
                {i === 0 && <Label className="mb-1 block">Size</Label>}
                <Input required value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })} placeholder="10ml Decant" />
              </div>
              <div>
                {i === 0 && <Label className="mb-1 block">Price (GH₵)</Label>}
                <Input required type="number" min="0" step="0.01" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} />
              </div>
              <div>
                {i === 0 && <Label className="mb-1 block">ml</Label>}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.size_ml}
                  onChange={(e) => updateVariant(i, { size_ml: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                {i === 0 && <Label className="mb-1 block">Availability</Label>}
                <Select value={v.availability} onValueChange={(val) => updateVariant(i, { availability: val as VariantRow["availability"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVariant(i)}
                disabled={variants.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="gold" size="lg" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
