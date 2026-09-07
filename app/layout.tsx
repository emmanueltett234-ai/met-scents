import type { Metadata } from "next";
import { Old_Standard_TT, IBM_Plex_Mono, Karla } from "next/font/google";
import { Toaster } from "sonner";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getSettings } from "@/lib/data/settings";
import "./globals.css";

// Old Standard TT — a genuine early-1900s book/label serif, the kind of
// face stamped on real apothecary bottles and pharmacy ledgers. Carries the
// "specimen catalogue" concept in the headlines themselves, rather than a
// generic "elegant" display serif.
const serif = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// IBM Plex Mono — the "data" voice of the site: prices, sizes, specimen
// index numbers, and micro-labels all set in mono so they read like
// measurements on a lab label rather than marketing copy.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

// Karla — a warm, humanist sans for body copy; quiet enough to let the
// serif headlines and mono data do the talking.
const sans = Karla({
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
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <SiteChrome ownerWhatsappNumber={settings.owner_whatsapp_number}>{children}</SiteChrome>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
