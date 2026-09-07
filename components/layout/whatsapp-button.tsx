"use client";

import { MessageCircle } from "lucide-react";
import { buildGeneralWhatsappLink } from "@/lib/notifications/whatsapp";

export function WhatsappButton() {
  const ownerNumber = process.env.NEXT_PUBLIC_OWNER_WHATSAPP || "";
  if (!ownerNumber) return null;

  return (
    <a
      href={buildGeneralWhatsappLink(ownerNumber)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8"
    >
      <MessageCircle className="h-7 w-7" fill="white" strokeWidth={0} />
    </a>
  );
}
