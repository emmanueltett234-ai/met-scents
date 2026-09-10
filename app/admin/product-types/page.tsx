import { AdminShell } from "@/components/admin/admin-shell";
import { ProductTypeManager } from "@/components/admin/product-type-manager";
import { getProductTypesWithCounts } from "@/lib/data/product-types";

export const dynamic = "force-dynamic";

export default async function AdminProductTypesPage() {
  const productTypes = await getProductTypesWithCounts();
  return (
    <AdminShell title="Product Types">
      <ProductTypeManager productTypes={productTypes} />
    </AdminShell>
  );
}
