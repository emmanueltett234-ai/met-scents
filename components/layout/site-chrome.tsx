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
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsappButton />
    </>
  );
}
