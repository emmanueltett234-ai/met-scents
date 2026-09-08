"use client";

import { MessageCircle } from "lucide-react";
import { buildGeneralWhatsappLink } from "@/lib/notifications/whatsapp";

export function WhatsappButton({ ownerWhatsappNumber }: { ownerWhatsappNumber: string | null }) {
  if (!ownerWhatsappNumber) return null;

  return (
    <a
      href={buildGeneralWhatsappLink(ownerWhatsappNumber)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-transform hover:scale-105 active:scale-95 sm:bottom-8 sm:right-8 sm:h-14 sm:w-14"
    >
      <MessageCircle className="h-5 w-5 sm:h-7 sm:w-7" fill="white" strokeWidth={0} />
    </a>
  );
}
