"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLastEnquiryStore } from "@/lib/store/last-enquiry";
import { buildCustomerEnquiryWhatsappLink } from "@/lib/notifications/whatsapp";

export function ThankYouContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = useLastEnquiryStore((s) => s.data);

  // WhatsApp is click-to-chat only, so we can't know for certain the
  // customer already pressed Send on the selection page — this stays a
  // gentle, optional nudge either way rather than an assumption.
  const showWhatsappNudge = mounted && data && data.whatsappStatus !== "sent" && data.ownerWhatsappNumber;

  const whatsappLink =
    showWhatsappNudge && data
      ? buildCustomerEnquiryWhatsappLink(data.ownerWhatsappNumber!, {
          items: data.items,
          estimatedTotal: data.estimatedTotal,
          customerName: data.customerName,
        })
      : null;

  return (
    <div className="container-luxe flex flex-col items-center gap-5 py-20 text-center">
      <CheckCircle2 className="h-12 w-12 text-accent-dark" strokeWidth={1.2} />
      <h1 className="font-serif text-3xl sm:text-4xl">Thank You!</h1>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        We&apos;ve received your fragrance selection. We&apos;ll contact you shortly to confirm
        availability and arrange your order.
      </p>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-2 border border-[#128C7E]/40 bg-[#128C7E]/5 px-6 py-3 text-sm font-medium text-[#0f6f63] transition-colors hover:bg-[#128C7E] hover:text-white"
        >
          <MessageCircle className="h-4 w-4" /> Also send this on WhatsApp for the fastest reply
        </a>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Button asChild variant="gold" size="lg">
          <Link href="/catalogue">Continue Browsing</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
