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
    <div className="bg-sage">
      {/* The site's one recurring signature device: a pale sage mat framing
          every page. Measured off the reference at ~5% of canvas width on
          every edge (not a thin hairline). This used to be a `fixed`
          overlay painted on top of everything — which meant it covered the
          header/logo whenever its z-index won the stacking fight. Real
          padding instead: content can never sit "under" the mat because
          the mat IS the space around the content, not a layer floating
          over it. Sides stay visible at every scroll position; the top
          strip scrolls away once the header sticks flush to the viewport
          top, which is the correct/expected trade-off for a sticky header. */}
      <div style={{ padding: "clamp(14px, 4vw, 56px)" }}>
        <Header ownerWhatsappNumber={ownerWhatsappNumber} />
        <main className="min-h-[60vh] bg-cream">{children}</main>
        <Footer ownerWhatsappNumber={ownerWhatsappNumber} />
      </div>
      <WhatsappButton ownerWhatsappNumber={ownerWhatsappNumber} />
    </div>
  );
}
