import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileAdminNav } from "@/components/admin/mobile-admin-nav";
import { Logo } from "@/components/layout/logo";

export async function AdminShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <AdminSidebar email={user?.email} />
      <div className="min-w-0 flex-1">
        {/* Mobile-only top bar — the fixed sidebar hides below `lg`, so this
            is the only way to reach navigation on a phone/tablet. */}
        <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
          <MobileAdminNav email={user?.email} />
          <Logo className="pointer-events-none" />
        </div>

        {title && (
          <div className="flex flex-col gap-3 border-b border-border bg-white px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
            <h1 className="min-w-0 font-serif text-2xl">{title}</h1>
            {action && <div className="min-w-0">{action}</div>}
          </div>
        )}
        <div className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
