import { formatGHS } from "@/lib/currency";
import type { EnquiryItem } from "@/types";

/**
 * Normalizes any commonly-entered Ghana WhatsApp number format into the
 * digits-only, country-code-prefixed form `wa.me` requires — this is the
 * ONLY place this conversion happens; every WhatsApp link in the app is
 * built from a number that has passed through this function first.
 *
 * Handles, for a real number like +233 50 214 6333:
 *   "+233 50 214 6333"  -> "233502146333"  (already correct, just stripped)
 *   "233 50 214 6333"   -> "233502146333"  (already correct, just stripped)
 *   "0502146333"        -> "233502146333"  (local format: 0 -> 233)
 *   "050-214-6333"      -> "233502146333"  (local format, punctuated)
 *   "2330502146333"     -> "233502146333"  (country code + stray local 0)
 *   "502146333"         -> "233502146333"  (bare 9-digit local, no 0)
 *
 * Without this, a locally-formatted number like 0502146333 would be passed
 * straight through to wa.me, producing an invalid destination WhatsApp
 * reports as "isn't on WhatsApp" — because 0502146333 is never a real
 * international WhatsApp ID; 233502146333 is.
 */
export function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  // Ghana local mobile format: 0XXXXXXXXX (10 digits, leading 0).
  // Drop the 0, prefix the country code.
  if (digits.length === 10 && digits.startsWith("0")) {
    return `233${digits.slice(1)}`;
  }

  // Country code already present but with the local leading 0 left in
  // (e.g. someone typed "233 0502146333"): 233 + 0XXXXXXXXX = 13 digits.
  if (digits.length === 13 && digits.startsWith("2330")) {
    return `233${digits.slice(4)}`;
  }

  // Bare 9-digit local subscriber number, no leading 0 and no country code.
  if (digits.length === 9 && !digits.startsWith("233")) {
    return `233${digits}`;
  }

  // Already in a valid digits-only international form (e.g. 233502146333) —
  // nothing further to do.
  return digits;
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
  whatsappNumber?: string;
  email?: string;
  location?: string;
  message?: string | null;
}): string {
  const lines = [
    "Hello Met Scents, I'd like to enquire about:",
    "",
    ...params.items.map((item, i) => `${i + 1}. ${formatLineItem(item)}`),
    "",
    `Estimated Total: ${formatGHS(params.estimatedTotal)}`,
    "",
  ];

  // Only ever include fields that actually have a value — never render
  // "Email: " or "Location: " as dead labels for something the customer
  // left blank.
  if (params.customerName) lines.push(`Customer Name: ${params.customerName}`);
  if (params.whatsappNumber) lines.push(`WhatsApp Number: ${params.whatsappNumber}`);
  if (params.email) lines.push(`Email: ${params.email}`);
  if (params.location) lines.push(`Delivery / Location: ${params.location}`);
  lines.push(params.message ? `Message: ${params.message}` : "Please let me know about availability.");

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
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
