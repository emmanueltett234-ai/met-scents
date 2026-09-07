import type { Metadata } from "next";
import { Fraunces, Archivo } from "next/font/google";
import { Toaster } from "sonner";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getSettings } from "@/lib/data/settings";
import "./globals.css";

// Fraunces — a soft, editorial display serif for headings; its optical-size
// axis gives large type real character without feeling like a default
// "elegant serif" pick.
const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Archivo — a confident, slightly grotesque sans for body copy and UI,
// steering clear of the Inter-everywhere "AI template" look.
const sans = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Met Scents";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Discover Your Signature Scent`,
    template: `%s · ${siteName}`,
  },
  description:
    "A curated boutique of authentic, premium fragrances in Ghana — decants and full bottles. Browse the collection and send your selection, no checkout required.",
  openGraph: {
    title: `${siteName} — Discover Your Signature Scent`,
    description: "Explore our curated collection of premium fragrances, available in full bottles and decants.",
    siteName,
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">
        <SiteChrome ownerWhatsappNumber={settings.owner_whatsapp_number}>{children}</SiteChrome>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
