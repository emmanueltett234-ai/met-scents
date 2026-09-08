"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSelectionStore } from "@/lib/store/selection";
import { useLastEnquiryStore } from "@/lib/store/last-enquiry";
import { buildCustomerEnquiryWhatsappLink } from "@/lib/notifications/whatsapp";

export function EnquiryForm({ ownerWhatsappNumber }: { ownerWhatsappNumber: string | null }) {
  const router = useRouter();
  const items = useSelectionStore((s) => s.items);
  const clear = useSelectionStore((s) => s.clear);
  const setLastEnquiry = useLastEnquiryStore((s) => s.set);

  const [form, setForm] = useState({
    customer_name: "",
    whatsapp_number: "",
    email: "",
    location: "",
    message: "",
    website: "", // honeypot
  });
  const [submitting, setSubmitting] = useState<"save" | "whatsapp" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const localWhatsappFallback =
    items.length > 0 && ownerWhatsappNumber
      ? buildCustomerEnquiryWhatsappLink(ownerWhatsappNumber, {
          items: items.map((i) => ({
            product_name: i.name,
            brand: i.brand,
            size: i.size,
            price: i.price,
            quantity: i.quantity,
          })),
          estimatedTotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
          customerName: form.customer_name || undefined,
          whatsappNumber: form.whatsapp_number || undefined,
          email: form.email || undefined,
          location: form.location || undefined,
          message: form.message || undefined,
        })
      : null;

  async function submit(via: "save" | "whatsapp") {
    if (items.length === 0) {
      toast.error("Add at least one fragrance to your selection first.");
      return;
    }
    setSubmitting(via);
    setErrors({});
    setSubmitError(null);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setSubmitError(
          data.error ||
            "We couldn't submit your enquiry. Please try again or contact us directly on WhatsApp."
        );
        return;
      }

      setLastEnquiry({
        customerName: form.customer_name,
        whatsappNumber: form.whatsapp_number,
        email: form.email || undefined,
        location: form.location || undefined,
        items: data.enquiry.items,
        estimatedTotal: data.enquiry.estimated_total,
        // WhatsApp itself was already opened (synchronously, from the click
        // handler below) before this save even started, so from the
        // customer's point of view it's "sent" the moment they chose that
        // button — the Thank You page shouldn't nudge them to do it again.
        whatsappStatus: via === "whatsapp" ? "sent" : data.enquiry.whatsapp_status,
        ownerWhatsappNumber: data.ownerWhatsappNumber || ownerWhatsappNumber,
      });

      clear();
      router.push("/enquiry/thank-you");
    } catch {
      setSubmitError(
        "We couldn't submit your enquiry. Please try again or contact us directly on WhatsApp."
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (ownerWhatsappNumber) {
          if (items.length === 0) {
            toast.error("Add at least one fragrance to your selection first.");
            return;
          }

          // Open WhatsApp FIRST, synchronously, in the same tick as the
          // click — this is what makes it reliable on mobile. Browsers
          // (iOS Safari in particular) only honour window.open() as a
          // direct, un-blocked navigation when it happens inside the same
          // call stack as the user's tap, with no `await` in between. The
          // previous version opened WhatsApp only after `await fetch(...)`
          // resolved, which broke that gesture link and made the button
          // silently do nothing on many phones.
          //
          // The pre-filled message uses the current selection as already
          // held in the cart (each item's price came from the database at
          // the moment it was added), so nothing here waits on the network.
          if (localWhatsappFallback) {
            window.open(localWhatsappFallback, "_blank", "noopener,noreferrer");
          }

          // Save the enquiry in the background. WhatsApp is already open by
          // the time this resolves, so a slow network or a failed save can
          // no longer prevent the customer from reaching WhatsApp.
          submit("whatsapp");
        } else {
          submit("save");
        }
      }}
      className="space-y-5"
    >
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => update("website", e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div>
        <Label htmlFor="customer_name">Full Name *</Label>
        <Input
          id="customer_name"
          required
          className="mt-2"
          value={form.customer_name}
          onChange={(e) => update("customer_name", e.target.value)}
          placeholder="Ama Owusu"
        />
        {errors.customer_name && <p className="mt-1 text-xs text-destructive">{errors.customer_name}</p>}
      </div>

      <div>
        <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
        <Input
          id="whatsapp_number"
          required
          className="mt-2"
          value={form.whatsapp_number}
          onChange={(e) => update("whatsapp_number", e.target.value)}
          placeholder="024 123 4567"
        />
        {errors.whatsapp_number && <p className="mt-1 text-xs text-destructive">{errors.whatsapp_number}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          className="mt-2"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="location">Delivery / Location (optional)</Label>
        <Input
          id="location"
          className="mt-2"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="East Legon, Accra"
        />
      </div>

      <div>
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          className="mt-2"
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Any questions or delivery notes…"
        />
      </div>

      {submitError && (
        <div className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{submitError}</p>
          {localWhatsappFallback && (
            <a
              href={localWhatsappFallback}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest2 underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Contact us on WhatsApp instead
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        {ownerWhatsappNumber ? (
          <>
            <Button
              type="submit"
              size="lg"
              variant="gold"
              disabled={submitting !== null}
              className="flex-1 bg-[#128C7E] text-white hover:bg-[#0f6f63]"
            >
              {submitting === "whatsapp" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Send via WhatsApp
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              disabled={submitting !== null}
              onClick={() => submit("save")}
              className="flex-1"
            >
              {submitting === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Enquiry
            </Button>
          </>
        ) : (
          <Button type="submit" size="lg" variant="default" disabled={submitting !== null} className="flex-1">
            {submitting === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Enquiry
          </Button>
        )}
      </div>
      {ownerWhatsappNumber && (
        <p className="text-xs text-muted-foreground">
          Your enquiry is saved either way. &ldquo;Send via WhatsApp&rdquo; also opens WhatsApp with
          your selection pre-filled, so you just press Send.
        </p>
      )}
    </form>
  );
}
