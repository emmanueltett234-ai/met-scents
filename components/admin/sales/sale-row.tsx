"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TableRow } from "@/components/ui/table";

export function SaleRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(href)}>
      {children}
    </TableRow>
  );
}
