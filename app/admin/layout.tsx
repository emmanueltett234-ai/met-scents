// Scopes the admin section to a plain, functional grotesque instead of the
// storefront's editorial display serif — see the `.admin-scope` rule in
// globals.css for why this is a CSS-variable override rather than touching
// every font-serif/font-accent call site under app/admin and components/admin.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-scope">{children}</div>;
}
