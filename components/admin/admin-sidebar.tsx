"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Tags,
  Inbox,
  BarChart3,
  Receipt,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
}

interface NavGroup {
  label: string | null; // null = ungrouped, rendered flat (Dashboard, Settings)
  links: NavLink[];
}

export const ADMIN_NAV: NavGroup[] = [
  { label: null, links: [{ href: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true }] },
  {
    label: "Catalogue",
    links: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "Enquiries",
    links: [
      { href: "/admin/enquiries", label: "All Enquiries", icon: Inbox },
      { href: "/admin/enquiries/analytics", label: "Enquiry Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/admin/sales", label: "All Sales", icon: Receipt },
      { href: "/admin/sales/analytics", label: "Sales Analytics", icon: TrendingUp },
    ],
  },
  { label: null, links: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
];

// Shared between the fixed desktop sidebar and the mobile drawer so the two
// never drift out of sync.
export function AdminNavContent({ email, onNavigate }: { email?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(link: NavLink) {
    return link.exact ? pathname === link.href : pathname.startsWith(link.href);
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group, i) => (
          <div key={group.label ?? `group-${i}`}>
            {group.label && (
              <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest2 text-muted-foreground/70">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                      isActive(link) ? "bg-ink text-cream" : "text-ink/70 hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-6 py-4">
        {email && <p className="mb-3 truncate text-xs text-muted-foreground">{email}</p>}
        <button
          onClick={signOut}
          className="flex cursor-pointer items-center gap-2 text-xs uppercase tracking-widest2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar({ email }: { email?: string }) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-white lg:flex">
      <div className="border-b border-border px-6 py-6">
        <Logo className="pointer-events-none" />
        <p className="mt-1 text-[11px] uppercase tracking-widest2 text-muted-foreground">Admin</p>
      </div>
      <AdminNavContent email={email} />
    </aside>
  );
}
