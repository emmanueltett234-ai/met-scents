import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { SaleForm } from "@/components/admin/sales/sale-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: sale }, { data: products }] = await Promise.all([
    supabase.from("sales").select("*, sale_items(*)").eq("id", params.id).maybeSingle(),
    supabase.from("products").select("id, brand, name, product_variants(id, size, price)").order("brand"),
  ]);

  if (!sale) notFound();

  return (
    <AdminShell title="Sale Detail">
      <Link href="/admin/sales" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to Sales
      </Link>
      <SaleForm products={products ?? []} sale={sale} />
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
