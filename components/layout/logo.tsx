import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 shrink-0", className)}>
      <Image
        src="/logo.png"
        alt="Met Scents"
        width={40}
        height={40}
        className={cn("h-9 w-9 object-contain", dark && "invert")}
        priority
      />
      <span className="font-serif text-lg tracking-wide">
        Met <span className="text-gold-dark">Scents</span>
      </span>
    </Link>
  );
}
