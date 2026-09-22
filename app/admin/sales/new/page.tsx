import { AdminShell } from "@/components/admin/admin-shell";
import { SaleForm } from "@/components/admin/sales/sale-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewSalePage({ searchParams }: { searchParams: { enquiry_id?: string } }) {
  const supabase = createClient();

  const [{ data: products }, { data: trackedInventory }, prefillData] = await Promise.all([
    supabase.from("products").select("id, brand, name, product_variants(id, size, price, size_ml)").order("brand"),
    supabase.from("product_inventory").select("product_id"),
    searchParams.enquiry_id
      ? Promise.all([
          supabase.from("enquiries").select("*").eq("id", searchParams.enquiry_id).maybeSingle(),
          supabase.from("enquiry_items").select("*").eq("enquiry_id", searchParams.enquiry_id),
        ])
      : Promise.resolve(null),
  ]);

  const prefill = prefillData
    ? (() => {
        const [{ data: enquiry }, { data: items }] = prefillData;
        if (!enquiry) return undefined;
        return {
          enquiryId: enquiry.id,
          customerName: enquiry.customer_name,
          whatsappNumber: enquiry.whatsapp_number,
          items: (items ?? []).map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            brand: i.brand ?? "",
            size: i.size,
            price: Number(i.price),
            quantity: i.quantity,
          })),
        };
      })()
    : undefined;

  return (
    <AdminShell title="Record Sale">
      <SaleForm
        products={products ?? []}
        prefill={prefill}
        trackedProductIds={(trackedInventory ?? []).map((i) => i.product_id)}
      />
    </AdminShell>
  );
}
