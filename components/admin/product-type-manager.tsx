"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { slugify } from "@/lib/utils";
import type { ProductTypeWithCount } from "@/lib/data/product-types";

async function callApi(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export function ProductTypeManager({ productTypes }: { productTypes: ProductTypeWithCount[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await callApi("/api/admin/product-types", "POST", {
        name,
        slug: slugify(name),
        description,
      });
      toast.success("Product type added");
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(t: ProductTypeWithCount) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditDescription(t.description ?? "");
    setEditSortOrder(String(t.sort_order));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await callApi(`/api/admin/product-types/${id}`, "PATCH", {
        name: editName,
        slug: slugify(editName),
        description: editDescription,
        sort_order: Number(editSortOrder) || 0,
      });
      toast.success("Product type updated");
      setEditingId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: ProductTypeWithCount) {
    if (t.is_active && productTypes.filter((p) => p.is_active).length <= 1) {
      toast.error("At least one product type must stay active");
      return;
    }
    setBusyId(t.id);
    try {
      await callApi(`/api/admin/product-types/${t.id}`, "PATCH", { is_active: !t.is_active });
      toast.success(t.is_active ? `${t.name} deactivated` : `${t.name} reactivated`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(t: ProductTypeWithCount) {
    setBusyId(t.id);
    try {
      await callApi(`/api/admin/product-types/${t.id}`, "DELETE");
      toast.success(`${t.name} deleted`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleCreate} className="grid max-w-xl gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <Label htmlFor="pt-name">Product Type Name</Label>
          <Input
            id="pt-name"
            className="mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Candles"
          />
        </div>
        <div>
          <Label htmlFor="pt-desc">Description (optional)</Label>
          <Input id="pt-desc" className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="gold" disabled={creating} className="w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productTypes.map((t) => {
              const isEditing = editingId === t.id;
              const isBusy = busyId === t.id;
              return (
                <TableRow key={t.id}>
                  {isEditing ? (
                    <>
                      <TableCell>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                        <div className="mt-2 flex items-center gap-2">
                          <Label htmlFor={`sort-${t.id}`} className="text-xs text-muted-foreground">
                            Sort order
                          </Label>
                          <Input
                            id={`sort-${t.id}`}
                            type="number"
                            value={editSortOrder}
                            onChange={(e) => setEditSortOrder(e.target.value)}
                            className="h-8 w-20"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{slugify(editName)}</TableCell>
                      <TableCell>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.productCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={t.is_active}
                            onCheckedChange={() => toggleActive(t)}
                            disabled={isBusy}
                          />
                          <Badge variant={t.is_active ? "success" : "muted"}>
                            {t.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => saveEdit(t.id)} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEdit} disabled={saving}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.slug}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.description || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {t.productCount} product{t.productCount === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={t.is_active}
                            onCheckedChange={() => toggleActive(t)}
                            disabled={isBusy}
                          />
                          <Badge variant={t.is_active ? "success" : "muted"}>
                            {t.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(t)} disabled={isBusy}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(t)}
                            disabled={isBusy || t.productCount > 0}
                            title={
                              t.productCount > 0
                                ? "Reassign or deactivate before deleting"
                                : "Delete this product type"
                            }
                          >
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
