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
      quantity: 1,
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Your selection is empty." }, { status: 400 });
  }

  const estimatedTotal = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
    })
    .select()
    .single();

  if (enquiryError || !enquiry) {
    console.error("Failed to create enquiry:", enquiryError?.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
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

  // --- Notifications (best-effort, never blocks the response) ---------------
  sendOwnerEnquiryEmail({
    customerName: input.customer_name,
    whatsappNumber: input.whatsapp_number,
    email: input.email,
    location: input.location,
    message: input.message,
    items: lineItems,
    estimatedTotal,
  }).catch((err) => console.error("Email notification failed:", err));

  return NextResponse.json({
    enquiry: {
      id: enquiry.id,
      estimated_total: estimatedTotal,
      items: lineItems,
    },
  });
}
