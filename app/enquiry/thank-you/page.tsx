import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Thank You" };

export default function ThankYouPage() {
  return (
    <div className="container-luxe flex flex-col items-center gap-5 py-32 text-center">
      <CheckCircle2 className="h-12 w-12 text-gold-dark" strokeWidth={1.2} />
      <h1 className="font-serif text-3xl sm:text-4xl">Thank You!</h1>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        We&apos;ve received your fragrance selection. We&apos;ll contact you shortly to confirm
        availability and arrange your order.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Button asChild variant="gold" size="lg">
          <Link href="/catalogue">Continue Browsing</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
