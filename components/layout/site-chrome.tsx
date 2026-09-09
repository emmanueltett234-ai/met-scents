"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsappButton } from "@/components/layout/whatsapp-button";

/**
 * The admin dashboard has its own sidebar/shell (see components/admin/admin-shell.tsx)
 * and shouldn't show the customer-facing header, footer or floating WhatsApp
 * button — this wrapper hides them for any /admin route.
 */
export function SiteChrome({
  children,
  ownerWhatsappNumber,
}: {
  children: React.ReactNode;
  ownerWhatsappNumber: string | null;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {/* The site's one recurring signature device: a sage mat framing the
          whole viewport, like a print set behind glass. Fixed, not scrolled
          content, so it holds at every scroll position; pointer-events-none
          so it never intercepts a click. Public storefront only — the admin
          stays a tool, not a gallery piece. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-40 border-[10px] border-sage sm:border-[16px]" />
      <Header ownerWhatsappNumber={ownerWhatsappNumber} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer ownerWhatsappNumber={ownerWhatsappNumber} />
      <WhatsappButton ownerWhatsappNumber={ownerWhatsappNumber} />
    </>
  );
}
