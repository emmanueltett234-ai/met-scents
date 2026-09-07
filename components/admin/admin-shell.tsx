import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
      <div className="flex-1">
        {title && (
          <div className="flex items-center justify-between border-b border-border bg-white px-8 py-6">
            <h1 className="font-serif text-2xl">{title}</h1>
            {action}
          </div>
        )}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
