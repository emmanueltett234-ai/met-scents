import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductTable } from "@/components/admin/product-table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_variants(*), product_types(*)")
    .order("created_at", { ascending: false });

  return (
    <AdminShell
      title="Products"
      action={
        <Button asChild variant="gold">
          <Link href="/admin/products/new"><Plus className="h-4 w-4" /> Add Product</Link>
        </Button>
      }
    >
      {!products || products.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No products yet. Click &ldquo;Add Product&rdquo; to create your first listing.
        </p>
      ) : (
        <ProductTable products={products as Product[]} />
      )}
    </AdminShell>
  );
}
