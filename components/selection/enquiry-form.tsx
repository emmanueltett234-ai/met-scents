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
import { buildOwnerEnquiryWhatsappLink } from "@/lib/notifications/whatsapp";

export function EnquiryForm() {
  const router = useRouter();
  const items = useSelectionStore((s) => s.items);
  const clear = useSelectionStore((s) => s.clear);

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

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(via: "save" | "whatsapp") {
    if (items.length === 0) {
      toast.error("Add at least one fragrance to your selection first.");
      return;
    }
    setSubmitting(via);
    setErrors({});

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        toast.error(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (via === "whatsapp") {
        const ownerNumber = process.env.NEXT_PUBLIC_OWNER_WHATSAPP || "";
        if (ownerNumber) {
          const link = buildOwnerEnquiryWhatsappLink(ownerNumber, {
            customerName: form.customer_name,
            whatsappNumber: form.whatsapp_number,
            items: data.enquiry.items,
            estimatedTotal: data.enquiry.estimated_total,
            message: form.message,
          });
          window.open(link, "_blank", "noopener,noreferrer");
        }
      }

      clear();
      router.push("/enquiry/thank-you");
    } catch (err) {
      toast.error("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("save");
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

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="submit" size="lg" variant="gold" disabled={submitting !== null} className="flex-1">
          {submitting === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send My Selection
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={submitting !== null}
          onClick={() => submit("whatsapp")}
          className="flex-1 border-[#25D366]/50 text-[#128C7E] hover:bg-[#25D366] hover:text-white"
        >
          {submitting === "whatsapp" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
          Send via WhatsApp
        </Button>
      </div>
    </form>
  );
}
