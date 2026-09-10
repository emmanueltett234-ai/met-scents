import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { getProductTypesForForm } from "@/lib/data/product-types";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const productTypes = await getProductTypesForForm();
  return (
    <AdminShell title="Add Product">
      <ProductForm productTypes={productTypes} />
    </AdminShell>
  );
}
