import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/data/categories";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: product }, categories] = await Promise.all([
    supabase.from("products").select("*, product_variants(*)").eq("id", params.id).maybeSingle(),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <AdminShell title={`Edit: ${product.name}`}>
      <ProductForm product={product as Product} categories={categories} />
    </AdminShell>
  );
}
