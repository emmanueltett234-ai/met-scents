import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { getProductTypesForForm } from "@/lib/data/product-types";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) notFound();

  const productTypes = await getProductTypesForForm(product.product_type_id);

  return (
    <AdminShell title={`Edit: ${product.name}`}>
      <ProductForm product={product as Product} productTypes={productTypes} />
    </AdminShell>
  );
}
