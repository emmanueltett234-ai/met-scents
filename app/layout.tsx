import type { Metadata } from "next";
import { Source_Serif_4, Instrument_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getSettings } from "@/lib/data/settings";
import "./globals.css";

// Source Serif 4 — a genuine transitional serif (Adobe's book/editorial
// companion to Source Sans): sturdy stems, moderate contrast, natural
// proportions. Reads like an art book or print catalogue rather than a
// fashion-template Didone, and it's quiet enough to carry a monogram-led
// brand instead of competing with it. Carries headlines, product names and
// the occasional italic accent (prices, pull-quotes) off one family.
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Instrument Sans — a clean, contemporary grotesque with humanist warmth:
// understated rather than trendy-geometric, so nav, prices, buttons and
// labels read as considered typography rather than a SaaS interface font.
const sans = Instrument_Sans({
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
    default: `${siteName} · Discover Your Signature Scent`,
    template: `%s · ${siteName}`,
  },
  description:
    "A curated boutique of authentic, premium fragrances in Ghana, offering decants and full bottles. Browse the collection and send your selection, no checkout required.",
  openGraph: {
    title: `${siteName} · Discover Your Signature Scent`,
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
