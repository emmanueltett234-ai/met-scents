import "server-only";
import { formatGHS } from "@/lib/currency";
import type { EnquiryItem } from "@/types";

/**
 * Sends the owner-notification email via Resend. Structured so a different
 * provider (or the WhatsApp Business API, for outbound customer messages)
 * can be swapped in later without touching the call site — see
 * app/api/enquiries/route.ts, which calls this inside a try/catch so a
 * missing RESEND_API_KEY never blocks an enquiry from being saved.
 */
export async function sendOwnerEnquiryEmail(params: {
  customerName: string;
  whatsappNumber: string;
  email?: string;
  location?: string;
  message?: string;
  items: Array<Pick<EnquiryItem, "product_name" | "brand" | "size" | "price">>;
  estimatedTotal: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.OWNER_NOTIFICATION_EMAIL;

  if (!apiKey || !from || !to) {
    // Email notifications are optional — WhatsApp + the admin dashboard
    // "Enquiries" tab are always the source of truth.
    return { sent: false, reason: "Email notifications not configured" };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const itemsHtml = params.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;">${item.brand ? `${item.brand} — ` : ""}${item.product_name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${item.size}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">${formatGHS(item.price)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#141110;">
      <h2 style="font-weight:400;letter-spacing:0.05em;">New Fragrance Enquiry</h2>
      <p><strong>Customer:</strong> ${params.customerName}<br/>
      <strong>WhatsApp:</strong> ${params.whatsappNumber}<br/>
      ${params.email ? `<strong>Email:</strong> ${params.email}<br/>` : ""}
      ${params.location ? `<strong>Location:</strong> ${params.location}<br/>` : ""}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr><th style="text-align:left;padding:6px 12px;">Fragrance</th><th style="text-align:left;padding:6px 12px;">Size</th><th style="text-align:right;padding:6px 12px;">Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;"><strong>Estimated total: ${formatGHS(params.estimatedTotal)}</strong></p>
      ${params.message ? `<p><strong>Message:</strong> ${params.message}</p>` : ""}
    </div>
  `;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `New enquiry from ${params.customerName}`,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("Failed to send enquiry notification email:", err);
    return { sent: false, reason: "Send failed" };
  }
}
