import { SelectionPageClient } from "@/components/selection/selection-page-client";
import { getSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Selection" };

export default async function SelectionPage() {
  const settings = await getSettings();
  return <SelectionPageClient ownerWhatsappNumber={settings.owner_whatsapp_number} />;
}
