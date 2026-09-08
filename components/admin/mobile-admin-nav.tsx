"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { AdminNavContent } from "@/components/admin/admin-sidebar";

export function MobileAdminNav({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open admin menu"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </SheetTrigger>
      <SheetContent className="max-w-xs p-0">
        <div className="border-b border-border px-6 py-6">
          <Logo />
          <p className="mt-1 text-[11px] uppercase tracking-widest2 text-muted-foreground">Admin</p>
        </div>
        <AdminNavContent email={email} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
