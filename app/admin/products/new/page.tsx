import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <AdminShell title="Add Product">
      <ProductForm categories={categories} />
    </AdminShell>
  );
}
