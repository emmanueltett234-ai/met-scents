"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Package, Tags, Inbox, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-6 py-6">
        <p className="font-serif text-lg">Met Scents</p>
        <p className="text-[11px] uppercase tracking-widest2 text-muted-foreground">Admin</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                active ? "bg-ink text-cream" : "text-ink/70 hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-6 py-4">
        {email && <p className="mb-3 truncate text-xs text-muted-foreground">{email}</p>}
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs uppercase tracking-widest2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
