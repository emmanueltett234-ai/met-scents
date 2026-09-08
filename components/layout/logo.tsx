import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** `dark` means "sitting on a dark background" — renders the mark and wordmark light. */
export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-3", dark ? "text-cream" : "text-ink", className)}
    >
      <Image
        src="/logo.png"
        alt="Met Scents"
        width={40}
        height={40}
        className={cn("h-9 w-9 object-contain", dark && "invert")}
        priority
      />
      <span className="font-serif text-base uppercase tracking-[0.25em]">
        Met <span className={dark ? "text-accent-light" : "text-accent-dark"}>Scents</span>
      </span>
    </Link>
  );
}
