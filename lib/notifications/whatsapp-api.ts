import "server-only";

/**
 * Optional automatic WhatsApp notification via the official Meta WhatsApp
 * Cloud API. This is what actually lets the *website* send a message to the
 * owner without the customer doing anything — a plain `wa.me` link can only
 * ever open WhatsApp for a human to press send, it cannot send on its own.
 *
 * Disabled by default. To enable it:
 *   1. Create a Meta for Developers app with the WhatsApp product added.
 *   2. Add WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_CLOUD_API_PHONE_NUMBER_ID
 *      to your environment variables (server-only — never exposed to the
 *      browser; there is no NEXT_PUBLIC_ prefix on either).
 *   3. Business-initiated messages outside a customer-started 24h session
 *      require an approved message template — see Meta's docs. Until a
 *      template is approved, this will fail gracefully and the app falls
 *      back to the customer-initiated `wa.me` link, which always works.
 *
 * Every enquiry is saved regardless of whether this succeeds — see
 * app/api/enquiries/route.ts, which records the outcome on the enquiry row
 * so the admin dashboard always shows the truth rather than a false
 * "notified" status.
 */
export function isWhatsappApiConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID);
}

export async function sendOwnerWhatsappNotification(params: {
  toNumber: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, error: "not_configured" };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.toNumber.replace(/[^\d]/g, ""),
        type: "text",
        text: { body: params.message },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `WhatsApp API error (${res.status}): ${body.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
