import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { SaleForm } from "@/components/admin/sales/sale-form";
import { DeleteSaleButton } from "@/components/admin/sales/delete-sale-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: sale }, { data: products }, { data: trackedInventory }] = await Promise.all([
    supabase.from("sales").select("*, sale_items(*)").eq("id", params.id).maybeSingle(),
    supabase.from("products").select("id, brand, name, product_variants(id, size, price, size_ml)").order("brand"),
    supabase.from("product_inventory").select("product_id"),
  ]);

  if (!sale) notFound();

  return (
    <AdminShell title="Sale Detail">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/sales" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to Sales
        </Link>
        <DeleteSaleButton saleId={sale.id} customerName={sale.customer_name} />
      </div>
      <SaleForm
        products={products ?? []}
        sale={sale}
        trackedProductIds={(trackedInventory ?? []).map((i) => i.product_id)}
      />
      {sale.enquiry_id && (
        <p className="mt-6 max-w-3xl text-xs text-muted-foreground">
          Linked to{" "}
          <Link href={`/admin/enquiries/${sale.enquiry_id}`} className="underline hover:text-ink">
            the original enquiry
          </Link>
          .
        </p>
      )}
    </AdminShell>
  );
}
