import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Toaster } from "sonner";
import { SiteChrome } from "@/components/layout/site-chrome";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-sans">
        <SiteChrome>{children}</SiteChrome>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
