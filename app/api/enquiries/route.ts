import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enquirySubmissionSchema } from "@/lib/validation";
import { sendOwnerEnquiryEmail } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

// ----------------------------------------------------------------------------
// Very small in-memory rate limiter. Good enough to stop casual abuse on a
// single serverless instance; for real production scale behind multiple
// Vercel instances, swap this for Upstash Redis / Vercel KV — the interface
// below (checkRateLimit) is the only thing that would need to change.
// ----------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  hits.set(ip, timestamps);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many enquiries submitted. Please try again in a little while." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot: bots fill every field, including the hidden "website" input.
  // Real submissions never do, since the schema requires it to be empty.
  const parsed = enquirySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { error: "Please check the form and try again.", fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Silently "succeed" on honeypot trips without writing anything.
  if (input.website) {
    return NextResponse.json({ enquiry: { id: "ok", estimated_total: 0, items: [] } });
  }

  const supabase = createAdminClient();

  // --- Server-side price recalculation -------------------------------------
  // Never trust prices from the browser. Re-fetch each product + variant and
  // rebuild the line items (and total) from what's actually in the database
  // right now.
  const uniqueVariantIds = Array.from(new Set(input.items.map((i) => i.variant_id)));

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, product_id, size, price, availability, products(id, name, brand, availability)")
    .in("id", uniqueVariantIds);

  if (variantsError) {
    console.error("Failed to fetch variants for enquiry:", variantsError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  const lineItems: {
    product_id: string;
    product_name: string;
    brand: string;
    size: string;
    price: number;
    quantity: number;
  }[] = [];

  for (const requested of input.items) {
    const variant = variantMap.get(requested.variant_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = (variant as any)?.products;

    if (!variant || !product || variant.product_id !== requested.product_id) {
      return NextResponse.json(
        { error: "One or more selected items are no longer available. Please refresh your selection." },
        { status: 400 }
      );
    }

    if (variant.availability === "out_of_stock" || product.availability === "out_of_stock") {
      return NextResponse.json(
        { error: `${product.brand} ${product.name} (${variant.size}) is currently out of stock and can't be submitted.` },
        { status: 400 }
      );
    }

    lineItems.push({
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      size: variant.size,
      price: Number(variant.price),
      quantity: requested.quantity ?? 1,
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Your selection is empty." }, { status: 400 });
  }

  const estimatedTotal = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // WhatsApp is click-to-chat only: `whatsapp_opened` just means wa.me was
  // opened on the customer's device (set by the client when it used the
  // "Send via WhatsApp" button), never that a message was actually sent.
  const whatsappOpened = input.whatsapp_opened === true;
  const nowIso = new Date().toISOString();

  // --- Persist ---------------------------------------------------------------
  const { data: enquiry, error: enquiryError } = await supabase
    .from("enquiries")
    .insert({
      customer_name: input.customer_name,
      whatsapp_number: input.whatsapp_number,
      email: input.email ?? null,
      location: input.location ?? null,
      message: input.message ?? null,
      estimated_total: estimatedTotal,
      status: "new",
      // Every enquiry this route creates came from the website submission
      // form, so this is a known fact, not a guess.
      enquiry_source: "website",
      whatsapp_opened: whatsappOpened,
      whatsapp_opened_at: whatsappOpened ? nowIso : null,
    })
    .select()
    .single();

  if (enquiryError || !enquiry) {
    console.error("Failed to create enquiry:", enquiryError?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Activity timeline — best-effort, never blocks the enquiry from saving.
  const activityRows = [
    { enquiry_id: enquiry.id, event_type: "enquiry_created", metadata: { source: "website" } },
    ...(whatsappOpened
      ? [{ enquiry_id: enquiry.id, event_type: "whatsapp_opened", metadata: { via: "selection_page" } }]
      : []),
  ];
  const { error: activityError } = await supabase.from("enquiry_activities").insert(activityRows);
  if (activityError) {
    console.error("Failed to log enquiry activity:", activityError.message);
  }

  const { error: itemsError } = await supabase.from("enquiry_items").insert(
    lineItems.map((item) => ({
      enquiry_id: enquiry.id,
      product_id: item.product_id,
      product_name: item.product_name,
      brand: item.brand,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    console.error("Failed to save enquiry items:", itemsError.message);
    // Enquiry row exists but items failed — still tell the owner so nothing
    // is silently lost; the admin dashboard will show the row with no items.
  }

  // --- Notifications ----------------------------------------------------
  // The enquiry is already saved at this point — nothing below can ever
  // cause it to be lost, and the customer is never told a notification
  // "sent" when it didn't. Every outcome is written back onto the enquiry
  // row so /admin/enquiries always shows the truth.
  //
  // WhatsApp is intentionally click-to-chat only — there is no server-side
  // WhatsApp API integration. The customer's own "Send on WhatsApp" button
  // (built client-side in lib/notifications/whatsapp.ts) is the real
  // delivery channel; whatsapp_status here just stays "not_configured" since
  // nothing is ever sent automatically from the server.
  const { data: settings } = await supabase.from("settings").select("*").eq("id", "default").maybeSingle();

  const ownerWhatsappNumber = settings?.owner_whatsapp_number || process.env.NEXT_PUBLIC_OWNER_WHATSAPP || "";
  const ownerEmail = settings?.owner_notification_email || process.env.OWNER_NOTIFICATION_EMAIL || "";
  const emailEnabled = settings?.email_notifications_enabled ?? true;

  const whatsappStatus: "not_configured" | "sent" | "failed" = "not_configured";
  const whatsappError: string | null = null;

  let emailStatus: "not_configured" | "sent" | "failed" = "not_configured";
  let emailError: string | null = null;

  if (emailEnabled && ownerEmail) {
    const result = await sendOwnerEnquiryEmail({
      customerName: input.customer_name,
      whatsappNumber: input.whatsapp_number,
      email: input.email,
      location: input.location,
      message: input.message,
      items: lineItems,
      estimatedTotal,
    }).catch((err) => ({ sent: false as const, reason: err instanceof Error ? err.message : "Unknown error" }));

    if (result.sent) {
      emailStatus = "sent";
    } else if (result.reason !== "Email notifications not configured") {
      emailStatus = "failed";
      emailError = result.reason ?? null;
    }
  }

  await supabase
    .from("enquiries")
    .update({
      whatsapp_status: whatsappStatus,
      whatsapp_error: whatsappError,
      email_status: emailStatus,
      email_error: emailError,
    })
    .eq("id", enquiry.id);

  return NextResponse.json({
    enquiry: {
      id: enquiry.id,
      estimated_total: estimatedTotal,
      items: lineItems,
      whatsapp_status: whatsappStatus,
      email_status: emailStatus,
      enquiry_source: "website",
      whatsapp_opened: whatsappOpened,
      whatsapp_opened_at: whatsappOpened ? nowIso : null,
    },
    ownerWhatsappNumber,
  });
}
