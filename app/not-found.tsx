import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="kicker mb-5 text-muted-foreground">404</p>
      <h1 className="max-w-lg font-serif text-3xl leading-tight sm:text-4xl">
        The scent has gone elsewhere.
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist, or may have moved.
      </p>
      <Button asChild variant="gold" size="lg" className="mt-9">
        <Link href="/catalogue">Back to Collection</Link>
      </Button>
    </div>
  );
}
