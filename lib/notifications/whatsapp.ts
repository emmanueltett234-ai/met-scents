import { formatGHS } from "@/lib/currency";
import type { EnquiryItem } from "@/types";

/** Strips everything except digits, for use in wa.me links. */
export function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** General "chat with us" link — used by the persistent WhatsApp button. */
export function buildGeneralWhatsappLink(ownerNumber: string): string {
  const message = "Hello, I'm interested in some fragrances from your catalogue.";
  return `https://wa.me/${normalizeWhatsappNumber(ownerNumber)}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the pre-filled WhatsApp message the OWNER receives when an enquiry
 * comes in — used both server-side (for the admin dashboard "open in
 * WhatsApp" action) and to give the customer a "send via WhatsApp too"
 * option on the confirmation screen.
 */
export function buildEnquiryWhatsappMessage(params: {
  customerName: string;
  whatsappNumber: string;
  items: Array<Pick<EnquiryItem, "product_name" | "brand" | "size" | "price">>;
  estimatedTotal: number;
  message?: string | null;
}): string {
  const lines = [
    "New fragrance enquiry",
    `Customer: ${params.customerName}`,
    `WhatsApp: ${params.whatsappNumber}`,
    "",
    "Selected fragrances:",
    ...params.items.map(
      (item, i) =>
        `${i + 1}. ${item.brand ? `${item.brand} — ` : ""}${item.product_name} — ${item.size} — ${formatGHS(item.price)}`
    ),
    "",
    `Estimated total: ${formatGHS(params.estimatedTotal)}`,
  ];

  if (params.message) {
    lines.push("", `Message: ${params.message}`);
  }

  return lines.join("\n");
}

/** Link that opens WhatsApp to the OWNER with the enquiry pre-filled. */
export function buildOwnerEnquiryWhatsappLink(
  ownerNumber: string,
  params: Parameters<typeof buildEnquiryWhatsappMessage>[0]
): string {
  const message = buildEnquiryWhatsappMessage(params);
  return `https://wa.me/${normalizeWhatsappNumber(ownerNumber)}?text=${encodeURIComponent(message)}`;
}

/**
 * Used from the admin "Enquiries" screen — opens WhatsApp to the CUSTOMER
 * with a friendly, pre-filled follow-up referencing their selection, so the
 * owner can confirm availability in one tap.
 */
export function buildCustomerReplyWhatsappLink(params: {
  customerWhatsapp: string;
  customerName: string;
  items: Array<Pick<EnquiryItem, "product_name" | "brand" | "size" | "price">>;
  estimatedTotal: number;
}): string {
  const lines = [
    `Hi ${params.customerName}, thank you for your fragrance enquiry with Met Scents!`,
    "",
    "You selected:",
    ...params.items.map(
      (item, i) =>
        `${i + 1}. ${item.brand ? `${item.brand} — ` : ""}${item.product_name} — ${item.size} — ${formatGHS(item.price)}`
    ),
    "",
    `Estimated total: ${formatGHS(params.estimatedTotal)}`,
    "",
    "Confirming availability now — I'll follow up shortly to arrange your order.",
  ];
  return `https://wa.me/${normalizeWhatsappNumber(params.customerWhatsapp)}?text=${encodeURIComponent(lines.join("\n"))}`;
}
