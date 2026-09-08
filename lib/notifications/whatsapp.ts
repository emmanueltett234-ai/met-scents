import { formatGHS } from "@/lib/currency";
import type { EnquiryItem } from "@/types";

/** Strips everything except digits, for use in wa.me links. */
export function normalizeWhatsappNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** General "chat with us" link — used by the persistent WhatsApp button. */
export function buildGeneralWhatsappLink(ownerNumber: string): string {
  const message = "Hello, I'm interested in your fragrances and would like some assistance.";
  return `https://wa.me/${normalizeWhatsappNumber(ownerNumber)}?text=${encodeURIComponent(message)}`;
}

type EnquiryLineItem = Pick<EnquiryItem, "product_name" | "brand" | "size" | "price"> &
  Partial<Pick<EnquiryItem, "quantity">>;

function formatLineItem(item: EnquiryLineItem): string {
  const qty = item.quantity ?? 1;
  const unit = `${item.brand ? `${item.brand} ` : ""}${item.product_name} · ${item.size} · ${formatGHS(item.price)}`;
  return qty > 1 ? `${unit} × ${qty} = ${formatGHS(item.price * qty)}` : unit;
}

/**
 * The OWNER-facing enquiry message. WhatsApp here is click-to-chat only —
 * this string is opened in a `wa.me` link for a human (customer or admin) to
 * review and press Send; nothing is ever transmitted automatically.
 */
export function buildOwnerEnquiryWhatsappMessage(params: {
  customerName: string;
  whatsappNumber: string;
  items: EnquiryLineItem[];
  estimatedTotal: number;
  message?: string | null;
}): string {
  const lines = [
    "NEW FRAGRANCE ENQUIRY",
    "",
    "Customer:",
    params.customerName,
    "WhatsApp:",
    params.whatsappNumber,
    "",
    "Selected fragrances:",
    "",
    ...params.items.flatMap((item, i) => [
      `${i + 1}. ${item.brand ? `${item.brand} ` : ""}${item.product_name}`,
      `${item.size}${(item.quantity ?? 1) > 1 ? ` × ${item.quantity}` : ""}`,
      (item.quantity ?? 1) > 1 ? formatGHS(item.price * (item.quantity ?? 1)) : formatGHS(item.price),
      "",
    ]),
    "Estimated Total:",
    formatGHS(params.estimatedTotal),
  ];

  if (params.message) {
    lines.push("", "Customer message:", `"${params.message}"`);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Link that opens WhatsApp — pre-addressed to the OWNER, enquiry pre-filled. */
export function buildOwnerEnquiryWhatsappLink(
  ownerNumber: string,
  params: Parameters<typeof buildOwnerEnquiryWhatsappMessage>[0]
): string {
  const message = buildOwnerEnquiryWhatsappMessage(params);
  return `https://wa.me/${normalizeWhatsappNumber(ownerNumber)}?text=${encodeURIComponent(message)}`;
}

/**
 * The CUSTOMER-facing message — used by the "Send Enquiry on WhatsApp"
 * button on the My Selection page, and as the fallback offered anywhere an
 * enquiry might not have gone through cleanly. Written in the customer's own
 * voice, addressed to the shop.
 */
export function buildCustomerEnquiryWhatsappMessage(params: {
  items: EnquiryLineItem[];
  estimatedTotal: number;
  customerName?: string;
  location?: string;
  message?: string | null;
}): string {
  const lines = [
    "Hello, I'm interested in these fragrances:",
    "",
    ...params.items.map((item, i) => `${i + 1}. ${formatLineItem(item)}`),
    "",
    `Estimated total: ${formatGHS(params.estimatedTotal)}`,
  ];

  if (params.customerName) lines.push(`Name: ${params.customerName}`);
  if (params.location) lines.push(`Location: ${params.location}`);
  lines.push(params.message ? params.message : "Please let me know about availability.");

  return lines.join("\n");
}

/** Link that opens WhatsApp — pre-addressed to the SHOP, from the customer. */
export function buildCustomerEnquiryWhatsappLink(
  shopNumber: string,
  params: Parameters<typeof buildCustomerEnquiryWhatsappMessage>[0]
): string {
  const message = buildCustomerEnquiryWhatsappMessage(params);
  return `https://wa.me/${normalizeWhatsappNumber(shopNumber)}?text=${encodeURIComponent(message)}`;
}

/**
 * Used from the admin "Enquiries" screen — opens WhatsApp to the CUSTOMER
 * with a friendly, pre-filled follow-up referencing their selection, so the
 * owner can confirm availability in one tap.
 */
export function buildCustomerReplyWhatsappLink(params: {
  customerWhatsapp: string;
  customerName: string;
  items: EnquiryLineItem[];
  estimatedTotal: number;
}): string {
  const lines = [
    `Hi ${params.customerName}, thank you for your fragrance enquiry with Met Scents!`,
    "",
    "You selected:",
    ...params.items.map((item, i) => `${i + 1}. ${formatLineItem(item)}`),
    "",
    `Estimated total: ${formatGHS(params.estimatedTotal)}`,
    "",
    "Confirming availability now. I'll follow up shortly to arrange your order.",
  ];
  return `https://wa.me/${normalizeWhatsappNumber(params.customerWhatsapp)}?text=${encodeURIComponent(lines.join("\n"))}`;
}
