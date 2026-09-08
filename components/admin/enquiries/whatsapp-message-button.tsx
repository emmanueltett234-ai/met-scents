"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Records that WhatsApp was opened for this enquiry — fire-and-forget, never
// delays or blocks the wa.me navigation the anchor's href already starts.
export function WhatsappMessageButton({ enquiryId, href }: { enquiryId: string; href: string }) {
  return (
    <Button asChild variant="gold" size="lg" className="w-full">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          fetch(`/api/enquiries/${enquiryId}/whatsapp-opened`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ via: "admin_enquiry_detail" }),
          }).catch(() => {});
        }}
      >
        <MessageCircle className="h-4 w-4" /> Message on WhatsApp
      </a>
    </Button>
  );
}
