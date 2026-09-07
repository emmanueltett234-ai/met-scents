import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryManager } from "@/components/admin/category-manager";
import { getCategories } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return (
    <AdminShell title="Categories">
      <CategoryManager categories={categories} />
    </AdminShell>
  );
}
