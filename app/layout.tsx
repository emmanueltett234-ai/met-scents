import type { Metadata } from "next";
import { Bodoni_Moda, Archivo, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getSettings } from "@/lib/data/settings";
import "./globals.css";

// Bodoni Moda — a genuine high-contrast Didone, matched to the direct style
// reference's headline character (thin hairlines against bold vertical
// stems, the dramatic "fashion house" serif register the reference actually
// uses, not a quiet book serif). Carries headlines, product names, and the
// italic accent (prices, pull-quotes) off one family.
const serif = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Archivo — a confident, slightly industrial grotesque with real weight
// contrast at its heavier cuts. Carries nav, prices, buttons and the tracked
// small-caps labels with more presence than a default UI grotesque, closer
// to a printed gallery label than a SaaS interface font.
const sans = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Inter — the standard, near-universal SaaS/admin-dashboard grotesque
// (Linear, Notion, Stripe's dashboard, etc.). Used only inside /admin (see
// `.admin-scope` in globals.css), so the storefront keeps its own Archivo +
// Bodoni Moda identity untouched.
const adminSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-admin",
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
  verification: {
    google: "vDHXy6Mmge3ohUxgolp_gFc6ZIoipoUOh1rP3ygrtMQ",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${adminSans.variable}`}>
      <body className="font-sans">
        <SiteChrome ownerWhatsappNumber={settings.owner_whatsapp_number}>{children}</SiteChrome>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
