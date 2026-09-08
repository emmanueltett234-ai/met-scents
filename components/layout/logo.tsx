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
        width={56}
        height={56}
        className={cn("h-12 w-12 object-contain sm:h-[3.25rem] sm:w-[3.25rem]", dark && "invert")}
        priority
      />
      <span className="font-serif text-lg uppercase tracking-[0.25em]">
        Met <span className={dark ? "text-accent-light" : "text-accent-dark"}>Scents</span>
      </span>
    </Link>
  );
}
